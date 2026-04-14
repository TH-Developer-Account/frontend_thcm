type Props = {
	module: string;
	budgetCode: string;
	zone: string;
	stageCount: number;
	approverCount: number;
};

const WorkflowCreateSidebar = ({
	module,
	budgetCode,
	zone,
	stageCount,
	approverCount,
}: Props) => {
	return (
		<div className="workflow-create-sidebar">
			<div className="workflow-sidebar-card">
				<h3 className="workflow-sidebar-title">Workflow summary</h3>

				<div className="workflow-summary-list">
					<div className="workflow-summary-item">
						<span className="workflow-summary-key">Module</span>
						<span className="workflow-summary-value">{module}</span>
					</div>
					<div className="workflow-summary-item">
						<span className="workflow-summary-key">Budget code</span>
						<span className="workflow-summary-value">{budgetCode}</span>
					</div>
					<div className="workflow-summary-item">
						<span className="workflow-summary-key">Zone</span>
						<span className="workflow-summary-value">{zone}</span>
					</div>
					<div className="workflow-summary-item">
						<span className="workflow-summary-key">Stages</span>
						<span className="workflow-summary-value">{stageCount}</span>
					</div>
					<div className="workflow-summary-item workflow-summary-item-last">
						<span className="workflow-summary-key">Total approvers</span>
						<span className="workflow-summary-value">{approverCount}</span>
					</div>
				</div>
			</div>

			{/* <div className="workflow-sidebar-card">
				<h3 className="workflow-sidebar-title">Settings</h3>

				<div className="workflow-settings-list">
					<div className="workflow-setting-item">
						<div>
							<div className="workflow-setting-label">
								Allow submitter to edit
							</div>
							<div className="workflow-setting-sub">While pending approval</div>
						</div>
						<button
							type="button"
							className={`workflow-toggle ${
								settings.allowSubmitterEdit ? "workflow-toggle-on" : ""
							}`}
							onClick={() => setToggle("allowSubmitterEdit")}
						/>
					</div>

					<div className="workflow-setting-item">
						<div>
							<div className="workflow-setting-label">Email notifications</div>
							<div className="workflow-setting-sub">
								Notify approvers by email
							</div>
						</div>
						<button
							type="button"
							className={`workflow-toggle ${
								settings.emailNotifications ? "workflow-toggle-on" : ""
							}`}
							onClick={() => setToggle("emailNotifications")}
						/>
					</div>

					<div className="workflow-setting-item">
						<div>
							<div className="workflow-setting-label">Remind on SLA breach</div>
							<div className="workflow-setting-sub">
								Auto-remind after deadline
							</div>
						</div>
						<button
							type="button"
							className={`workflow-toggle ${
								settings.remindOnSlaBreach ? "workflow-toggle-on" : ""
							}`}
							onClick={() => setToggle("remindOnSlaBreach")}
						/>
					</div>

					<div className="workflow-setting-item">
						<div>
							<div className="workflow-setting-label">
								Require comment on reject
							</div>
							<div className="workflow-setting-sub">
								Mandatory rejection note
							</div>
						</div>
						<button
							type="button"
							className={`workflow-toggle ${
								settings.requireCommentOnReject ? "workflow-toggle-on" : ""
							}`}
							onClick={() => setToggle("requireCommentOnReject")}
						/>
					</div>

					<div className="workflow-setting-item workflow-setting-item-last">
						<div>
							<div className="workflow-setting-label">
								Auto-approve on timeout
							</div>
							<div className="workflow-setting-sub">If SLA exceeded</div>
						</div>
						<button
							type="button"
							className={`workflow-toggle ${
								settings.autoApproveOnTimeout ? "workflow-toggle-on" : ""
							}`}
							onClick={() => setToggle("autoApproveOnTimeout")}
						/>
					</div>
				</div>
			</div> */}
		</div>
	);
};

export default WorkflowCreateSidebar;
