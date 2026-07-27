import { useState } from "react";
import { ArrowLeft, FileDown, Pencil } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { ServerAxios } from "../../../services/ServerAxios";

import VendorCreationSummaryForm from "../forms/VendorCreationSummaryForm";
import {
	VendorCreationFormProvider,
	useVendorCreationForm,
} from "../hooks/useVendorCreationForm";
import type { VendorViewerRole } from "../types/vendorOnboarding.types";
import VendorCommentSection from "./VendorCommentSection";
import { useVendorOnboardingInitiation } from "../hooks/useVendorOnboardingInitiation";

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
	const { showToast } = useToast();
	const [isDownloading, setIsDownloading] = useState(false);

	const form = useVendorCreationForm({
		role: viewerRole,
		vendorRequestId: onboardingId,
		isPublicForm: false,
	});
	const { isLoading, isError, canEditMainForm, workflowStages, user, creator } =
		form;
	const { handleSendBackToVendor } = useVendorOnboardingInitiation();

	const handleBackToListing = () => {
		navigate("/vendor/onboarding/listing?tab=onboarding");
	};

	const handleEdit = () => {
		navigate(`/vendor/onboarding/${onboardingId}`);
	};

	const handleExport = async () => {
		setIsDownloading(true);

		try {
			const response = await ServerAxios.get(
				`/vendor-onboarding/export/${onboardingId}`,
				{ responseType: "blob" },
			);

			const referenceNumber = creator?.referenceNumber?.trim() || onboardingId;
			const blobUrl = window.URL.createObjectURL(response.data as Blob);
			const link = document.createElement("a");

			link.href = blobUrl;
			link.download = `vendor-onboarding-${referenceNumber}.xlsx`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(blobUrl);
		} catch {
			showToast({
				type: "error",
				title: "Request failed",
				description: "Failed to download the Excel file.",
			});
		} finally {
			setIsDownloading(false);
		}
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

			<VendorCreationFormProvider value={form}>
				<Card
					className="vendor-onboarding-view-section"
					title="Vendor Form View"
					actions={
						<div className="vendor-onboarding-view-actions">
							<Button
								type="button"
								text={isDownloading ? "Exporting…" : "Export"}
								Icon={FileDown}
								iconPosition="left"
								iconSize={16}
								appearance="cta"
								variant="brand"
								size="sm"
								onClick={handleExport}
								disabled={isDownloading}
							/>

							{canEditMainForm ? (
								<Button
									type="button"
									text="Edit"
									size="sm"
									Icon={Pencil}
									appearance="standard"
									variant="brand"
									onClick={handleEdit}
								/>
							) : null}
						</div>
					}
				>
					<VendorCreationSummaryForm
						mode="view"
						onBack={handleBackToListing}
						onHandleSendBackVendor={handleSendBackToVendor}
						commentsSection={
							<VendorCommentSection
								onboardingId={onboardingId}
								workflow={workflowStages}
								creator={user}
							/>
						}
					/>
				</Card>
			</VendorCreationFormProvider>
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
