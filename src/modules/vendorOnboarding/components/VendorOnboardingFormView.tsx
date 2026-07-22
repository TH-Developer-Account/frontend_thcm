import { ArrowLeft, Pencil } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useAuth } from "../../../context/Auth/useAuth";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import VendorCreationSummaryForm from "../forms/VendorCreationSummaryForm";
import { useVendorCreationForm } from "../hooks/useVendorCreationForm";
import type { VendorViewerRole } from "../types/vendorOnboarding.types";
import VendorCommentSection from "./VendorCommentSection";

type VendorOnboardingFormViewProps = {
	viewerRole?: VendorViewerRole;
};

type VendorOnboardingReadOnlyViewProps = {
	viewerRole: VendorViewerRole;
	onboardingId: string;
};

const VendorOnboardingReadOnlyView = ({
	viewerRole,
	onboardingId,
}: VendorOnboardingReadOnlyViewProps) => {
	const navigate = useNavigate();

	const {
		formOneValues,
		formTwoValues,
		formOneDocuments,
		isLoading,
		isError,
		canApprove,
		canClarify,
		canEditMainForm,
		canAcceptAndClose,
		handleApprove,
		handleClarify,
		handleAcceptAndClose,
		workflowStages,
		workflowLoading,
		user,
		canEditVendorCode,
		canSaveVendorCode,
		vendorCodeLoading,
		handleSaveVendorCode,
		handleFormTwoChange,
	} = useVendorCreationForm({
		role: viewerRole,
		vendorRequestId: onboardingId,
		isPublicForm: false,
	});

	const handleBackToListing = () => {
		navigate("/vendor/onboarding/listing?tab=onboarding");
	};

	const handleEdit = () => {
		navigate(`/vendor/onboarding/${onboardingId}`);
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
				href: "/vendor/onboarding/listing?tab=onboarding",
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
				title="Vendor Form View"
				actions={
					canEditMainForm ? (
						<div className="vendor-onboarding-view-actions">
							<Button
								type="button"
								text="Edit"
								size="sm"
								Icon={Pencil}
								appearance="standard"
								variant="brand"
								onClick={handleEdit}
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
					canEditVendorCode={canEditVendorCode}
					canSaveVendorCode={canSaveVendorCode}
					vendorCodeLoading={vendorCodeLoading}
					onSaveVendorCode={handleSaveVendorCode}
					onBack={handleBackToListing}
					onApprove={handleApprove}
					onClarify={handleClarify}
					onAcceptAndClose={handleAcceptAndClose}
					canSubmit={false}
					canApprove={canApprove}
					canClarify={canClarify}
					canAcceptAndClose={canAcceptAndClose}
					workflowStages={workflowStages}
					workflowLoading={workflowLoading}
					onFormTwoChange={handleFormTwoChange}
					commentsSection={
						<VendorCommentSection
							onboardingId={onboardingId}
							workflow={workflowStages}
							creator={user}
						/>
					}
				/>
			</Card>
		</PageSectionLayout>
	);
};

const getVendorViewerRole = (
	userRole: string | undefined,
): VendorViewerRole => {
	switch (userRole) {
		case "THCM_APPROVER":
			return "THCM_APPROVER";

		case "EXTERNAL_APPROVER":
			return "EXTERNAL_APPROVER";

		case "EXTERNAL_VENDOR":
			return "EXTERNAL_VENDOR";

		case "THCM_EMPLOYEE":
		default:
			return "THCM_EMPLOYEE";
	}
};

const VendorOnboardingFormView = ({
	viewerRole,
}: VendorOnboardingFormViewProps) => {
	const { user } = useAuth();

	const { onboardingId } = useParams<{
		onboardingId?: string;
	}>();

	const resolvedViewerRole = viewerRole ?? getVendorViewerRole(user?.role);

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
			viewerRole={resolvedViewerRole}
			onboardingId={onboardingId}
		/>
	);
};

export default VendorOnboardingFormView;
