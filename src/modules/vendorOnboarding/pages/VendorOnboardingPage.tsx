import { Navigate, useNavigate, useParams } from "react-router-dom";

import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StepProgress } from "../../../components/ui/StepProgress";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import VendorWorkflowSection from "../components/VendorWorkflowSection";
import VendorCreationFormOne from "../forms/VendorCreationFormOne";
import VendorCreationFormTwo from "../forms/VendorCreationFormTwo";
import VendorCreationSummaryForm from "../forms/VendorCreationSummaryForm";

import {
	VendorCreationFormProvider,
	useVendorCreationForm,
} from "../hooks/useVendorCreationForm";

const VendorOnboardingPage = () => {
	const { onboardingId } = useParams<{
		onboardingId?: string;
	}>();

	const navigate = useNavigate();

	const form = useVendorCreationForm({
		vendorRequestId: onboardingId,
		isPublicForm: false,
	});

	const isExistingRequest = Boolean(onboardingId);

	const shouldRedirectToView =
		isExistingRequest &&
		!form.isLoading &&
		!form.isError &&
		!form.canEditMainForm;

	const handleBackToListing = () => {
		navigate("/vendor/onboarding/listing?tab=onboarding");
	};

	if (shouldRedirectToView) {
		return <Navigate to={`/vendor/onboarding/${onboardingId}/view`} replace />;
	}

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Domestic Vendor Onboarding Form"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Domestic Vendor Onboarding Form",
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
							label: "Domestic Vendor Onboarding Form",
						},
					],
					separator: "›",
				}}
			/>

			{form.isLoading ? (
				<div role="status">Loading vendor onboarding details...</div>
			) : form.isError ? (
				<div role="alert">Unable to load vendor onboarding details.</div>
			) : (
				<Card>
					<VendorCreationFormProvider value={form}>
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
								requireDocuments={!isExistingRequest}
								requireDpdpConsent={false}
								actionText={isExistingRequest ? "Next" : "Save & Proceed"}
								onNext={form.handleSaveFormOne}
								onBack={isExistingRequest ? handleBackToListing : undefined}
							/>
						) : form.currentStep === 2 ? (
							<VendorCreationFormTwo mode="edit" canEdit />
						) : form.currentStep === 3 ? (
							<VendorWorkflowSection
								sourceRecordRef={form.vendorRequestId}
								recordType="VENDOR_ONBOARDING"
								selectedWorkflow={form.pendingWorkflowSelection}
								activeWorkflow={form.activeWorkflow}
								isClarificationResubmission={form.hasPendingClarifiedApproval}
								onWorkflowSelected={(selection) => {
									form.setPendingWorkflowSelection(selection);
								}}
								onClearWorkflow={() => {
									form.setPendingWorkflowSelection(null);
								}}
								onBack={form.handleBack}
								onNext={form.handleNext}
								canEditActiveWorkflow={form.canEditStagesOnResubmit}
								stageEdits={form.stageEdits}
								onStageEditsChange={form.setStageEdits}
								currentUserId={form.user?.id ?? ""}
							/>
						) : (
							<VendorCreationSummaryForm
								mode="edit"
								canSubmit={form.canSubmit || form.isThcmProposer}
								onSubmit={form.handleSubmitSummary}
							/>
						)}
					</VendorCreationFormProvider>
				</Card>
			)}
		</PageSectionLayout>
	);
};

export default VendorOnboardingPage;
