require 'securerandom'

module ReleasesHelper
  def create_release(project, export_config, version)
    timestamp = Time.now.utc.iso8601

    # Create the release
    release = Release.new
    release.export_config = export_config
    release.version = version
    release.timestamp = timestamp
    release.save!

    # Create a file for every language
    project
      .languages
      .where
      .not(language_code: nil)
      .each do |language|
        release_file_id = SecureRandom.uuid

        bucket_path = "#{project.id}/#{export_config.id}/#{version}-#{timestamp}/#{release_file_id}.json"

        file = Tempfile.new(project.id)

        begin
          create_release_export(project, export_config, language, file, timestamp)
        ensure
          file.close
        end

        # Store the file in the cloud
        unless Rails.env.test?
          storage = Google::Cloud::Storage.new
          bucket = storage.bucket(ENV.fetch('GOOGLE_CLOUD_OTA_BUCKET_NAME'), skip_lookup: true)
          file = bucket.create_file(file.path, bucket_path)
        end

        release_file = ReleaseFile.new
        release_file.id = release_file_id
        release_file.release = release
        release_file.preview_url = Rails.env.test? ? 'http://localhost/preview-url' : file.url
        release_file.url = Rails.env.test? ? 'http://localhost/url' : file.media_url
        release_file.language_code = language.language_code.code
        release_file.country_code = language.country_code ? language.country_code.code : nil
        release_file.save!
      end

    release
  end

  def create_release_export(project, export_config, language, file, timestamp)
    post_processing_rules = project.post_processing_rules.where(export_config_id: [export_config.id, nil]).order_by_name

    language_data =
      Texterify::Export.create_language_export_data(
        project,
        export_config,
        language,
        post_processing_rules,
        skip_timestamp: true
      )

    export_data = {
      is_default: language.is_default,
      language_code: language.language_code&.code,
      country_code: language.country_code&.code,
      texts: language_data.map { |key, value| { key: key, value: value } },
      plurals: [] # TODO: Add plural support
    }

    file.puts({ timestamp: timestamp, data: export_data }.to_json)
  end
end
