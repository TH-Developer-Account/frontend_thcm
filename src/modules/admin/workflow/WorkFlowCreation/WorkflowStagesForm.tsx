import React from "react";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import UserAsyncSelect from "../../../../components/forms/AsyncSelect";
import Avatar from "../../../../components/common/Avatar";
import type {
	WorkflowStage,
	Approver,
	WorkflowStageErrors,
} from "../types/workflow.types";
import FormInput from "../../../../components/forms/FormInput";
import Button from "../../../../components/common/Button";

type Props = {
	stages: WorkflowStage[];
	errors: WorkflowStageErrors[];
	formError: string | null;
	currentUserId: string;
	onStageChange: <K extends keyof WorkflowStage>(
		stageId: string,
		key: K,
		value: WorkflowStage[K],
	) => void;
	onToggleStage: (stageId: string) => void;
	onRemoveApprover: (stageId: string, approverId: string) => void;
	onAddApprover: (stageId: string, approver: Approver) => void;
	onBack: () => void;
	onSubmit: () => void;
	onAddStage: () => void;
};

const WorkflowStagesForm = ({
	stages,
	errors,
	formError,
	onStageChange,
	onToggleStage,
	onRemoveApprover,
	onAddApprover,
	onBack,
	onAddStage,
	onSubmit,
}: Props) => {
	console.log("Rendering WorkflowStagesForm with stages:", stages);
	console.log("Stage errors:", errors);
	return (
		<div>
			<div className="workflow-stage-list">
				{stages.length === 0 ? (
					<div className="workflow-empty-state">
						{formError ? (
							<p className="form-error-text text-md text-center">{formError}</p>
						) : (
							<>
								No stages added yet. Click <strong>Add another stage</strong> to
								start configuring your workflow.
							</>
						)}
					</div>
				) : (
					stages.map((stage, index) => {
						const stageError = errors[index] || {};
						const minApprovals = stage.minApprovals ?? 0;

						return (
							<React.Fragment key={stage.id}>
								<div
									className={`workflow-stage-card ${
										stage.isExpanded ? "workflow-stage-card-expanded" : ""
									}`}
								>
									<button
										type="button"
										className="workflow-stage-header"
										onClick={() => onToggleStage(stage.id)}
									>
										<div
											className={`workflow-stage-number ${
												stage.isExpanded ? "workflow-stage-number-active" : ""
											}`}
										>
											{stage.stageOrder}
										</div>

										<div className="workflow-stage-header-content">
											<div className="workflow-stage-title">{stage.name}</div>
											<div className="workflow-stage-meta">
												{stage.approvers.length} approver
												{stage.approvers.length === 1 ? "" : "s"}
											</div>
										</div>

										<span className="workflow-stage-step-pill">
											Step {stage.stageOrder}
										</span>

										<span
											className={`workflow-stage-chevron ${
												stage.isExpanded ? "workflow-stage-chevron-open" : ""
											}`}
										>
											›
										</span>
									</button>

									{stage.isExpanded && (
										<div className="workflow-stage-body">
											<div className="workflow-create-field-row workflow-create-field-row-3">
												<FormInput
													name={`stage-name-${stage.id}`}
													label="Stage name"
													value={stage.name}
													onChange={(e) =>
														onStageChange(stage.id, "name", e.target.value)
													}
													error={stageError.name}
												/>

												<div className="relative">
													<FormInput
														name={`stage-minApprovals-${stage.id}`}
														label="Minimum approvals"
														type="number"
														min={1}
														className="w-[25%]"
														max={stage.approvers.length}
														value={stage.minApprovals ?? 0}
														onChange={(e) =>
															onStageChange(
																stage.id,
																"minApprovals",
																Math.min(
																	stage.approvers.length || 1,
																	Math.max(1, Number(e.target.value)),
																),
															)
														}
														error={stageError.minApprovals}
													/>
													<p className="workflow-approvers-length-text">
														/{stage.approvers.length}
													</p>
												</div>
											</div>
											<div className="workflow-approver-list">
												{stage.approvers.map((approver) => {
													const firstName = approver.user?.first_name ?? "";
													const lastName = approver.user?.last_name ?? "";
													console.log("Rendering approver:", stage);
													const fullName =
														`${firstName} ${lastName}`.trim() || "Unnamed User";

													return (
														<div
															key={approver.id}
															className="workflow-approver-row"
														>
															<div className="workflow-approver-avatar workflow-approver-avatar-orange">
																<Avatar
																	firstName={firstName}
																	lastName={lastName}
																	imageUrl=""
																	size="md"
																	isTooltip={false}
																/>
															</div>

															<div className="workflow-approver-content">
																<div className="workflow-approver-name">
																	{fullName}
																</div>
																<div className="workflow-approver-role">
																	{approver.user?.email ?? "--"}
																</div>
															</div>

															<button
																type="button"
																className="workflow-remove-btn"
																onClick={() =>
																	onRemoveApprover(stage.id, approver.id)
																}
															>
																×
															</button>
														</div>
													);
												})}
											</div>
											<UserAsyncSelect
												label="Approvers"
												excludedUserIds={stage.approvers.map((a) => a.userId)}
												onChange={(selected) => {
													if (!selected) return;

													onAddApprover(stage.id, {
														id: selected.value,
														stageId: stage.id,
														userId: selected.value,
														user: {
															id: selected.value,
															first_name: selected.firstName ?? "",
															last_name: selected.lastName ?? "",
															email: selected.email ?? "",
														},
													});
												}}
											/>
											{(stageError.approvers || stageError.minApprovals) && (
												<p className="form-error-text text-md text-left mt-2">
													{stageError.minApprovals
														? `Please ensure you have at least ${minApprovals} approver${
																minApprovals > 1 ? "s" : ""
															} for this stage.`
														: stageError.approvers}
												</p>
											)}
										</div>
									)}
								</div>
							</React.Fragment>
						);
					})
				)}
			</div>

			<button
				type="button"
				className="workflow-add-stage-btn"
				onClick={onAddStage}
			>
				<Plus size={14} />
				Add another stage
			</button>

			<div className="mt-4 flex justify-between">
				<Button
					onClick={onBack}
					type="button"
					text="Back"
					Icon={ArrowLeft}
					iconPosition="left"
					appearance="standard"
					variant="outline"
					size="sm"
				/>
				<Button
					onClick={onSubmit}
					type="button"
					text="Next"
					Icon={ArrowRight}
					iconPosition="right"
					appearance="standard"
					size="sm"
					variant="brand"
				/>
			</div>
		</div>
	);
};

export default WorkflowStagesForm;
