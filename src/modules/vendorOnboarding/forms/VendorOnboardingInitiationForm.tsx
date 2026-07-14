import {
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

import { useVendorOnboardingInitiation } from "../hooks/useVendorOnboardingInitiation";

type VendorOnboardingInitiationFormProps = {
	initiationId?: string;
	onCancel?: () => void;
	onSuccess?: () => void;
};

const VendorOnboardingInitiationForm = ({
	initiationId,
	onCancel,
	onSuccess,
}: VendorOnboardingInitiationFormProps) => {
	const {
		values,
		errors,
		isEditMode,
		isSubmitting,
		handleChange,
		handleReset,
		handleSubmit,
	} = useVendorOnboardingInitiation({
		initiationId,
		onSubmitSuccess: onSuccess,
		onUpdateSuccess: onSuccess,
	});

	return (
		<Card>
			<form
				className="vendor-onboarding-form"
				noValidate
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
						autoComplete="organization"
						onChange={(event) => handleChange("vendorName", event.target.value)}
					/>

					<FormInput
						name="vendorEmail"
						label="Vendor Email"
						type="email"
						value={values.email}
						required
						error={errors.email}
						helperText="Vendor email"
						autoComplete="email"
						onChange={(event) => handleChange("email", event.target.value)}
					/>

					<FormInput
						name="vendorPhone"
						label="Vendor Phone Number"
						type="tel"
						value={values.mobile}
						required
						error={errors.mobile}
						helperText="Vendor phone number"
						autoComplete="tel"
						onChange={(event) => handleChange("mobile", event.target.value)}
					/>
				</div>

				<div className="vendor-onboarding-form-actions">
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
							disabled={isSubmitting}
						/>
					</div>
				</div>
			</form>
		</Card>
	);
};

export default VendorOnboardingInitiationForm;
