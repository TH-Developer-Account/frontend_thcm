import { Navigate, useNavigate, useParams } from "react-router-dom";

import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StepProgress } from "../../../components/ui/StepProgress";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorCreationFormOne from "../forms/VendorCreationFormOne";
import VendorCreationFormTwo from "../forms/VendorCreationFormTwo";
import VendorCreationSummaryForm from "../forms/VendorCreationSummaryForm";

import {
	VendorCreationFormProvider,
	useVendorCreationForm,
} from "../hooks/useVendorCreationForm";
import CustomizedWorkflowSection from "../../workflows/components/CustomizedWorkflowSection";
import { vendorContent } from "../utils/vendor.content";

// Copy lives in content/vendor.content.en.json -> formOne.title, pages.*, buttons.*
const pageTitle = vendorContent.formOne.title;
const { breadcrumbs, onboardingForm } = vendorContent.pages;

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
		navigate("/vendor-onboarding/listing?tab=onboarding");
	};

	if (shouldRedirectToView) {
		return <Navigate to={`/vendor-onboarding/${onboardingId}/view`} replace />;
	}

	return (
		<PageSectionLayout>
			<PageHeader
				headerText={pageTitle}
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: pageTitle,
					breadcrumbs: [
						{
							label: breadcrumbs.home,
							href: "/",
						},
						{
							label: breadcrumbs.vendorsListing,
							href: "/vendor-onboarding/listing?tab=onboarding",
						},
						{
							label: pageTitle,
						},
					],
					separator: vendorContent.common.breadcrumbSeparator,
				}}
			/>

			{form.isLoading ? (
				<div role="status">{onboardingForm.loading}</div>
			) : form.isError ? (
				<div role="alert">{onboardingForm.error}</div>
			) : (
				<Card>
					<VendorCreationFormProvider value={form}>
						<StepProgress
							steps={form.vendorOnboardingSteps}
							currentStep={form.currentStep}
							className="vendor-onboarding-step-progress"
							ariaLabel={onboardingForm.progressAriaLabel}
						/>

						{form.currentStep === 1 ? (
							<VendorCreationFormOne
								mode={form.canEditFormOne ? "edit" : "view"}
								canEdit={form.canEditFormOne}
								requireDocuments={form.canEditFormOne}
								requireDpdpConsent={false}
								actionText={
									isExistingRequest
										? vendorContent.buttons.next
										: vendorContent.buttons.saveAndProceed
								}
								onSubmit={form.handleSaveFormOne}
								onBack={isExistingRequest ? handleBackToListing : undefined}
							/>
						) : form.currentStep === 2 ? (
							<VendorCreationFormTwo mode="edit" canEdit />
						) : form.currentStep === 3 ? (
							<CustomizedWorkflowSection
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
