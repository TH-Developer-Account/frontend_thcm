import {
	ArrowLeft,
	LucideBriefcaseBusiness,
	RefreshCcw,
	Save,
	Send,
	Trash2,
	X,
} from "lucide-react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormInput from "../../../components/forms/FormInput";
import FormHeader from "../../marketing/activity-planner/components/common/FormHeader";

import {
	useVendorOnboardingInitiation,
	type VendorOnboardingInitiationPayload,
} from "../hooks/useVendorOnboardingInitiation";

export type VendorInitiationFormMode = "create" | "edit" | "view";

type VendorOnboardingInitiationFormProps = {
	initiationId?: string;
	mode?: VendorInitiationFormMode;
	initialValues?: Partial<VendorOnboardingInitiationPayload>;
	onCancel?: () => void;
	onBack?: () => void;
	onSuccess?: () => void | Promise<void>;
	onDeleteSuccess?: () => void | Promise<void>;
};

const VendorOnboardingInitiationForm = ({
	initiationId,
	mode,
	initialValues,
	onCancel,
	onBack,
	onSuccess,
	onDeleteSuccess,
}: VendorOnboardingInitiationFormProps) => {
	const resolvedMode: VendorInitiationFormMode =
		mode ?? (initiationId ? "edit" : "create");

	const isViewMode = resolvedMode === "view";
	const isEditMode = resolvedMode === "edit";

	const {
		values,
		errors,
		isDirty,
		isSubmitting,
		isDeleting,
		handleChange,
		handleReset,
		handleSubmit,
		handleDelete,
	} = useVendorOnboardingInitiation({
		initiationId,
		initialValues,
		onSubmitSuccess: onSuccess,
		onUpdateSuccess: onSuccess,
		onDeleteSuccess,
	});

	const handleFormSubmit = () => {
		if (isViewMode) {
			return;
		}

		handleSubmit();
	};

	const handleCancel = () => {
		if (onCancel) {
			onCancel();
			return;
		}

		onBack?.();
	};

	return (
		<Card>
			<form
				className="vendor-onboarding-form"
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					handleFormSubmit();
				}}
			>
				<FormHeader
					title={
						isViewMode
							? "Vendor Initiation Details"
							: isEditMode
								? "Edit Vendor Initiation"
								: "Vendor Info"
					}
					Icon={LucideBriefcaseBusiness}
				/>

				<div className="vendor-onboarding-form-grid">
					<FormInput
						name="vendorName"
						label="Vendor Name"
						value={values.vendorName}
						required={!isViewMode}
						readOnly={isViewMode}
						error={isViewMode ? undefined : errors.vendorName}
						helperText={isViewMode ? undefined : "Enter the vendor name"}
						autoComplete="organization"
						onChange={(event) => handleChange("vendorName", event.target.value)}
					/>

					<FormInput
						name="vendorEmail"
						label="Vendor Email"
						type="email"
						value={values.vendorEmail}
						required={!isViewMode}
						readOnly={isViewMode}
						error={isViewMode ? undefined : errors.vendorEmail}
						helperText={isViewMode ? undefined : "Enter the vendor email"}
						autoComplete="email"
						onChange={(event) =>
							handleChange("vendorEmail", event.target.value)
						}
					/>

					<FormInput
						name="vendorPhone"
						label="Vendor Phone Number"
						type="tel"
						value={values.vendorPhone}
						required={!isViewMode}
						readOnly={isViewMode}
						error={isViewMode ? undefined : errors.vendorPhone}
						helperText={
							isViewMode ? undefined : "Enter the vendor phone number"
						}
						autoComplete="tel"
						onChange={(event) =>
							handleChange("vendorPhone", event.target.value)
						}
					/>
				</div>

				<FormHeader title="Contact Person" Icon={LucideBriefcaseBusiness} />

				<div className="vendor-onboarding-form-grid">
					<FormInput
						name="personName"
						label="Contact Person Name"
						value={values.personName}
						required={!isViewMode}
						readOnly={isViewMode}
						error={isViewMode ? undefined : errors.personName}
						helperText={
							isViewMode ? undefined : "Enter the contact person's name"
						}
						autoComplete="name"
						onChange={(event) => handleChange("personName", event.target.value)}
					/>

					<FormInput
						name="personEmail"
						label="Contact Person Email"
						type="email"
						value={values.personEmail}
						required={!isViewMode}
						readOnly={isViewMode}
						error={isViewMode ? undefined : errors.personEmail}
						helperText={
							isViewMode ? undefined : "Enter the contact person's email"
						}
						autoComplete="email"
						onChange={(event) =>
							handleChange("personEmail", event.target.value)
						}
					/>

					<FormInput
						name="personPhone"
						label="Contact Person Phone Number"
						type="tel"
						value={values.personPhone}
						required={!isViewMode}
						readOnly={isViewMode}
						error={isViewMode ? undefined : errors.personPhone}
						helperText={
							isViewMode ? undefined : "Enter the contact person's phone number"
						}
						autoComplete="tel"
						onChange={(event) =>
							handleChange("personPhone", event.target.value)
						}
					/>
				</div>

				<div className="vendor-onboarding-form-actions">
					{isViewMode ? (
						<Button
							type="button"
							text="Back to Listing"
							Icon={ArrowLeft}
							iconPosition="left"
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={onBack}
						/>
					) : isEditMode ? (
						<Button
							type="button"
							text={isDeleting ? "Deleting..." : "Delete"}
							Icon={Trash2}
							iconPosition="left"
							size="sm"
							appearance="standard"
							variant="danger"
							disabled={isDeleting || isSubmitting}
							onClick={handleDelete}
						/>
					) : (
						<Button
							type="button"
							text="Cancel"
							Icon={X}
							iconPosition="left"
							size="sm"
							appearance="standard"
							variant="outline"
							disabled={isSubmitting}
							onClick={handleCancel}
						/>
					)}

					{isViewMode ? null : (
						<div className="vendor-onboarding-form-actions-end">
							<Button
								type="button"
								text="Reset"
								Icon={RefreshCcw}
								iconPosition="left"
								size="sm"
								appearance="standard"
								variant="outline"
								disabled={!isDirty || isSubmitting || isDeleting}
								onClick={handleReset}
							/>

							<Button
								type="submit"
								text={
									isSubmitting
										? isEditMode
											? "Updating..."
											: "Submitting..."
										: isEditMode
											? "Update"
											: "Submit"
								}
								Icon={isEditMode ? Save : Send}
								iconPosition="left"
								size="sm"
								appearance="standard"
								variant="brand"
								disabled={isSubmitting || isDeleting}
							/>
						</div>
					)}
				</div>
			</form>
		</Card>
	);
};

export default VendorOnboardingInitiationForm;
