import { useState } from "react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormInput from "../../../components/forms/FormInput";
import type {
	SaveMode,
	WorkflowApprover,
	WorkflowBuilderPayload,
	WorkflowExecutionMode,
	WorkflowStage,
	WorkflowStageErrors,
} from "../types/types";
import {
	addStageApprover,
	removeStageApprover,
	toggleStageExpanded,
	updateStageField,
	validateWorkflow,
} from "../utils/workflow.helpers";
import "../utils/workflow.css";
import WorkflowStagesForm from "./WorkflowStagesForm";

export interface WorkflowTemplateBuilderProps {
	sourceRecordRef: string;
	initialStages?: WorkflowStage[];
	initialFlowType?: WorkflowExecutionMode;
	initialSaveAsTemplate?: boolean;
	onAttach: (payload: WorkflowBuilderPayload) => void | Promise<void>;
	onCancel?: () => void;
	title?: string;
	disabled?: boolean;
}

const createStageId = (): string =>
	typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `stage-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function WorkflowTemplateBuilder({
	sourceRecordRef,
	initialStages = [],
	initialFlowType = "SEQUENTIAL",
	initialSaveAsTemplate = false,
	onAttach,
	onCancel,
	title = "Customise approval workflow",
	disabled = false,
}: WorkflowTemplateBuilderProps) {
	const [step, setStep] = useState<"stages" | "usage">("stages");
	const [stages, setStages] = useState<WorkflowStage[]>(() =>
		initialStages.map((stage, index) => {
			const stageId = stage.id || createStageId();

			return {
				...stage,
				id: stageId,
				stageOrder: index + 1,
				isExpanded: index === 0,
				approvers: Array.isArray(stage.approvers)
					? stage.approvers.map((approver) => ({
							...approver,
							stageId,
							user: { ...approver.user },
						}))
					: [],
			};
		}),
	);
	const [saveMode, setSaveMode] = useState<SaveMode>(
		initialSaveAsTemplate ? "template" : "once",
	);
	const [templateName, setTemplateName] = useState("");
	const [stageErrors, setStageErrors] = useState<WorkflowStageErrors[]>([]);
	const [stageFormError, setStageFormError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const handleStageChange = <K extends keyof WorkflowStage>(
		stageId: string,
		key: K,
		value: WorkflowStage[K],
	) => {
		setStages((current) => updateStageField(current, stageId, key, value));
	};

	const handleAddStage = () => {
		setStages((current) => [
			...current.map((stage) => ({ ...stage, isExpanded: false })),
			{
				id: createStageId(),
				stageOrder: current.length + 1,
				name: `Stage ${current.length + 1}`,
				strategy: "ANY",
				minApprovals: 1,
				approvers: [],
				isExpanded: true,
			},
		]);
	};

	const handleContinue = () => {
		const validation = validateWorkflow(stages);
		setStageErrors(validation.stageErrors);
		setStageFormError(validation.formError ?? null);

		const hasStageErrors = validation.stageErrors.some(
			(stageError) => Object.keys(stageError).length > 0,
		);
		if (validation.formError || hasStageErrors) return;

		setStep("usage");
	};

	const handleAttach = async () => {
		if (
			saving ||
			disabled ||
			(saveMode === "template" && !templateName.trim())
		) {
			return;
		}

		setSaving(true);
		try {
			await onAttach({
				sourceRecordRef,
				flowType: initialFlowType,
				saveAsTemplate: saveMode === "template",
				templateName: saveMode === "template" ? templateName.trim() : undefined,
				stages: stages.map(
					({ name, stageOrder, strategy, minApprovals, approvers }) => ({
						name: name.trim(),
						stageOrder,
						strategy,
						minApprovals,
						approvers,
					}),
				),
			});
		} finally {
			setSaving(false);
		}
	};

	if (step === "stages") {
		return (
			<Card title={title}>
				<WorkflowStagesForm
					stages={stages}
					errors={stageErrors}
					formError={stageFormError}
					currentUserId=""
					onStageChange={handleStageChange}
					onToggleStage={(stageId) =>
						setStages((current) => toggleStageExpanded(current, stageId))
					}
					onRemoveApprover={(stageId, approverId) =>
						setStages((current) =>
							removeStageApprover(current, stageId, approverId),
						)
					}
					onAddApprover={(stageId, approver: WorkflowApprover) =>
						setStages((current) => addStageApprover(current, stageId, approver))
					}
					onBack={() => onCancel?.()}
					onSubmit={handleContinue}
					onAddStage={handleAddStage}
				/>
			</Card>
		);
	}

	return (
		<Card title={title}>
			<div className="workflow-customise-panel">
				<div>
					<p className="workflow-customise-title">
						How should your customised version be used?
					</p>
					<p className="workflow-customise-copy">
						The original workflow will remain unchanged.
					</p>
				</div>

				<div className="workflow-save-options">
					<label
						className={
							saveMode === "once"
								? "workflow-save-option workflow-save-option--active"
								: "workflow-save-option"
						}
					>
						<input
							type="radio"
							name="custom-workflow-save-mode"
							checked={saveMode === "once"}
							onChange={() => setSaveMode("once")}
							disabled={disabled || saving}
						/>
						<span>
							<strong>Use once</strong>
							<small>Only for this form</small>
						</span>
					</label>

					<label
						className={
							saveMode === "template"
								? "workflow-save-option workflow-save-option--active"
								: "workflow-save-option"
						}
					>
						<input
							type="radio"
							name="custom-workflow-save-mode"
							checked={saveMode === "template"}
							onChange={() => setSaveMode("template")}
							disabled={disabled || saving}
						/>
						<span>
							<strong>Save as template</strong>
							<small>Reuse in other forms</small>
						</span>
					</label>
				</div>

				{saveMode === "template" ? (
					<FormInput
						label="Template name"
						value={templateName}
						onChange={(event) => setTemplateName(event.target.value)}
						placeholder="Enter a name for your workflow"
						required
						disabled={disabled || saving}
					/>
				) : null}

				<div className="workflow-form-actions">
					<Button
						type="button"
						text="Back"
						appearance="standard"
						variant="outline"
						size="sm"
						onClick={() => setStep("stages")}
						disabled={saving}
					/>
					<Button
						type="button"
						text={saving ? "Saving..." : "Continue"}
						appearance="standard"
						variant="brand"
						size="sm"
						onClick={handleAttach}
						disabled={
							disabled ||
							saving ||
							(saveMode === "template" && !templateName.trim())
						}
					/>
				</div>
			</div>
		</Card>
	);
}
