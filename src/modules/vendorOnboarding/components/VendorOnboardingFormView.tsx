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
import { vendorContent } from "../utils/vendor.content";

import VendorCreationSummaryForm from "../forms/VendorCreationSummaryForm";
import {
	VendorCreationFormProvider,
	useVendorCreationForm,
} from "../hooks/useVendorCreationForm";
import { AuditLogSection } from "../../../components/ui/audit";

// Copy lives in content/vendor.content.en.json -> pages.*, buttons.*, listing.audit.*, audit.*
const { breadcrumbs } = vendorContent.pages;
const viewContent = vendorContent.pages.formView;

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
		// workflowStages,
		// creator,
		pdfUrl,
		pdfPreviewOpen,
		isDownloadingPdf,
		handleDownloadPdf,
		closePdfPreview,
	} = form;

	const handleBackToListing = () => {
		navigate("/vendor-onboarding/listing?tab=onboarding");
	};

	const pageNavigation = {
		variant: "breadcrumbs" as const,
		ariaLabel: viewContent.title,
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
				label: breadcrumbs.formView,
			},
		],
		separator: vendorContent.common.breadcrumbSeparator,
	};

	if (isLoading) {
		return (
			<PageSectionLayout>
				<PageHeader
					headerText={viewContent.title}
					navigation={pageNavigation}
				/>

				<CardEmpty title={viewContent.loading} Icon={LoaderIcon} />
			</PageSectionLayout>
		);
	}

	if (isError) {
		return (
			<PageSectionLayout>
				<PageHeader
					headerText={viewContent.title}
					navigation={pageNavigation}
				/>

				<CardEmpty title={viewContent.error} Icon={CircleX} />
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
					// commentsSection={
					// 	<VendorCommentSection
					// 		onboardingId={onboardingId}
					// 		workflow={workflowStages}
					// 		createdBy={creator}
					// 	/>
					// }
					auditSection={
						<AuditLogSection
							subjectType="VENDOR_ONBOARDING"
							subjectId={onboardingId}
							entityName={vendorContent.audit.entityName}
							// refreshKey={refreshKey}
							emptyTitle={vendorContent.listing.audit.emptyTitle}
							emptyDescription={vendorContent.listing.audit.emptyDescription}
						/>
					}
				/>
			</VendorCreationFormProvider>

			<Modal
				open={pdfPreviewOpen}
				title={viewContent.pdfTitle}
				size="xl"
				onClose={closePdfPreview}
				footer_actions={
					<>
						<Button
							type="button"
							text={vendorContent.buttons.close}
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={closePdfPreview}
						/>

						<Button
							type="button"
							text={
								isDownloadingPdf
									? vendorContent.buttons.downloadingPdf
									: vendorContent.buttons.downloadPdf
							}
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
						title={viewContent.pdfIframeTitle}
						className="h-[70vh] w-full rounded-md border border-gray-200"
					/>
				) : (
					<div
						className="flex h-[70vh] items-center justify-center"
						role="status"
					>
						{viewContent.pdfPreparing}
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
				<PageHeader headerText={viewContent.title} />

				<Card>
					<div className="vendor-onboarding-view-state" role="alert">
						{viewContent.missingId}
					</div>
				</Card>
			</PageSectionLayout>
		);
	}

	return <VendorOnboardingReadOnlyView onboardingId={onboardingId} />;
};

export default VendorOnboardingFormView;
