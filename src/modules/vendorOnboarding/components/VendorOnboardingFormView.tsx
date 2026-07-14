import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorCreationSummaryForm from "../forms/VendorCreationSummaryForm";
import { useVendorCreationForm } from "../hooks/useVendorCreationForm";
import type { VendorViewerRole } from "../types/vendorOnboarding.types";

type VendorOnboardingFormViewProps = {
	viewerRole?: VendorViewerRole;
};

const VendorOnboardingFormView = ({
	viewerRole = "THCM_EMPLOYEE",
}: VendorOnboardingFormViewProps) => {
	const navigate = useNavigate();

	const { onboardingId } = useParams<{
		onboardingId: string;
	}>();

	const {
		formOneValues,
		formTwoValues,
		isLoading,
		isError,
		canApprove,
		canClarify,
		canAcceptAndClose,
		handleApprove,
		handleClarify,
		handleAcceptAndClose,
	} = useVendorCreationForm({
		role: viewerRole,
		vendorRequestId: onboardingId,
	});

	const handleBackToListing = () => {
		navigate("/vendor/listing?tab=onboarding");
	};

	const pageNavigation = {
		variant: "breadcrumbs" as const,
		ariaLabel: "Vendor Onboarding Details",
		breadcrumbs: [
			{
				label: "Home Screen",
				href: "/",
			},
			{
				label: "Vendors Listing",
				href: "/vendor/listing?tab=onboarding",
			},
			{
				label: "Vendor Onboarding Details",
			},
		],
		separator: "›",
	};

	if (!onboardingId) {
		return (
			<PageSectionLayout>
				<PageHeader
					headerText="Vendor Onboarding Details"
					navigation={pageNavigation}
				/>

				<Card>
					<div className="vendor-onboarding-view-state" role="alert">
						<p>Vendor onboarding request ID was not found.</p>

						<Button
							type="button"
							text="Back to Listing"
							Icon={ArrowLeft}
							iconPosition="left"
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={handleBackToListing}
						/>
					</div>
				</Card>
			</PageSectionLayout>
		);
	}

	if (isLoading) {
		return (
			<PageSectionLayout>
				<PageHeader
					headerText="Vendor Onboarding Details"
					navigation={pageNavigation}
				/>

				<Card>
					<div
						className="vendor-onboarding-view-state"
						role="status"
						aria-live="polite"
					>
						Loading vendor onboarding details...
					</div>
				</Card>
			</PageSectionLayout>
		);
	}

	if (isError) {
		return (
			<PageSectionLayout>
				<PageHeader
					headerText="Vendor Onboarding Details"
					navigation={pageNavigation}
				/>

				<Card>
					<div className="vendor-onboarding-view-state" role="alert">
						<p>Unable to load the vendor onboarding details.</p>

						<Button
							type="button"
							text="Back to Listing"
							Icon={ArrowLeft}
							iconPosition="left"
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={handleBackToListing}
						/>
					</div>
				</Card>
			</PageSectionLayout>
		);
	}

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Vendor Onboarding Details"
				navigation={pageNavigation}
			/>

			<Card className="vendor-onboarding-view-section">
				<VendorCreationSummaryForm
					mode="view"
					formOneValues={formOneValues}
					formTwoValues={formTwoValues}
					onBack={handleBackToListing}
					onApprove={handleApprove}
					onClarify={() => handleClarify("Clarification required.")}
					onAcceptAndClose={handleAcceptAndClose}
					canSubmit={false}
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
			</Card>
		</PageSectionLayout>
	);
};

export default VendorOnboardingFormView;
