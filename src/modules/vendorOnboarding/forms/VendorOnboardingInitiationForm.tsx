import {
	ArrowLeft,
	LucideBriefcaseBusiness,
	RefreshCcw,
	Save,
	Send,
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
};

const VendorOnboardingInitiationForm = ({
	initiationId,
	mode,
	initialValues,
	onCancel,
	onBack,
	onSuccess,
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
		handleChange,
		handleReset,
		handleSubmit,
	} = useVendorOnboardingInitiation({
		initiationId,
		initialValues,
		onSubmitSuccess: onSuccess,
		onUpdateSuccess: onSuccess,
	});

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

					if (!isViewMode) {
						handleSubmit();
					}
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
						name="email"
						label="Vendor Email"
						type="email"
						value={values.email}
						required={!isViewMode}
						readOnly={isViewMode}
						error={isViewMode ? undefined : errors.email}
						helperText={isViewMode ? undefined : "Enter the vendor email"}
						autoComplete="email"
						onChange={(event) => handleChange("email", event.target.value)}
					/>

					<FormInput
						name="mobile"
						label="Vendor Phone Number"
						type="tel"
						value={values.mobile}
						required={!isViewMode}
						readOnly={isViewMode}
						error={isViewMode ? undefined : errors.mobile}
						helperText={
							isViewMode ? undefined : "Enter the vendor phone number"
						}
						autoComplete="tel"
						onChange={(event) => handleChange("mobile", event.target.value)}
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

					{!isViewMode && (
						<div className="vendor-onboarding-form-actions-end">
							<Button
								type="button"
								text="Reset"
								Icon={RefreshCcw}
								iconPosition="left"
								size="sm"
								appearance="standard"
								variant="outline"
								disabled={!isDirty || isSubmitting}
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
								disabled={isSubmitting}
							/>
						</div>
					)}
				</div>
			</form>
		</Card>
	);
};

export default VendorOnboardingInitiationForm;
