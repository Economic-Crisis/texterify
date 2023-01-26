require 'rails_helper'
require 'json'

PROJECT_ATTRIBUTES = [
  'id',
  'name',
  'description',
  'current_user_role',
  'current_user_role_source',
  'enabled_features',
  'machine_translation_enabled',
  'auto_translate_new_keys',
  'auto_translate_new_languages',
  'machine_translation_active',
  'machine_translation_character_usage',
  'character_count',
  'word_count',
  'validate_leading_whitespace',
  'validate_trailing_whitespace',
  'validate_double_whitespace',
  'validate_https',
  'current_user_in_project',
  'current_user_in_project_organization',
  'organization_id',
  'current_user_deactivated',
  'current_user_deactivated_reason',
  'issues_count',
  'placeholder_end',
  'placeholder_start'
].freeze

RSpec.describe Api::V1::ProjectsController, type: :request do
  before(:each) do |test|
    unless test.metadata[:skip_before]
      @user = create(:user)
      @organization = create(:organization)
      @user.organizations << @organization
      @auth_params = sign_in(@user)
    end
  end

  describe 'GET index' do
    it 'has status code 403 if not logged in', :skip_before do
      get '/api/v1/projects'
      expect(response).to have_http_status(:forbidden)
    end

    it 'has status code 200 if logged in and returns empty array' do
      get '/api/v1/projects', headers: @auth_params

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data']).to eq([])
      expect(body['meta']['total']).to eq(0)
    end

    it 'returns projects', :skip_before do
      number_of_projects = 11
      user = create(:user_with_projects, projects_count: number_of_projects)
      auth_params = sign_in(user)
      get '/api/v1/projects', headers: auth_params

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data'].length).to eq(10)
      expect(body['data'][0].keys).to contain_exactly('attributes', 'id', 'relationships', 'type')
      expect(body['data'][0]['attributes'].keys).to contain_exactly(*PROJECT_ATTRIBUTES)
      expect(body['meta']['total']).to eq(number_of_projects)
    end

    it 'returns projects with 2 per page', :skip_before do
      number_of_projects = 4
      per_page = 2
      user = create(:user_with_projects, projects_count: number_of_projects)
      auth_params = sign_in(user)
      get '/api/v1/projects', headers: auth_params, params: { per_page: per_page }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data'].length).to eq(per_page)
      expect(body['meta']['total']).to eq(number_of_projects)
    end

    it 'returns 10 projects if per_page is set to 0', :skip_before do
      number_of_projects = 11
      per_page = 0
      user = create(:user_with_projects, projects_count: number_of_projects)
      auth_params = sign_in(user)
      get '/api/v1/projects', headers: auth_params, params: { per_page: per_page }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data'].length).to eq(10)
      expect(body['meta']['total']).to eq(number_of_projects)
    end

    it 'returns the first 2 projects if page is set to 1 and per_page to 2', :skip_before do
      number_of_projects = 4
      per_page = 2
      user = create(:user_with_projects, projects_count: number_of_projects)
      auth_params = sign_in(user)
      get '/api/v1/projects', headers: auth_params, params: { per_page: per_page, page: 1 }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      user_projects_ordered = user.projects.order('lower(name) ASC')
      expect(body['data'].length).to eq(per_page)
      expect(body['data'][0]['id']).to eq(user_projects_ordered[0].id)
      expect(body['data'][1]['id']).to eq(user_projects_ordered[1].id)
      expect(body['meta']['total']).to eq(number_of_projects)
    end

    it 'returns the 3rd and 4th project if page is set to 2 and per_page to 2', :skip_before do
      number_of_projects = 4
      per_page = 2
      user = create(:user_with_projects, projects_count: number_of_projects)
      auth_params = sign_in(user)
      get '/api/v1/projects', headers: auth_params, params: { per_page: per_page, page: 2 }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      user_projects_ordered = user.projects.order('lower(name) ASC')
      expect(body['data'].length).to eq(per_page)
      expect(body['data'][0]['id']).to eq(user_projects_ordered[2].id)
      expect(body['data'][1]['id']).to eq(user_projects_ordered[3].id)
      expect(body['meta']['total']).to eq(number_of_projects)
    end

    it 'is possible to provide a search criteria', :skip_before do
      number_of_projects = 1
      user = create(:user_with_projects, projects_count: number_of_projects)
      auth_params = sign_in(user)
      get '/api/v1/projects', headers: auth_params, params: { search: "'no project has this name--" }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data'].length).to eq(0)
      expect(body['meta']['total']).to eq(0)
    end
  end

  describe 'POST create' do
    it 'creates a new project with name' do
      name = 'Test Name'
      post '/api/v1/projects',
           params: {
             name: name,
             organization_id: @organization.id
           },
           headers: @auth_params,
           as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data'].keys).to contain_exactly('id', 'type', 'relationships', 'attributes')
      expect(body['data']['attributes'].keys).to contain_exactly(*PROJECT_ATTRIBUTES)
      expect(body['data']['attributes']['name']).to eq(name)
      expect(body['data']['attributes']['description']).to be_nil
    end

    it 'creates a new project with name and description' do
      name = 'Test Name'
      description = 'Test Description'
      post '/api/v1/projects',
           params: {
             name: name,
             description: description,
             organization_id: @organization.id
           },
           headers: @auth_params,
           as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data'].keys).to contain_exactly('id', 'type', 'relationships', 'attributes')
      expect(body['data']['attributes'].keys).to contain_exactly(*PROJECT_ATTRIBUTES)
      expect(body['data']['attributes']['name']).to eq(name)
      expect(body['data']['attributes']['description']).to eq(description)
      expect(body['data']['relationships']['project_columns']['data'].length).to eq(0)
    end

    it 'fails to create a new project without name' do
      post '/api/v1/projects', params: { organization_id: @organization.id }, headers: @auth_params, as: :json

      expect(response).to have_http_status(:bad_request)
      body = JSON.parse(response.body)
      expect(body.keys).to contain_exactly('errors')
      expect(body['errors']['name'].length).to eq(1)
      expect(body['errors']['name'][0]['error']).to eq('blank')
    end
  end

  describe 'PUT update' do
    permissions_update = { 'translator' => 403, 'developer' => 403, 'manager' => 200, 'owner' => 200 }

    permissions_update.each do |permission, expected_response_status|
      it "#{expected_response_status == 200 ? 'succeeds' : 'fails'} to update a projects name as #{permission} of project" do
        project = Project.new(name: 'Old Name')
        project.save!

        project_user = ProjectUser.new
        project_user.user_id = @user.id
        project_user.project_id = project.id
        project_user.role = permission
        project_user.save!

        new_name = 'New Name'
        put "/api/v1/projects/#{project.id}", params: { name: new_name }, headers: @auth_params, as: :json

        expect(response.status).to eq(expected_response_status)
        if expected_response_status == 200
          body = JSON.parse(response.body)
          expect(body['data'].keys).to contain_exactly('id', 'type', 'relationships', 'attributes')
          expect(body['data']['attributes'].keys).to contain_exactly(*PROJECT_ATTRIBUTES)
          expect(body['data']['attributes']['name']).to eq(new_name)
          expect(body['data']['attributes']['description']).to be_nil
        end
      end
    end
  end

  describe 'DELETE destroy' do
    permissions_destroy = { 'translator' => 403, 'developer' => 403, 'manager' => 403, 'owner' => 200 }

    permissions_destroy.each do |permission, expected_response_status|
      it "#{expected_response_status == 200 ? 'succeeds' : 'fails'} to delete a project as #{permission} of project" do
        project = Project.new(name: 'Project name')
        project.save!

        project_user = ProjectUser.new
        project_user.user_id = @user.id
        project_user.project_id = project.id
        project_user.role = permission
        project_user.save!

        expect { delete "/api/v1/projects/#{project.id}", headers: @auth_params, as: :json }.to change(Project, :count)
          .by(expected_response_status == 200 ? -1 : 0)

        expect(response.status).to eq(expected_response_status)
        if expected_response_status == 200
          body = JSON.parse(response.body)
          expect(body['message']).to eq('Project deleted')
        end
      end
    end
  end

  describe 'GET export' do
    it 'returns an error if project has no languages' do
      project = create(:project, :with_organization)
      create(:project_user, project_id: project.id, user_id: @user.id, role: 'owner')
      export_config =
        create(:export_config, project_id: project.id, file_format_id: FileFormat.find_by!(format: 'json').id)

      get "/api/v1/projects/#{project.id}/exports/#{export_config.id}", headers: @auth_params, as: :json

      expect(response).to have_http_status(:bad_request)
      body = JSON.parse(response.body)
      expect(body['error']).to be(true)
      expect(body['message']).to eq('NO_LANGUAGES_FOUND_TO_EXPORT')
    end

    it 'returns an export zip' do
      project = create(:project, :with_organization)
      create(:project_user, project_id: project.id, user_id: @user.id, role: 'owner')
      create(:language, project_id: project.id)
      export_config =
        create(:export_config, project_id: project.id, file_format_id: FileFormat.find_by!(format: 'json').id)

      get "/api/v1/projects/#{project.id}/exports/#{export_config.id}", headers: @auth_params, as: :json

      expect(response).to have_http_status(:ok)
      file = Tempfile.new(project.id)
      file.binmode
      file.write(response.body)
      file.close

      files_count = 0

      Zip::File.open(file) do |zip_file|
        zip_file.each do |entry|
          files_count += 1
          content = entry.get_input_stream.read
          expect(JSON.parse(content)).to match_snapshot(
            'projects_controller_export_ok',
            { snapshot_serializer: StripSerializer }
          )
        end
      end

      expect(files_count).to eq(1)
    end
  end
end
