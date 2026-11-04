import type { SingleValue } from "react-select";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import Radio from "../../../components/forms/Radio";
import SelectInput from "../../../components/forms/SelectInput";
import TextareaInput from "../../../components/forms/TextareaInput";

import type {
	WorkflowBasics,
	WorkflowGenErrors,
	WorkflowSelectOption,
} from "../types/types";
import { useWorkflowPermissions } from "../hooks/useWorkflowPermissions";
import { workflowScopeCopy } from "../utils/workflow.constants";

export type WorkflowGenProps = {
	basics: WorkflowBasics;
	errors: WorkflowGenErrors;
	onBasicChange: <K extends keyof WorkflowBasics>(
		key: K,
		value: WorkflowBasics[K],
	) => void;
	onClearError: (key: keyof WorkflowGenErrors) => void;
	// Optional: WorkflowCreateMain no longer passes them, so the page owns step
	// navigation. The buttons render only when a handler is supplied.
	onNext?: () => void;
	onBack?: () => void;
	appOptions?: WorkflowSelectOption[];
	categoryOptions?: WorkflowSelectOption[];
	showCategory?: boolean;
	showStatus?: boolean;
	// Template type (shared / personal) is decided once, when a workflow is
	// created — it is never offered while editing.
	isEditing?: boolean;
};

const WorkFlowGenForm = ({
	basics,
	errors,
	onBasicChange,
	onClearError,
	onNext,
	onBack,
	appOptions = [],
	categoryOptions = [],
	showCategory = false,
	showStatus = false,
	isEditing = false,
}: WorkflowGenProps) => {
	const { getScopeForApp } = useWorkflowPermissions();

	// Admin of a Vendor Onboarding app → can pick Shared or Personal.
	// Admin of any other app            → always Shared (no radio).
	// Non-admin                         → always Personal (no radio).
	const scopeRule = getScopeForApp(basics.app);

	const showScopeRadio =
		!isEditing && Boolean(basics.app) && scopeRule.canChoose;

	const showScopeHint =
		!isEditing && Boolean(basics.app) && !scopeRule.canChoose;

	const effectiveScope = basics.scope ?? scopeRule.scope;

	const scopeHint =
		effectiveScope === workflowScopeCopy.shared.value
			? workflowScopeCopy.shared.hint
			: workflowScopeCopy.personal.hint;

	const handleAppChange = (option: SingleValue<WorkflowSelectOption>) => {
		const nextAppId = option?.value ?? "";

		onBasicChange("app", nextAppId);
		onBasicChange("appDesc", option?.label ?? "");

		// Never carry a scope from one app into another app. The new app's rule
		// decides it: Shared for non-vendor admin apps, Personal otherwise.
		onBasicChange("scope", getScopeForApp(nextAppId).scope);

		if (!showCategory) {
			onBasicChange("category", "");
			onClearError("category");
		}

		onClearError("app");
	};

	return (
		<div className="workflow-gen-form">
			<div
				className={`workflow-create-field-row ${
					showCategory
						? "workflow-create-field-row-3"
						: "workflow-create-field-row-2"
				}`}
			>
				<FormInput
					name="name"
					label="Workflow name"
					value={basics.name}
					onChange={(event) => {
						onBasicChange("name", event.target.value);
						onClearError("name");
					}}
					error={errors.name}
					placeholder="e.g. Standard Approval"
					helperText="Used to identify this workflow across modules"
					required
				/>

				<SelectInput
					name="app"
					label="App"
					value={
						appOptions.find((option) => option.value === basics.app) ?? null
					}
					options={appOptions}
					onChange={handleAppChange}
					error={errors.app}
					helperText="For which app this workflow is being created"
					required
				/>

				{showCategory && (
					<SelectInput
						name="category"
						label="Category"
						value={
							categoryOptions.find(
								(option) => option.value === basics.category,
							) ?? null
						}
						options={categoryOptions}
						onChange={(option: SingleValue<WorkflowSelectOption>) => {
							onBasicChange("category", option?.value ?? "");
							onClearError("category");
						}}
						error={errors.category}
						helperText="For which category this workflow is being created"
						required
					/>
				)}
			</div>

			{showScopeRadio && (
				<div className="workflow-create-field-row workflow-create-field-row-2">
					<div className="workflow-create-scope">
						<Radio
							name="scope"
							groupLabel={workflowScopeCopy.groupLabel}
							label1={workflowScopeCopy.shared.label}
							label2={workflowScopeCopy.personal.label}
							value1={workflowScopeCopy.shared.value}
							value2={workflowScopeCopy.personal.value}
							selectedValue={effectiveScope}
							onChange={(value) => {
								onBasicChange("scope", value as WorkflowBasics["scope"]);
							}}
						/>

						<p className="workflow-create-scope-hint">{scopeHint}</p>
					</div>
				</div>
			)}

			{showScopeHint && (
				<p className="workflow-create-scope-hint">{scopeHint}</p>
			)}

			{showStatus && (
				<div className="workflow-create-field-row workflow-create-field-row-2">
					<Radio
						name="status"
						groupLabel="Status"
						label1="Active"
						label2="Inactive"
						value1="true"
						value2="false"
						selectedValue={String(basics.isActive)}
						onChange={(value) => {
							onBasicChange("isActive", value === "true");
						}}
					/>
				</div>
			)}

			<div className="workflow-create-field-row">
				<TextareaInput
					name="description"
					label="Description"
					className="workflow-create-textarea"
					rows={2}
					draggable="false"
					value={basics.description}
					onChange={(event) => {
						onBasicChange("description", event.target.value);
						onClearError("description");
					}}
					error={errors.description}
				/>
			</div>

			{onBack || onNext ? (
				<div className="workflow-form-actions">
					{onBack && (
						<Button
							type="button"
							direction="back"
							text="Back"
							appearance="standard"
							variant="outline"
							size="sm"
							onClick={onBack}
						/>
					)}

					{onNext && (
						<Button
							type="button"
							direction="forward"
							text="Next"
							appearance="standard"
							size="sm"
							variant="brand"
							onClick={onNext}
						/>
					)}
				</div>
			) : null}
		</div>
	);
};

export default WorkFlowGenForm;
