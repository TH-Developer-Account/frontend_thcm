import React from "react";
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	Plus,
	RotateCcw,
} from "lucide-react";

import UserAsyncSelect from "../../../components/forms/AsyncSelect";
import Avatar from "../../../components/common/Avatar";
import Card from "../../../components/common/Card";
import FormInput from "../../../components/forms/FormInput";
import Button from "../../../components/common/Button";
import { Alert } from "../../../components/common/Alert";
import { Modal } from "../../../components/common/Modal";

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

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

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

	onRemoveStage: (stageId: string) => void;

	onResetStages: () => void;
	onBack: () => void;
	onSubmit: () => void;
	onAddStage: () => void;

	hideNavActions?: boolean;

	hideResetAction?: boolean;
};

const WorkflowStagesForm = ({
	stages,
	errors,
	formError,
	onStageChange,
	onToggleStage,
	onRemoveApprover,
	onAddApprover,
	onRemoveStage,
	onResetStages,
	onBack,
	onAddStage,
	onSubmit,
	hideNavActions = false,
	hideResetAction = false,
}: Props) => {
	const hasStageError = (index: number): boolean =>
		Object.values(errors[index] || {}).some(Boolean);

	const canRemoveStage = stages.length > 1;

	const [isResetConfirmOpen, setIsResetConfirmOpen] = React.useState(false);

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
	const getStageErrorMessage = (index: number): string => {
		const stageError = errors[index] || {};
		const minApprovals = stages[index]?.minApprovals ?? 0;

		if (stageError.name) return stageError.name;

		if (stageError.minApprovals) {
			return `Please ensure you have at least ${minApprovals} approver${
				minApprovals > 1 ? "s" : ""
			} for this stage.`;
		}

		return stageError.approvers || "";
	};
	return (
		<div className="workflow-stage-main-list">
			{!hideResetAction && stages.length > 0 && (
				<div className="workflow-stage-list-actions">
					<Button
						type="button"
						text="Reset stages"
						Icon={RotateCcw}
						iconPosition="left"
						appearance="standard"
						variant="outline"
						size="sm"
						onClick={() => setIsResetConfirmOpen(true)}
					/>
				</div>
			)}

			<div className="workflow-stage-list">
				{stages.length === 0 ? (
					<div
						className={joinClassNames(
							"workflow-empty-state workflow-empty-state--dashed",
							formError && "workflow-empty-state--warning",
						)}
					>
						{formError ? (
							<>
								<strong>No stages yet.</strong> {formError}
							</>
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
						const stageHasError = hasStageError(index);
						const stageErrorMessage = getStageErrorMessage(index);

						const displayName = stage.name || `Stage ${stage.stageOrder}`;

						return (
							<Card
								key={stage.id}
								accordion
								expanded={Boolean(stage.isExpanded)}
								onExpandedChange={() => onToggleStage(stage.id)}
								variant="flat"
								padding="none"
								className={joinClassNames(
									"workflow-stage-card",
									stageHasError && "workflow-stage-card-error",
								)}
								bodyClassName="workflow-stage-body"
								title={
									<span className="workflow-stage-title-row">
										<span
											className={`workflow-stage-number ${
												stage.isExpanded ? "workflow-stage-number-active" : ""
											}`}
										>
											{stage.stageOrder}
										</span>

										<span className="workflow-stage-title">{displayName}</span>

										{stageHasError && stageErrorMessage && (
											<span className="workflow-stage-error-text">
												{stageErrorMessage}
											</span>
										)}

										{stageHasError && (
											<span
												className="workflow-stage-error-icon"
												role="alert"
												title={
													stageErrorMessage ||
													"This stage has an error — expand it to fix"
												}
											>
												<AlertTriangle size={14} aria-hidden="true" />
											</span>
										)}
									</span>
								}
								actions={
									<button
										type="button"
										className="workflow-remove-btn workflow-stage-remove-btn"
										aria-label={`Remove stage ${stage.stageOrder}: ${displayName}`}
										title={
											canRemoveStage
												? "Remove this stage"
												: "A workflow must have at least one stage"
										}
										disabled={!canRemoveStage}
										onClick={(event) => {
											event.stopPropagation();
											onRemoveStage(stage.id);
										}}
									>
										<span aria-hidden="true">×</span>
									</button>
								}
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
										onChange={(option: SingleValue<WorkflowSelectOption>) => {
											onStageChange(stage.id, "name", option?.value ?? "");
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

												onStageChange(stage.id, "minApprovals", nextValue);
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
											<div key={approver.id} className="workflow-approver-row">
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
							</Card>
						);
					})
				)}
				<button
					type="button"
					className="workflow-add-stage-btn"
					onClick={onAddStage}
				>
					<Plus size={14} aria-hidden="true" />
					Add another stage
				</button>
			</div>

			{!hideNavActions && (
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
			)}

			<Modal
				open={isResetConfirmOpen}
				onClose={() => setIsResetConfirmOpen(false)}
				mode="shell"
				size="sm"
				dialogRole="alertdialog"
				ariaLabel="Reset approval stages confirmation"
			>
				<Alert
					variant="warning"
					title="Reset approval stages"
					description="This removes every stage and approver you've configured here and starts over with a single blank stage. This can't be undone."
					primaryAction={{
						label: "Reset",
						onClick: () => {
							onResetStages();
							setIsResetConfirmOpen(false);
						},
					}}
					secondaryAction={{
						label: "Cancel",
						onClick: () => setIsResetConfirmOpen(false),
					}}
				/>
			</Modal>
		</div>
	);
};

export default WorkflowStagesForm;
