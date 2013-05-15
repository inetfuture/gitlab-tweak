module Issues
  class BulkUpdateContext < BaseContext
    def execute
      update_data = params[:update]

      issues_ids   = update_data[:issues_ids].split(",")
      milestone_id = update_data[:milestone_id]
      assignee_id  = update_data[:assignee_id]
      status       = update_data[:status]

      unless status.present?
        return {
          count: 0,
          success: false
        }
      end

      opts = {}
      opts[:milestone_id] = milestone_id if milestone_id.present?
      opts[:assignee_id] = assignee_id if assignee_id.present?

      issues = Issue.where(id: issues_ids).all
      issues = issues.select { |issue| can?(current_user, :modify_issue, issue) }

      new_state = :reopen
      new_state = :close if status == 'closed'

      issues.each do |issue|
        issue.update_attributes(opts)
        issue.send new_state
      end

      {
        count: issues.count,
        success: !issues.count.zero?
      }
    end
  end
end
