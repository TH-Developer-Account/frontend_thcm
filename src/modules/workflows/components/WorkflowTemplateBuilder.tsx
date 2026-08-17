import { useState } from "react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormInput from "../../../components/forms/FormInput";

import type {
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

// ─────────────────────────────────────────────────────────────────────────
// NOTE: `WorkflowBuilderPayload` (types/types.ts) doesn't yet declare
// `referenceNumber`. This local type extends it so the vendor-tagged save
// (see handleAttach) stays type-safe without needing to touch the shared
// types file here. Once `referenceNumber?: string` is added to
// `WorkflowBuilderPayload` directly, this local type can be removed.
// ─────────────────────────────────────────────────────────────────────────
type WorkflowBuilderPayloadWithVendorRef = WorkflowBuilderPayload & {
	referenceNumber?: string;
};

export interface WorkflowTemplateBuilderProps {
	sourceRecordRef: string;
	// Vendor's reference number (e.g. from useVendorCreationForm's
	// `referenceNumber`). Used to tag the saved workflow when the user
	// doesn't opt into naming it as a reusable template — see
	// handleAttach / the "Save as template" checkbox below.
	referenceNumber?: string;
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
	referenceNumber,
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
							user: {
								...approver.user,
							},
						}))
					: [],
			};
		}),
	);

	// ─────────────────────────────────────────────────────────────────────
	// Replaces the old "once" / "template" radio group (see the commented
	// block further down) with a single checkbox:
	//   - checked   → save as a named, reusable template
	//   - unchecked → still save the workflow, but tag it with the vendor's
	//                 referenceNumber instead of a custom name, so it can be
	//                 found again for this vendor later (replaces the old
	//                 ephemeral "use once" behaviour).
	// ─────────────────────────────────────────────────────────────────────
	const [saveAsTemplate, setSaveAsTemplate] = useState<boolean>(
		initialSaveAsTemplate,
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
			...current.map((stage) => ({
				...stage,
				isExpanded: false,
			})),
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

		if (validation.formError || hasStageErrors) {
			if (hasStageErrors) {
				// WorkflowStagesForm only renders a stage's error paragraph
				// while that stage is expanded. Without this, an error on a
				// collapsed stage (anything past the first) was invisible —
				// "Next" would just silently refuse to advance with no
				// visible reason why.
				setStages((current) =>
					current.map((stage, index) =>
						Object.keys(validation.stageErrors[index] || {}).length > 0
							? { ...stage, isExpanded: true }
							: stage,
					),
				);
			}

			return;
		}

		setStep("usage");
	};

	const handleAttach = async () => {
		if (saving || disabled || (saveAsTemplate && !templateName.trim())) {
			return;
		}

		setSaving(true);

		try {
			const payload: WorkflowBuilderPayloadWithVendorRef = {
				sourceRecordRef,
				flowType: initialFlowType,
				saveAsTemplate,
				templateName: saveAsTemplate ? templateName.trim() : undefined,
				stages: stages.map(
					({ name, stageOrder, strategy, minApprovals, approvers }) => ({
						name: name.trim(),
						stageOrder,
						strategy,
						minApprovals,
						approvers,
					}),
				),
			};

			if (!saveAsTemplate) {
				// Vendor format — tag the saved workflow with the vendor's
				// reference number so it isn't lost, even though it wasn't
				// saved as a named reusable template.
				payload.referenceNumber = referenceNumber ?? sourceRecordRef;
			}

			await onAttach(payload);
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
				<div className="workflow-customise-header">
					<p className="workflow-customise-title">
						How should this customised workflow be used?
					</p>

					<p className="workflow-customise-copy">
						The original workflow will remain unchanged.
					</p>
				</div>

				{/*
					Old "once" / "template" radio group — replaced by the "Save as
					template" checkbox below. Left here (commented, not deleted) as
					a reference in case the three-way choice needs to come back.

				<div
					className="workflow-save-options"
					role="radiogroup"
					aria-label="Workflow usage"
				>
					<label
						className={`workflow-save-option ${
							saveMode === "once" ? "workflow-save-option--active" : ""
						}`}
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
							<small>Use only for this vendor onboarding form.</small>
						</span>
					</label>

					<label
						className={`workflow-save-option ${
							saveMode === "template" ? "workflow-save-option--active" : ""
						}`}
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
							<small>Save and reuse this workflow in other forms.</small>
						</span>
					</label>
				</div>
				*/}

				<div
					className="workflow-save-options"
					role="group"
					aria-label="Workflow usage"
				>
					<label
						className={`workflow-save-option ${
							saveAsTemplate ? "workflow-save-option--active" : ""
						}`}
					>
						<input
							type="checkbox"
							name="custom-workflow-save-as-template"
							checked={saveAsTemplate}
							onChange={(event) => setSaveAsTemplate(event.target.checked)}
							disabled={disabled || saving}
						/>

						<span>
							<strong>Save as template</strong>
							<small>
								{saveAsTemplate
									? "Save and reuse this workflow in other forms."
									: "Keep this workflow with this vendor's record so you can reuse it later for the same vendor."}
							</small>
						</span>
					</label>
				</div>

				{saveAsTemplate && (
					<div className="workflow-customise-name">
						<FormInput
							name="templateName"
							label="Template name"
							value={templateName}
							onChange={(event) => setTemplateName(event.target.value)}
							placeholder="Enter a name for your workflow"
							helperText="Use a clear name so you can identify this workflow later."
							required
							disabled={disabled || saving}
						/>
					</div>
				)}

				<div className="workflow-customise-actions">
					<Button
						type="button"
						text="Back to stages"
						direction="back"
						appearance="standard"
						variant="outline"
						size="sm"
						onClick={() => setStep("stages")}
						disabled={saving}
					/>

					<Button
						type="button"
						text={
							saving
								? "Saving..."
								: saveAsTemplate
									? "Save and use workflow"
									: "Use workflow"
						}
						direction="forward"
						appearance="standard"
						variant="brand"
						size="sm"
						onClick={handleAttach}
						disabled={
							disabled || saving || (saveAsTemplate && !templateName.trim())
						}
					/>
				</div>
			</div>
		</Card>
	);
}
