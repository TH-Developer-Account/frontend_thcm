import { ArrowLeft, HeartPulse, RefreshCcw, Send, X } from "lucide-react";

import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormInput from "../../../components/forms/FormInput";
import FormHeader from "../../../components/ui/FormHeader";
import { useMedicalClaimInitiation } from "../useMedicalClaimInitiation";
import type {
	MedicalClaimInitiationFormMode,
	MedicalClaimInitiationValues,
} from "../medicalClaimInitiation.types";

type MedicalClaimInitiationFormProps = {
	claimId?: string;
	mode?: MedicalClaimInitiationFormMode;
	initialValues?: Partial<MedicalClaimInitiationValues>;
	onCancel?: () => void;
	onBack?: () => void;
	onSuccess?: () => void | Promise<void>;
};

const MedicalClaimInitiationForm = ({
	claimId,
	mode,
	initialValues,
	onCancel,
	onBack,
	onSuccess,
}: MedicalClaimInitiationFormProps) => {
	const resolvedMode: MedicalClaimInitiationFormMode =
		mode ?? (claimId ? "view" : "create");
	const isViewMode = resolvedMode === "view";
	const fieldMode = isViewMode ? "view" : "edit";

	const {
		values,
		errors,
		isDirty,
		isSubmitting,
		isResendingLink,
		isDetailLoading,
		handleChange,
		handleReset,
		handleSubmit,
		handleResendLink,
	} = useMedicalClaimInitiation({
		claimId,
		initialValues,
		shouldFetchDetails: isViewMode,
		onSubmitSuccess: onSuccess,
	});

	const canResendLink =
		isViewMode && values.status === "AWAITING_EX_EMPLOYEE" && Boolean(claimId);

	const handleCancel = () => (onCancel ? onCancel() : onBack?.());

	return (
		<Card>
			<form
				className="medical-claim-initiation-form"
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					if (!isViewMode) void handleSubmit();
				}}
			>
				<div className="flex items-center justify-between gap-3">
					<FormHeader
						title={
							isViewMode
								? "Medical Claim Initiation Details"
								: "Initiate Medical Claim"
						}
						Icon={HeartPulse}
					/>
					{values.status ? <Badge status={values.status} /> : null}
				</div>

				{values.referenceNumber ? (
					<p className="mb-3 text-sm text-muted">
						Reference:{" "}
						<span className="font-medium text-iron-dark">
							{values.referenceNumber}
						</span>
					</p>
				) : null}

				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 px-2.5">
					<FormInput
						name="employeeName"
						label="Employee Name"
						mode={fieldMode}
						value={values.employeeName}
						required={!isViewMode}
						readOnly={isViewMode}
						disabled={isDetailLoading}
						error={isViewMode ? undefined : errors.employeeName}
						autoComplete="name"
						onChange={(event) =>
							handleChange("employeeName", event.target.value)
						}
					/>
					{/* <FormInput
						name="ticketNumber"
						label="Ticket Number"
						mode={fieldMode}
						value={values.ticketNumber}
						required={!isViewMode}
						readOnly={isViewMode}
						disabled={isDetailLoading}
						error={isViewMode ? undefined : errors.ticketNumber}
						onChange={(event) =>
							handleChange("ticketNumber", event.target.value)
						}
					/> */}
					<FormInput
						name="email"
						label="Employee Email"
						type="email"
						mode={fieldMode}
						value={values.email}
						required={!isViewMode}
						readOnly={isViewMode}
						disabled={isDetailLoading}
						error={isViewMode ? undefined : errors.email}
						autoComplete="email"
						onChange={(event) => handleChange("email", event.target.value)}
					/>
					<FormInput
						name="mobile"
						label="Employee Phone Number"
						type="tel"
						mode={fieldMode}
						value={values.mobile}
						required={!isViewMode}
						readOnly={isViewMode}
						disabled={isDetailLoading}
						error={isViewMode ? undefined : errors.mobile}
						autoComplete="tel"
						maxLength={10}
						onChange={(event) =>
							handleChange(
								"mobile",
								event.target.value.replace(/\D/g, "").slice(0, 10),
							)
						}
					/>
				</div>

				<div className="mt-5 flex items-center justify-between gap-3">
					<Button
						type="button"
						text={isViewMode ? "Back to Listing" : "Cancel"}
						Icon={isViewMode ? ArrowLeft : X}
						iconPosition="left"
						size="sm"
						appearance="standard"
						variant="outline"
						disabled={isSubmitting}
						onClick={isViewMode ? onBack : handleCancel}
					/>

					<div className="flex items-center gap-2">
						{!isViewMode ? (
							<>
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
									text={isSubmitting ? "Submitting..." : "Initiate & Send Link"}
									Icon={Send}
									iconPosition="left"
									size="sm"
									appearance="standard"
									variant="brand"
									disabled={isSubmitting}
								/>
							</>
						) : null}

						{canResendLink ? (
							<Button
								type="button"
								text="Re-Send Link"
								Icon={Send}
								iconPosition="left"
								size="sm"
								appearance="standard"
								variant="brand"
								disabled={isResendingLink || isDetailLoading}
								onClick={() => void handleResendLink()}
							/>
						) : null}
					</div>
				</div>
			</form>
		</Card>
	);
};

export default MedicalClaimInitiationForm;
