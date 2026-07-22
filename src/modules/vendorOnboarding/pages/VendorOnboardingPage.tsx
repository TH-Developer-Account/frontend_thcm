import { Navigate, useParams } from "react-router-dom";

import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StepProgress } from "../../../components/ui/StepProgress";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorCreationFormOne from "../forms/VendorCreationFormOne";
import VendorCreationFormTwo from "../forms/VendorCreationFormTwo";
import VendorCreationSummaryForm from "../forms/VendorCreationSummaryForm";
import { useVendorCreationForm } from "../hooks/useVendorCreationForm";

const VendorOnboardingPage = () => {
	const { onboardingId } = useParams<{
		onboardingId?: string;
	}>();

	const form = useVendorCreationForm({
		role: "THCM_EMPLOYEE",
		vendorRequestId: onboardingId,
		isPublicForm: false,
	});

	const isExistingRequest = Boolean(onboardingId);

	const shouldRedirectToView =
		isExistingRequest &&
		!form.isLoading &&
		!form.isError &&
		Boolean(form.status) &&
		form.status === "APPROVED";

	const handleBackToView = () => {
		<Navigate to={`/vendor/onboarding/${onboardingId}/view`} replace />;
	};
	if (shouldRedirectToView) {
		return <Navigate to={`/vendor/onboarding/${onboardingId}/view`} replace />;
	}

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Vendor Onboarding Form"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Vendor Onboarding Form",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Vendors Listing",
							href: "/vendor/onboarding/listing?tab=onboarding",
						},
						{
							label: "Vendor Onboarding Form",
						},
					],
					separator: "›",
				}}
			/>

			<Card>
				{form.isLoading ? (
					<div role="status">Loading vendor onboarding details...</div>
				) : form.isError ? (
					<div role="alert">Unable to load vendor onboarding details.</div>
				) : (
					<>
						<StepProgress
							steps={form.vendorOnboardingSteps}
							currentStep={form.currentStep}
							className="vendor-onboarding-step-progress"
							ariaLabel="Vendor onboarding progress"
						/>

						{form.currentStep === 1 ? (
							<VendorCreationFormOne
								mode={form.canEditFormOne ? "edit" : "view"}
								canEdit={form.canEditFormOne}
								values={form.formOneValues}
								errors={form.formOneErrors}
								initialDocuments={form.formOneDocuments}
								requireDocuments={!isExistingRequest}
								requireDpdpConsent={!isExistingRequest}
								actionText={isExistingRequest ? "Next" : "Save & Proceed"}
								onChange={form.handleFormOneChange}
								onNext={
									isExistingRequest ? form.handleNext : form.handleSaveFormOne
								}
								loading={form.mutationLoading}
								onBack={isExistingRequest ? handleBackToView : undefined}
							/>
						) : form.currentStep === 2 ? (
							<VendorCreationFormTwo
								mode="edit"
								canEdit
								values={form.formTwoValues}
								errors={form.formTwoErrors}
								onChange={form.handleFormTwoChange}
								onBack={form.handleBack}
								onNext={form.handleSaveFormTwo}
								loading={form.mutationLoading}
							/>
						) : (
							<VendorCreationSummaryForm
								formOneValues={form.formOneValues}
								formTwoValues={form.formTwoValues}
								formOneDocuments={form.formOneDocuments}
								onBack={form.handleBack}
								canSubmit={form.canSubmit}
								onSubmit={form.handleSubmitSummary}
								workflowStages={form.workflowStages}
								workflowLoading={form.workflowLoading}
							/>
						)}
					</>
				)}
			</Card>
		</PageSectionLayout>
	);
};

export default VendorOnboardingPage;
