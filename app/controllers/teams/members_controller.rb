class Teams::MembersController < Teams::ApplicationController

  skip_before_filter :authorize_manage_user_team!, only: [:index]

  def index
    @members = user_team.members
  end

  def new
    @users = User.active
    @users = @users.not_in_team(user_team) if user_team.members.any?
    @users = UserDecorator.decorate @users
  end

  def create
    unless params[:user_ids].blank?
      user_ids = params[:user_ids]
      access = params[:default_project_access]
      is_admin = params[:group_admin]
      user_team.add_members(user_ids, access, is_admin)
    end

    redirect_to team_members_path(user_team), notice: 'Members was successfully added into Team of users.'
  end

  def edit
    team_member
  end

  def update
    options = {default_projects_access: params[:default_project_access], group_admin: params[:group_admin]}
    if user_team.update_membership(team_member, options)
      redirect_to team_members_path(user_team), notice: "Membership for #{team_member.name} was successfully updated in Team of users."
    else
      render :edit
    end
  end

  def destroy
    user_team.remove_member(team_member)
    redirect_to team_path(user_team), notice: "Member #{team_member.name} was successfully removed from Team of users."
  end

  protected

  def team_member
    @member ||= user_team.members.find(params[:id])
  end

end
