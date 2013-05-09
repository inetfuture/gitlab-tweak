class SearchController < ApplicationController
  def show
    project_id = params[:project_id]
    group_id = params[:group_id]

    project_ids = current_user.authorized_projects.map(&:id)

    if group_id.present?
      @group = Group.find(group_id)
      group_project_ids = @group.projects.map(&:id)
      project_ids.select! { |id| group_project_ids.include?(id)}
    elsif project_id.present?
      project_ids.select! { |id| id == project_id.to_i}
    end

    result = SearchContext.new(project_ids, params).execute

    @projects       = result[:projects]
    @project        = result[:project]
    @merge_requests = result[:merge_requests]
    @issues         = result[:issues]
    @wiki_pages     = result[:wiki_pages]
    @blobs          = result[:blobs]
  end
end
