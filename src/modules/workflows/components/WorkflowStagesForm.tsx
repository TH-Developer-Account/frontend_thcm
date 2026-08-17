import React from "react";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";

import UserAsyncSelect from "../../../components/forms/AsyncSelect";
import Avatar from "../../../components/common/Avatar";
import FormInput from "../../../components/forms/FormInput";
import Button from "../../../components/common/Button";

import type {
	WorkflowStage,
	WorkflowApprover,
	WorkflowStageErrors,
	WorkflowSelectOption,
} from "../types/types";
import { getFullName } from "../utils/user";
import type { SingleValue } from "react-select";
import SelectInput from "../../../components/forms/SelectInput";

const STAGE_NAME_OPTIONS: WorkflowSelectOption[] = [
	{
		value: "Recommender",
		label: "Recommender",
	},
	{
		value: "Checker",
		label: "Checker",
	},
	{
		value: "Approver",
		label: "Approver",
	},
];

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
	onAddApprover: (stageId: string, approver: WorkflowApprover) => void;
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
	// A stage's error paragraph only renders while it's expanded (see
	// workflow-stage-body below). If a collapsed stage has an error, it was
	// previously invisible — the user had no idea why "Next" wasn't moving
	// forward. hasStageError(index) lets us surface that on the collapsed
	// header instead.
	const hasStageError = (index: number): boolean =>
		Object.keys(errors[index] || {}).length > 0;

	const handleExternalApproverChange = (
		stage: WorkflowStage,
		approverId: string,
		isExternalApprover: boolean,
	) => {
		const updatedApprovers = stage.approvers.map((approver) =>
			approver.id === approverId
				? {
						...approver,
						isExternalApprover,
					}
				: approver,
		);

		onStageChange(stage.id, "approvers", updatedApprovers);
	};

	return (
		<div>
			<div className="workflow-stage-list">
				{stages.length === 0 ? (
					<div className="workflow-empty-state">
						{formError ? (
							<p className="workflow-form-error form-error-text  workflow-form-error--center">
								{formError}
							</p>
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
										aria-expanded={Boolean(stage.isExpanded)}
										aria-controls={`workflow-stage-body-${stage.id}`}
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

										{!stage.isExpanded && hasStageError(index) && (
											<span
												className="workflow-stage-error-badge"
												role="alert"
												title="This stage has an error — expand it to fix"
											>
												!
											</span>
										)}

										<span
											aria-hidden="true"
											className={`workflow-stage-chevron ${
												stage.isExpanded ? "workflow-stage-chevron-open" : ""
											}`}
										>
											›
										</span>
									</button>

									{stage.isExpanded && (
										<div
											id={`workflow-stage-body-${stage.id}`}
											className="workflow-stage-body"
										>
											<div className="workflow-create-field-row workflow-create-field-row-3">
												{/* <FormInput
													name={`stage-name-${stage.id}`}
													label="Stage name"
													value={stage.name}
													onChange={(event) =>
														onStageChange(stage.id, "name", event.target.value)
													}
													error={stageError.name}
												/> */}
												<SelectInput
													name={`stage-name-${stage.id}`}
													label="Stage name"
													value={
														STAGE_NAME_OPTIONS.find(
															(option) => option.value === stage.name,
														) ?? null
													}
													options={STAGE_NAME_OPTIONS}
													onChange={(
														option: SingleValue<WorkflowSelectOption>,
													) => {
														onStageChange(
															stage.id,
															"name",
															option?.value ?? "",
														);
													}}
													error={stageError.name}
													placeholder="Select stage name"
													required
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
														onChange={(event) => {
															const requestedValue = Number(event.target.value);

															const nextValue = Math.min(
																stage.approvers.length || 1,
																Math.max(1, requestedValue),
															);

															onStageChange(
																stage.id,
																"minApprovals",
																nextValue,
															);
														}}
														error={stageError.minApprovals}
													/>

													<p className="workflow-approvers-length-text">
														/{stage.approvers.length}
													</p>
												</div>
											</div>

											<div className="workflow-approver-list">
												{stage.approvers.map((approver) => {
													const firstName = approver.user?.firstName ?? "";
													const lastName = approver.user?.lastName ?? "";

													const fullName = getFullName(approver.user);

													const checkboxId = `external-approver-${stage.id}-${approver.id}`;

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

															<label
																htmlFor={checkboxId}
																className="workflow-approver-external-check"
															>
																<input
																	id={checkboxId}
																	type="checkbox"
																	checked={approver.isExternalApprover ?? false}
																	onChange={(event) =>
																		handleExternalApproverChange(
																			stage,
																			approver.id,
																			event.target.checked,
																		)
																	}
																/>

																<span>External approver</span>
															</label>

															<button
																type="button"
																className="workflow-remove-btn"
																aria-label={`Remove ${fullName} from stage ${stage.stageOrder}`}
																onClick={() =>
																	onRemoveApprover(stage.id, approver.id)
																}
															>
																<span aria-hidden="true">×</span>
															</button>
														</div>
													);
												})}
											</div>

											<UserAsyncSelect
												label="Approvers"
												excludedUserIds={stage.approvers.map(
													(approver) => approver.user.id,
												)}
												onChange={(selected) => {
													if (!selected) return;

													onAddApprover(stage.id, {
														id: selected.value,
														stageId: stage.id,
														user: {
															id: selected.value,
															firstName: selected.firstName ?? "",
															lastName: selected.lastName ?? "",
															email: selected.email ?? "",
														},
														isExternalApprover: false,
													});
												}}
											/>

											{(stageError.approvers || stageError.minApprovals) && (
												<p className="workflow-form-error workflow-form-error--left">
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
				<Plus size={14} aria-hidden="true" />
				Add another stage
			</button>

			<div className="workflow-form-actions">
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
