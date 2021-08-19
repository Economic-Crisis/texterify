class Api::V1::OrganizationInvitesController < Api::V1::ApiController
  def create
    organization = current_user.organizations.find(params[:organization_id])
    email = params[:email]
    role = params[:role]

    if role && ROLE_PRIORITY_MAP[role.to_sym].nil?
      render json: { error: true, message: 'ROLE_NOT_FOUND' }, status: :bad_request
      return
    end

    organization_invite = OrganizationInvite.new
    organization_invite.organization = organization
    organization_invite.email = email
    organization_invite.role = role || ROLE_TRANSLATOR
    authorize organization_invite

    # Check if there is already an invite for this organization or the user is already part of the organization.
    if OrganizationInvite.exists?(organization_id: organization.id, email: email) ||
         organization.users.exists?(email: email)
      render json: { error: true, message: 'USER_ALREADY_INVITED_OR_ADDED' }, status: :bad_request
    else
      organization_invite.save!

      render json: { error: false, message: 'OK' }
    end
  end

  def index
    skip_authorization
    organization = current_user.organizations.find(params[:organization_id])
    organization_invites = organization.invites.order(created_at: :desc)

    render json: OrganizationInviteSerializer.new(organization_invites).serialized_json
  end

  def destroy
    organization = current_user.organizations.find(params[:organization_id])
    organization_invite = OrganizationInvite.find_by(id: params[:id], organization_id: organization.id)

    unless organization_invite
      render json: { error: true, message: 'NOT_FOUND' }, status: :bad_request
      return
    end

    authorize organization_invite

    organization_invite.destroy

    render json: { error: false, message: 'OK' }
  end
end
