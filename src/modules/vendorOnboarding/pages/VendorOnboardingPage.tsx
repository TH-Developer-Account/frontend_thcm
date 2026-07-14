import { useState } from "react";

import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StepProgress } from "../../../components/ui/StepProgress";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorCreationFormOne from "../forms/VendorCreationFormOne";
import VendorCreationFormTwo from "../forms/VendorCreationFormTwo";
import VendorCreationSummaryForm from "../forms/VendorCreationSummaryForm";
import { useVendorCreationForm } from "../hooks/useVendorCreationForm";
import type { VendorViewerRole } from "../types/vendorOnboarding.types";

const VendorOnboardingPage = () => {
	const [vendorFormFilled, setVendorFormFilled] = useState(false);

	// Replace this with auth-derived role when connected.
	// const viewerRole = "THCM_EMPLOYEE" as VendorViewerRole;
	const viewerRole: VendorViewerRole = "EXTERNAL_VENDOR";

	const {
		vendorOnboardingSteps,
		currentStep,
		formOneValues,
		formTwoValues,
		formOneErrors,
		formTwoErrors,
		mutationLoading,
		canEditFormOne,
		canEditFormTwo,
		canSubmitVendorForm,
		canSubmit,
		canApprove,
		canClarify,
		canAcceptAndClose,
		handleBack,
		handleSaveFormOne,
		handleSaveFormTwo,
		handleVendorSubmitForm,
		handleSubmitSummary,
		handleApprove,
		handleClarify,
		handleAcceptAndClose,
		handleFormOneChange,
		handleFormTwoChange,
	} = useVendorCreationForm({
		role: viewerRole,
		onSuccess: () => {
			if (viewerRole === "EXTERNAL_VENDOR") {
				setVendorFormFilled(true);
			}
		},
	});

	const isExternalVendor = viewerRole === "EXTERNAL_VENDOR";

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Vendor Onboarding Form"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Vendor Onboarding Form",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{ label: "Vendors Listing", href: "/vendor/listing" },
						{ label: "Vendor Onboarding Form" },
					],
					separator: "›",
				}}
			/>

			<Card>
				{isExternalVendor ? null : (
					<StepProgress
						steps={vendorOnboardingSteps}
						currentStep={currentStep}
						className="vendor-onboarding-step-progress"
						ariaLabel="Vendor onboarding progress"
					/>
				)}

				{isExternalVendor ? (
					<VendorCreationFormOne
						mode={vendorFormFilled ? "view" : "edit"}
						canEdit={canEditFormOne && !vendorFormFilled}
						values={formOneValues}
						errors={formOneErrors}
						onChange={handleFormOneChange}
						onSubmit={canSubmitVendorForm ? handleVendorSubmitForm : undefined}
						loading={mutationLoading}
						submittedMessage={
							vendorFormFilled
								? "Form filled successfully. THCM will review the submitted details."
								: undefined
						}
					/>
				) : currentStep === 1 ? (
					<VendorCreationFormOne
						mode={canEditFormOne ? "edit" : "view"}
						canEdit={canEditFormOne}
						values={formOneValues}
						errors={formOneErrors}
						onChange={handleFormOneChange}
						onNext={handleSaveFormOne}
						loading={mutationLoading}
					/>
				) : currentStep === 2 ? (
					<VendorCreationFormTwo
						mode={canEditFormTwo ? "edit" : "view"}
						canEdit={canEditFormTwo}
						values={formTwoValues}
						errors={formTwoErrors}
						onChange={handleFormTwoChange}
						onBack={handleBack}
						onNext={handleSaveFormTwo}
						loading={mutationLoading}
					/>
				) : (
					<VendorCreationSummaryForm
						formOneValues={formOneValues}
						formTwoValues={formTwoValues}
						onBack={handleBack}
						onSubmit={handleSubmitSummary}
						onApprove={handleApprove}
						onClarify={() => handleClarify("Clarification required.")}
						onAcceptAndClose={handleAcceptAndClose}
						canSubmit={canSubmit}
						canApprove={canApprove}
						canClarify={canClarify}
						canAcceptAndClose={canAcceptAndClose}
						workflowSection={
							<div className="vendor-summary-placeholder">
								Workflow details will render here.
							</div>
						}
						commentsSection={
							<div className="vendor-summary-placeholder">
								Comments section will render here.
							</div>
						}
					/>
				)}
			</Card>
		</PageSectionLayout>
	);
};

export default VendorOnboardingPage;
