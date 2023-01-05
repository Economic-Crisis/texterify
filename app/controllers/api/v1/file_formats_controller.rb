class Api::V1::FileFormatsController < Api::V1::ApiController
  skip_before_action :verify_signed_in, only: :index

  # Public route
  def index
    skip_authorization

    file_formats = FileFormat.all.order_by_name
    render json: FileFormatSerializer.new(file_formats).serialized_json
  end
end
