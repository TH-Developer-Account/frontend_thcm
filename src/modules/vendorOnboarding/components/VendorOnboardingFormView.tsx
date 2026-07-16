import { ArrowLeft, Pencil } from "lucide-react";
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

const VendorOnboardingReadOnlyView = ({
	viewerRole,
	onboardingId,
}: {
	viewerRole: VendorViewerRole;
	onboardingId: string;
}) => {
	const navigate = useNavigate();

	const {
		formOneValues,
		formTwoValues,
		formOneDocuments,
		isLoading,
		isError,
		status,
		canApprove,
		canClarify,
		canAcceptAndClose,
		handleApprove,
		handleClarify,
		handleAcceptAndClose,
		handleFetchWorkflow,
		workflowStages,
		workflowLoading,
	} = useVendorCreationForm({
		role: viewerRole,
		vendorRequestId: onboardingId,
		isPublicForm: false,
	});

	const canEdit = viewerRole === "THCM_EMPLOYEE" && status !== "IN_REVIEW";

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

			<Card
				className="vendor-onboarding-view-section"
				title={"Vendor Form View"}
				actions={
					canEdit ? (
						<div className="vendor-onboarding-view-actions">
							<Button
								type="button"
								text="Edit"
								size="sm"
								Icon={Pencil}
								appearance="standard"
								variant="brand"
								onClick={() => navigate(`/vendor/onboarding/${onboardingId}`)}
							/>
						</div>
					) : undefined
				}
			>
				<VendorCreationSummaryForm
					mode="view"
					formOneValues={formOneValues}
					formTwoValues={formTwoValues}
					formOneDocuments={formOneDocuments}
					onBack={handleBackToListing}
					onApprove={handleApprove}
					onClarify={handleClarify}
					onAcceptAndClose={handleAcceptAndClose}
					canSubmit={false}
					canApprove={canApprove}
					canClarify={canClarify}
					canAcceptAndClose={canAcceptAndClose}
					onFetchWorkflow={handleFetchWorkflow}
					workflowStages={workflowStages}
					workflowLoading={workflowLoading}
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

const VendorOnboardingFormView = ({
	viewerRole = "THCM_EMPLOYEE",
}: VendorOnboardingFormViewProps) => {
	const { onboardingId } = useParams<{
		onboardingId?: string;
	}>();

	if (!onboardingId) {
		return (
			<PageSectionLayout>
				<PageHeader headerText="Vendor Onboarding Details" />

				<Card>
					<div className="vendor-onboarding-view-state" role="alert">
						Vendor onboarding request ID was not found.
					</div>
				</Card>
			</PageSectionLayout>
		);
	}

	return (
		<VendorOnboardingReadOnlyView
			viewerRole={viewerRole}
			onboardingId={onboardingId}
		/>
	);
};

export default VendorOnboardingFormView;
