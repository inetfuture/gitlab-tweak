# UserTeamManager class
#
# Used for manage User teams with project repositories
module Gitlab
  class UserTeamManager
    class << self
      def assign(team, project, access)
        project = Project.find(project) unless project.is_a? Project
        searched_project = team.user_team_project_relationships.find_by_project_id(project.id)

        unless searched_project.present?
          team.user_team_project_relationships.create(project_id: project.id, greatest_access: access)
          update_team_users_access_in_project(team, project)
        end
      end

      def resign(team, project)
        project = Project.find(project) unless project.is_a? Project

        team.user_team_project_relationships.with_project(project).destroy_all

        update_team_users_access_in_project(team, project)
      end

      def update_team_users_access_in_project(team, project)
        members = team.members
        members.each do |member|
          update_team_user_access_in_project(team, member, project)
        end
      end

      def update_team_user_access_in_project(team, user, project)
        granted_access = max_teams_member_permission_in_project(user, project)

        project_team_user = UsersProject.find_by_user_id_and_project_id(user.id, project.id)

        if project_team_user.present?
          project_team_user.destroy
        end

        if project_team_user.blank? && granted_access > 0
          UsersProject.add_users_into_projects([project.id], [user.id], granted_access)
        end
      end

      def max_teams_member_permission_in_project(user, project, teams = nil)
        result_access = 0

        user_teams = project.user_teams.with_member(user)

        teams ||= user_teams

        if teams.any?
          teams.each do |team|
            granted_access = max_team_member_permission_in_project(team, user, project)
            result_access = [granted_access, result_access].max
          end
        end
        result_access
      end

      def max_team_member_permission_in_project(team, user, project)
        member_access = team.default_projects_access(user)
        team_access = team.user_team_project_relationships.find_by_project_id(project.id).greatest_access

        [team_access, member_access].min
      end

      def add_member_into_team(team, user, access, admin)
        user = User.find(user) unless user.is_a? User

        team.user_team_user_relationships.create(user_id: user.id, permission: access, group_admin: admin)
        team.projects.each do |project|
          update_team_user_access_in_project(team, user, project)
        end
      end

      def remove_member_from_team(team, user)
        user = User.find(user) unless user.is_a? User

        team.user_team_user_relationships.with_user(user).destroy_all
        other_teams = []
        team.projects.each do |project|
          other_teams << project.user_teams.with_member(user)
        end
        other_teams.uniq
        unless other_teams.any?
          UsersProject.in_projects(team.projects).with_user(user).destroy_all
        end
      end
    end
  end
end
