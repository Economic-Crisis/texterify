require 'rails_helper'

RSpec.describe Api::V1::InstanceController, type: :request do
  before(:each) do |test|
    unless test.metadata[:skip_before]
      @user = create(:user)
      @auth_params = sign_in(@user)

      @user_superadmin = create(:user)
      @user_superadmin.is_superadmin = true
      @user_superadmin.save!
      @auth_params_superadmin = sign_in(@user_superadmin)

      create(:project, :with_organization)
      create(:project, :with_organization)
      create(:project, :with_organization)
      create(:organization)
      create(:organization)
      create(:organization)
      create(:organization)
    end
  end

  describe 'GET show' do
    it 'has status code 403 if not logged in', :skip_before do
      get '/api/v1/instance'
      expect(response).to have_http_status(:forbidden)
    end

    it 'has status code 403 if not logged in as superadmin' do
      get '/api/v1/instance', headers: @auth_params
      expect(response).to have_http_status(:forbidden)
    end

    it 'returns instance information' do
      get '/api/v1/instance', headers: @auth_params_superadmin
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['users_count']).to eq(2)
      expect(body['projects_count']).to eq(3)
      expect(body['organizations_count']).to eq(7)
      expect(body['languages_count']).to eq(0)
      expect(body['keys_count']).to eq(0)
      expect(body['translations_count']).to eq(0)
      expect(body['releases_count']).to eq(0)
    end
  end
end
