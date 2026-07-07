import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormInput from "../../../components/forms/FormInput";
import FormHeader from "../../marketing/activity-planner/components/common/FormHeader";
import {
	LucideBriefcaseBusiness,
	RefreshCcw,
	Save,
	Send,
	Trash2,
	X,
} from "lucide-react";
import { useVendorOnboardingInitiation } from "../hooks/useVendorOnboardingInitiation";

type VendorOnboardingInitiationFormProps = {
	initiationId?: string;
	onCancel?: () => void;
	onSuccess?: () => void;
	onDeleteSuccess?: () => void;
};

const VendorOnboardingInitiationForm = ({
	initiationId,
	onCancel,
	onSuccess,
	onDeleteSuccess,
}: VendorOnboardingInitiationFormProps) => {
	const {
		values,
		errors,
		isEditMode,
		isSubmitting,
		isDeleting,
		handleChange,
		handleReset,
		handleSubmit,
		handleDelete,
	} = useVendorOnboardingInitiation({
		initiationId,
		onSubmitSuccess: onSuccess,
		onUpdateSuccess: onSuccess,
		onDeleteSuccess,
	});

	return (
		<Card>
			<form
				className="vendor-onboarding-form"
				onSubmit={(event) => {
					event.preventDefault();
					handleSubmit();
				}}
			>
				<FormHeader title="Vendor Info" Icon={LucideBriefcaseBusiness} />

				<div className="vendor-onboarding-form-grid">
					<FormInput
						name="vendorName"
						label="Vendor Name"
						value={values.vendorName}
						required
						error={errors.vendorName}
						helperText="Vendor name"
						onChange={(event) => handleChange("vendorName", event.target.value)}
					/>

					<FormInput
						name="vendorEmail"
						label="Vendor Email"
						value={values.vendorEmail}
						required
						error={errors.vendorEmail}
						helperText="Vendor email"
						onChange={(event) =>
							handleChange("vendorEmail", event.target.value)
						}
					/>

					<FormInput
						name="vendorPhone"
						label="Vendor Phone Number"
						value={values.vendorPhone}
						required
						error={errors.vendorPhone}
						helperText="Vendor phone number"
						onChange={(event) =>
							handleChange("vendorPhone", event.target.value)
						}
					/>
				</div>

				<FormHeader title="Main Contact Info" Icon={LucideBriefcaseBusiness} />

				<div className="vendor-onboarding-form-grid">
					<FormInput
						name="personName"
						label="Person Name"
						value={values.personName}
						error={errors.personName}
						helperText="Person name"
						onChange={(event) => handleChange("personName", event.target.value)}
					/>

					<FormInput
						name="personEmail"
						label="Person Email"
						value={values.personEmail}
						error={errors.personEmail}
						helperText="Person email"
						onChange={(event) =>
							handleChange("personEmail", event.target.value)
						}
					/>

					<FormInput
						name="personPhone"
						label="Person Phone Number"
						value={values.personPhone}
						error={errors.personPhone}
						helperText="Person phone number"
						onChange={(event) =>
							handleChange("personPhone", event.target.value)
						}
					/>
				</div>

				<div className="vendor-onboarding-form-actions">
					{isEditMode ? (
						<Button
							type="button"
							text={isDeleting ? "Deleting..." : "Delete"}
							size="sm"
							Icon={Trash2}
							appearance="standard"
							variant="danger"
							disabled={isDeleting || isSubmitting}
							onClick={handleDelete}
						/>
					) : (
						<Button
							type="button"
							text="Cancel"
							size="sm"
							Icon={X}
							appearance="standard"
							variant="outline"
							disabled={isSubmitting}
							onClick={onCancel}
						/>
					)}

					<div className="vendor-onboarding-form-actions-end">
						<Button
							type="button"
							text="Reset"
							Icon={RefreshCcw}
							size="sm"
							appearance="standard"
							variant="outline"
							disabled={isSubmitting}
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
							size="sm"
							appearance="standard"
							variant="brand"
							Icon={isEditMode ? Save : Send}
							disabled={isSubmitting || isDeleting}
						/>
					</div>
				</div>
			</form>
		</Card>
	);
};

export default VendorOnboardingInitiationForm;
