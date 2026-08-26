import {
	CircleX,
	FileDown,
	LoaderIcon,
	// ScanEye,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { Modal } from "../../../components/common/Modal";
import { CardEmpty } from "../../../components/ui/CardSkeleton";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import VendorCreationSummaryForm from "../forms/VendorCreationSummaryForm";
import {
	VendorCreationFormProvider,
	useVendorCreationForm,
} from "../hooks/useVendorCreationForm";
import { useVendorOnboardingInitiation } from "../hooks/useVendorOnboardingInitiation";
import VendorCommentSection from "./VendorCommentSection";
// import { Badge } from "../../../components/common/Badge";

type VendorOnboardingReadOnlyViewProps = {
	onboardingId: string;
};

const VendorOnboardingReadOnlyView = ({
	onboardingId,
}: VendorOnboardingReadOnlyViewProps) => {
	const navigate = useNavigate();

	const form = useVendorCreationForm({
		vendorRequestId: onboardingId,
		isPublicForm: false,
	});

	const {
		isLoading,
		isError,
		workflowStages,
		creator,
		pdfUrl,
		pdfPreviewOpen,
		isDownloadingPdf,
		handleDownloadPdf,
		closePdfPreview,
	} = form;
	const { handleSendBackToVendor } = useVendorOnboardingInitiation();

	const handleBackToListing = () => {
		navigate("/vendor/onboarding/listing?tab=onboarding");
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
				label: "Vendor Form View",
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

				<CardEmpty
					title="Loading vendor onboarding details..."
					Icon={LoaderIcon}
				/>
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

				<CardEmpty
					title="Unable to load the vendor onboarding details."
					Icon={CircleX}
				/>
			</PageSectionLayout>
		);
	}
	return (
		<PageSectionLayout>
			<VendorCreationFormProvider value={form}>
				<VendorCreationSummaryForm
					mode="view"
					onboardingId={onboardingId}
					onBack={handleBackToListing}
					onHandleSendBackVendor={handleSendBackToVendor}
					commentsSection={
						<VendorCommentSection
							onboardingId={onboardingId}
							workflow={workflowStages}
							createdBy={creator}
						/>
					}
				/>
			</VendorCreationFormProvider>

			<Modal
				open={pdfPreviewOpen}
				title="Vendor Details PDF"
				size="xl"
				onClose={closePdfPreview}
				footer_actions={
					<>
						<Button
							type="button"
							text="Close"
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={closePdfPreview}
						/>

						<Button
							type="button"
							text={isDownloadingPdf ? "Downloading…" : "Download PDF"}
							Icon={FileDown}
							iconPosition="left"
							size="sm"
							appearance="standard"
							variant="brand"
							disabled={!pdfUrl || isDownloadingPdf}
							onClick={handleDownloadPdf}
						/>
					</>
				}
			>
				{pdfUrl ? (
					<iframe
						src={pdfUrl}
						title="Vendor details PDF preview"
						className="h-[70vh] w-full rounded-md border border-gray-200"
					/>
				) : (
					<div
						className="flex h-[70vh] items-center justify-center"
						role="status"
					>
						Preparing PDF preview...
					</div>
				)}
			</Modal>
		</PageSectionLayout>
	);
};

const VendorOnboardingFormView = () => {
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

	return <VendorOnboardingReadOnlyView onboardingId={onboardingId} />;
};

export default VendorOnboardingFormView;
