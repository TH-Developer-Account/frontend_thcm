import { useMemo } from "react";
import type { SingleValue } from "react-select";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import Radio from "../../../components/forms/Radio";
import SelectInput from "../../../components/forms/SelectInput";
import TextareaInput from "../../../components/forms/TextareaInput";
import { useAuth } from "../../../context/Auth/useAuth";

import type {
	WorkflowBasics,
	WorkflowGenErrors,
	WorkflowSelectOption,
} from "../types/types";

export type WorkflowGenProps = {
	basics: WorkflowBasics;
	errors: WorkflowGenErrors;
	onBasicChange: <K extends keyof WorkflowBasics>(
		key: K,
		value: WorkflowBasics[K],
	) => void;
	onClearError: (key: keyof WorkflowGenErrors) => void;
	onNext: () => void;
	onBack?: () => void;
	appOptions?: WorkflowSelectOption[];
	categoryOptions?: WorkflowSelectOption[];
	showCategory?: boolean;
	showStatus?: boolean;
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
}: WorkflowGenProps) => {
	const { permissions, canManageApp, isSuperAdmin } = useAuth();

	/**
	 * Build app options from the logged-in user's permissions.
	 *
	 * A user can have multiple permission rows for the same app because each
	 * module/action is returned separately. Map ensures each app appears once.
	 */
	const permissionAppOptions = useMemo<WorkflowSelectOption[]>(() => {
		const uniqueApps = new Map<string, WorkflowSelectOption>();

		permissions.forEach((permission) => {
			if (!permission.appId || !permission.appName) return;

			uniqueApps.set(permission.appId, {
				value: permission.appId,
				label: permission.appName,
			});
		});

		return Array.from(uniqueApps.values());
	}, [permissions]);

	/**
	 * Prefer options supplied by the parent. If the parent has not supplied
	 * them, use the apps available through the user's permissions.
	 */
	const resolvedAppOptions =
		appOptions.length > 0 ? appOptions : permissionAppOptions;

	const selectedPermission = permissions.find(
		(permission) => permission.appId === basics.app,
	);

	const selectedAppKey = selectedPermission?.appKey;

	/**
	 * The scope selector is shown only after an app is selected and the user
	 * is either a super admin or an app-level administrator.
	 */
	const isEligibleForAppScope = Boolean(
		basics.app &&
		selectedAppKey &&
		(isSuperAdmin || canManageApp(selectedAppKey)),
	);

	const handleAppChange = (option: SingleValue<WorkflowSelectOption>) => {
		onBasicChange("app", option?.value ?? "");
		onBasicChange("appDesc", option?.label ?? "");

		// Never carry APP scope from one app into another app.
		onBasicChange("scope", "USER");

		if (!showCategory) {
			onBasicChange("category", "");
			onClearError("category");
		}

		onClearError("app");
	};

	return (
		<>
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
						resolvedAppOptions.find((option) => option.value === basics.app) ??
						null
					}
					options={resolvedAppOptions}
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

			{isEligibleForAppScope && (
				<div className="workflow-create-field-row workflow-create-field-row-2">
					<Radio
						name="scope"
						groupLabel="Who is this workflow for?"
						label1="Everyone in this app (admin template)"
						label2="Just me (personal template)"
						value1="APP"
						value2="USER"
						selectedValue={basics.scope ?? "USER"}
						onChange={(value) => {
							onBasicChange("scope", value as WorkflowBasics["scope"]);
						}}
					/>
				</div>
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

				<Button
					type="button"
					direction="forward"
					text="Next"
					appearance="standard"
					size="sm"
					variant="brand"
					onClick={onNext}
				/>
			</div>
		</>
	);
};

export default WorkFlowGenForm;
