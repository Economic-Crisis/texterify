class Api::V1::ProjectUsersController < Api::V1::ApiController
  before_action :ensure_feature_enabled, only: [:create, :update]
  before_action :check_if_user_activated, except: [:destroy]

  def index
    skip_authorization
    project = current_user.projects.find(params[:project_id])

    options = {}
    options[:params] = { project: project }
    render json:
             UserSerializer.new(
               project.users.where(
                 'users.username ilike :search or users.email ilike :search',
                 search: "%#{params[:search]}%"
               ),
               options
             ).serialized_json
  end

  def create
    project = current_user.projects.find(params[:project_id])
    user = User.find_by(email: params[:email])

    # Check if the user exists.
    unless user
      skip_authorization
      render json: { error: true, message: 'USER_NOT_FOUND' }, status: :not_found
      return
    end

    # Check if the role exists.
    role = params[:role]
    if role && ROLE_PRIORITY_MAP[role.to_sym].nil?
      render json: { error: true, message: 'ROLE_NOT_FOUND' }, status: :bad_request
      return
    end

    project_user = ProjectUser.new
    project_user.project = project
    project_user.user = user

    # The default role of a user for a project that belongs to an organization
    # is the role the user has in the organization.
    user_organization_role = project.organization&.role_of(user)
    if user_organization_role
      project_user.role = user_organization_role
    end

    # Set given project role if higher than organization role.
    if ROLE_PRIORITY_MAP[role.to_sym] > ROLE_PRIORITY_MAP[project_user.role.to_sym]
      project_user.role = role
    end

    authorize project_user

    if project.users.exclude?(user)
      project_user.save!

      project_column = ProjectColumn.new
      project_column.project = project
      project_column.user = user
      project_column.save!

      render json: { error: false, message: 'OK' }
    else
      render json: { error: true, message: 'USER_ALREADY_ADDED' }, status: :bad_request
    end
  end

  def destroy
    project = current_user.projects.find(params[:project_id])
    project_user = ProjectUser.find_by!(user_id: params[:id], project_id: project.id)

    if params[:id] == current_user.id
      skip_authorization
    else
      authorize project_user
    end

    if current_user.id == params[:id] && project.users.count == 1
      render json: {
               errors: [{ details: "You can't remove yourself from the project if you are the only member" }]
             },
             status: :bad_request
      return
    end

    if !project.organization && project.owners_count == 1 && project.owner?(project_user.user)
      render json: { error: true, message: 'LAST_OWNER_CANT_BE_REMOVED' }, status: :bad_request
      return
    end

    project_user.destroy

    render json: { message: 'User removed from project' }
  end

  def update
    project = current_user.projects.find(params[:project_id])
    project_user = ProjectUser.find_by(project_id: project.id, user_id: params[:id])

    role = params[:role]
    if !role
      render json: { errors: [{ code: 'NO_ROLE_GIVEN' }] }, status: :bad_request
      skip_authorization
      return
    end

    unless project_user
      user = User.find(params[:id])
      project_user = ProjectUser.new
      project_user.project = project
      project_user.user = user
    end

    # The lowest role a user can have for a project that belongs to an organization
    # is the role the user has in the organization.
    user_organization_role = project.organization&.role_of(project_user.user)
    if user_organization_role && helpers.higher_role?(user_organization_role, role)
      render json: { errors: [{ code: 'USER_PROJECT_ROLE_LOWER_THAN_USER_ORGANIZATION_ROLE' }] }, status: :bad_request
      skip_authorization
      return
    end

    project_user.role_before_update = project_user.role
    project_user.role = role
    authorize project_user

    project_organization_has_owner =
      project.organization ? project.organization.organization_users.where(role: 'owner').size >= 1 : false

    # Don't allow the last owner of the project to change his role.
    # There should always be at least one owner.
    if project.project_users.where(role: 'owner').size == 1 && project_user.role_changed? &&
         project_user.role_was == 'owner' && !project_organization_has_owner
      render json: { errors: [{ code: 'AT_LEAST_ONE_OWNER_PER_PROJECT_REQUIRED' }] }, status: :bad_request
      return
    end

    project_user.save!

    render json: { success: true }
  end

  private

  def ensure_feature_enabled
    project = current_user.projects.find(params[:project_id])

    if !project.feature_enabled?(Plan::FEATURE_PERMISSION_SYSTEM)
      skip_authorization

      render json: { error: true, message: 'BASIC_PERMISSION_SYSTEM_FEATURE_NOT_AVAILABLE' }, status: :bad_request
      return
    end
  end
end
