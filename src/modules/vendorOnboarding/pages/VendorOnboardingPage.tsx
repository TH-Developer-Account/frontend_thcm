import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StepProgress } from "../../../components/ui/StepProgress";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorCreationFormOne from "../forms/VendorCreationFormOne";
import VendorCreationFormTwo from "../forms/VendorCreationFormTwo";
import VendorCreationSummaryForm from "../forms/VendorCreationSummaryForm";
import { useVendorCreationForm } from "../hooks/useVendorCreationForm";

const VendorOnboardingPage = () => {
	const {
		vendorOnboardingSteps,
		currentStep,
		formOneValues,
		formTwoValues,
		formOneErrors,
		formTwoErrors,
		mutationLoading,
		canSubmit,
		canApprove,
		canClarify,
		canAcceptAndClose,
		handleBack,
		handleSaveFormOne,
		handleSaveFormTwo,
		handleSubmitSummary,
		handleApprove,
		handleClarify,
		handleAcceptAndClose,
		handleFormOneChange,
		handleFormTwoChange,
	} = useVendorCreationForm({
		role: "THCM_EMPLOYEE",
	});

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
				<StepProgress
					steps={vendorOnboardingSteps}
					currentStep={currentStep}
					className="vendor-onboarding-step-progress"
					ariaLabel="Vendor onboarding progress"
				/>

				{currentStep === 1 ? (
					<VendorCreationFormOne
						mode="edit"
						values={formOneValues}
						errors={formOneErrors}
						onChange={handleFormOneChange}
						onNext={handleSaveFormOne}
						loading={mutationLoading}
					/>
				) : currentStep === 2 ? (
					<VendorCreationFormTwo
						mode="edit"
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
