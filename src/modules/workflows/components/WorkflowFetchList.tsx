import React from "react";
import { useNavigate } from "react-router-dom";
import {
	ChevronDown,
	ChevronUp,
	GitFork,
	Paperclip,
	Plus,
	Users,
} from "lucide-react";

import Button from "../../../components/common/Button";
import { Alert } from "../../../components/common/Alert";
import { Modal } from "../../../components/common/Modal";
import { FilterTabs } from "../../../components/ui/FilterTabs";

import { workflowListFilterOptions } from "../constant/workflow.constant";
import type {
	WorkflowListScope,
	WorkflowSummary,
	WorkflowTemplate,
} from "../types/types";

interface WorkflowFetchListProps {
	filter: WorkflowListScope;
	onFilterChange: (filter: WorkflowListScope) => void;
	workflows: WorkflowSummary[];
	expandedWorkflowId: string | null;
	loadingWorkflowId: string | null;
	workflowDetails: Record<string, WorkflowTemplate>;
	workflowDetailErrors: Record<string, string>;
	onAttach: (workflow: WorkflowSummary) => void | Promise<void>;
	onToggleWorkflow: (workflowId: string) => void | Promise<void>;
	disabled?: boolean;
	loading?: boolean;
}

const getEmptyMessage = (filter: WorkflowListScope): string => {
	switch (filter) {
		case "ASSIGNED_TO_ME":
			return "No workflows assigned to you are available.";

		case "CREATED_BY_ME":
			return "No workflows created by you are available.";

		default:
			return "No workflows are available.";
	}
};

export function WorkflowFetchList({
	filter,
	onFilterChange,
	workflows,
	expandedWorkflowId,
	loadingWorkflowId,
	workflowDetails,
	workflowDetailErrors,
	onAttach,
	onToggleWorkflow,
	disabled = false,
	loading = false,
}: WorkflowFetchListProps) {
	const navigate = useNavigate();

	// "Create Workflow" from the empty state takes the user out of this
	// flow entirely (into the standalone Workflow module, not the inline
	// customise-workflow builder used elsewhere here), so it gets a
	// confirmation first — same warn-before-leaving treatment as the
	// destructive confirmations elsewhere in this module.
	const [isCreateConfirmOpen, setIsCreateConfirmOpen] = React.useState(false);

	const filterTabs = React.useMemo(
		() =>
			workflowListFilterOptions.map((option) => ({
				value: option.value,
				label: option.label,
				tooltipLabel: option.tooltipLabel,
				Icon: option.Icon,
			})),
		[],
	);

	const handleFilterChange = React.useCallback(
		(value: WorkflowListScope) => {
			if (disabled || loading) return;

			onFilterChange(value);
		},
		[disabled, loading, onFilterChange],
	);

	return (
		<div className="workflow-fetch-panel">
			<FilterTabs
				ariaLabel="Filter available workflows"
				items={filterTabs}
				value={filter}
				onChange={handleFilterChange}
				variant="underline"
				className="border-b-none px-0 py-0"
			/>

			{loading ? (
				<div className="workflow-fetch-empty" role="status">
					Loading workflows…
				</div>
			) : workflows.length === 0 ? (
				<div className="workflow-fetch-empty">
					<GitFork size={20} aria-hidden="true" />

					<p>{getEmptyMessage(filter)}</p>

					<Button
						type="button"
						text="Create Workflow"
						Icon={Plus}
						iconPosition="left"
						appearance="standard"
						variant="brand"
						size="sm"
						disabled={disabled}
						onClick={() => setIsCreateConfirmOpen(true)}
					/>
				</div>
			) : (
				<div className="workflow-fetch-scroll max-h-[28rem] overflow-y-auto overscroll-contain pr-1">
					<div className="workflow-fetch-list">
						{workflows.map((workflow) => {
							const isExpanded = expandedWorkflowId === workflow.id;
							const isLoadingDetails = loadingWorkflowId === workflow.id;
							const detail = workflowDetails[workflow.id];
							const detailError = workflowDetailErrors[workflow.id];

							return (
								<section className="workflow-fetch-item" key={workflow.id}>
									<div className="workflow-fetch-row">
										<div className="workflow-fetch-row-main">
											<div
												className="workflow-fetch-item-icon"
												aria-hidden="true"
											>
												<GitFork size={16} />
											</div>

											<div className="workflow-fetch-copy">
												<h4>{workflow.name}</h4>

												<p>
													<span>
														<Plus size={12} />
														{workflow.stageCount} stage
														{workflow.stageCount === 1 ? "" : "s"}
													</span>

													<span>
														<Users size={12} />

														{workflow.flowType === "SEQUENTIAL"
															? "Sequential"
															: "Parallel"}
													</span>
												</p>
											</div>
										</div>

										<div className="workflow-fetch-actions">
											<Button
												type="button"
												appearance="standard"
												variant="outline"
												Icon={Paperclip}
												text="Attach"
												disabled={disabled}
												onClick={() => onAttach(workflow)}
											/>
											<Button
												type="button"
												appearance="standard"
												variant="outline"
												Icon={isExpanded ? ChevronUp : ChevronDown}
												text={isExpanded ? "Collapse" : "Expand"}
												disabled={disabled || isLoadingDetails}
												onClick={() => void onToggleWorkflow(workflow.id)}
												aria-expanded={isExpanded}
											/>
										</div>
									</div>

									{isExpanded && (
										<div className="workflow-fetch-stage-details">
											{isLoadingDetails ? (
												<p role="status">Loading workflow stages…</p>
											) : detailError ? (
												<p className="workflow-fetch-stage-error" role="alert">
													{detailError} Collapse and expand to retry.
												</p>
											) : detail?.stages?.length ? (
												<ol className="workflow-fetch-stage-list">
													{detail.stages
														.slice()
														.sort((a, b) => a.stageOrder - b.stageOrder)
														.map((stage) => (
															<li
																key={
																	stage.id ??
																	`${workflow.id}-${stage.stageOrder}`
																}
															>
																<div className="workflow-fetch-stage-heading">
																	<strong>
																		{stage.stageOrder}. {stage.name}
																	</strong>
																	<span>
																		{stage.strategy}
																		{stage.strategy === "SOME"
																			? ` · ${stage.minApprovals} required`
																			: ""}
																	</span>
																</div>
																<p>
																	{stage.approvers.length
																		? stage.approvers
																				.map(
																					(approver) =>
																						[
																							approver.user.firstName,
																							approver.user.lastName,
																						]
																							.filter(Boolean)
																							.join(" ") || approver.user.email,
																				)
																				.join(", ")
																		: "No approvers configured"}
																</p>
															</li>
														))}
												</ol>
											) : (
												<p>No stages are configured for this workflow.</p>
											)}
										</div>
									)}
								</section>
							);
						})}
					</div>
				</div>
			)}

			<Modal
				open={isCreateConfirmOpen}
				onClose={() => setIsCreateConfirmOpen(false)}
				mode="shell"
				size="sm"
				dialogRole="alertdialog"
				ariaLabel="Leave to create a workflow confirmation"
			>
				<Alert
					variant="warning"
					title="Leave this page?"
					description="Creating a workflow takes you to the Workflow module on a different screen. Anything you haven't attached here yet will be left behind. Continue?"
					primaryAction={{
						label: "Continue",
						onClick: () => {
							setIsCreateConfirmOpen(false);
							navigate("/workflow/create-workflows");
						},
					}}
					secondaryAction={{
						label: "Cancel",
						onClick: () => setIsCreateConfirmOpen(false),
					}}
				/>
			</Modal>
		</div>
	);
}
