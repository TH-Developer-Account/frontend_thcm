import { useState } from "react";
import {
	LucideBriefcaseBusiness,
	RefreshCcw,
	Save,
	Send,
	Trash2,
	X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormInput from "../../../components/forms/FormInput";
import FormHeader from "../../marketing/activity-planner/components/common/FormHeader";

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
	const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
	const navigate = useNavigate();

	const handleSubmissionSuccess = () => {
		onSuccess?.();
		navigate("/vendor/listing?tab=initiation");
	};
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
		onSubmitSuccess: handleSubmissionSuccess,
		onUpdateSuccess: handleSubmissionSuccess,
		onDeleteSuccess,
	});

	const submitForm = () => {
		console.log("Vendor onboarding form details:", {
			...values,
		});

		handleSubmit();
	};

	const resetForm = () => {
		setIsSubmitSuccessful(false);
		handleReset();
	};

	return (
		<Card>
			{isSubmitSuccessful ? (
				<div className="vendor-onboarding-form-success" role="status">
					<p>
						{isEditMode
							? "The vendor details have been updated successfully."
							: "The vendor onboarding form has been submitted successfully."}
					</p>
				</div>
			) : (
				<form
					className="vendor-onboarding-form"
					noValidate
					onSubmit={(event) => {
						event.preventDefault();
						submitForm();
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
							autoComplete="organization"
							onChange={(event) =>
								handleChange("vendorName", event.target.value)
							}
						/>

						<FormInput
							name="vendorEmail"
							label="Vendor Email"
							type="email"
							value={values.vendorEmail}
							required
							error={errors.vendorEmail}
							helperText="Vendor email"
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
							required
							error={errors.vendorPhone}
							helperText="Vendor phone number"
							autoComplete="tel"
							onChange={(event) =>
								handleChange("vendorPhone", event.target.value)
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
								disabled={isSubmitting || isDeleting}
								onClick={resetForm}
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
			)}
		</Card>
	);
};

export default VendorOnboardingInitiationForm;
