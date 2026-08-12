import { useState } from "react";
import {
	CircleX,
	FileDown,
	FileSpreadsheet,
	LoaderIcon,
	Pencil,
	// ScanEye,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../components/common/ActionMenu";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { Modal } from "../../../components/common/Modal";
import { CardEmpty } from "../../../components/ui/CardSkeleton";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useToast } from "../../../context/Auth/AuthContext";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { ServerAxios } from "../../../services/ServerAxios";

import VendorCreationSummaryForm from "../forms/VendorCreationSummaryForm";
import {
	VendorCreationFormProvider,
	useVendorCreationForm,
} from "../hooks/useVendorCreationForm";
import { useVendorOnboardingInitiation } from "../hooks/useVendorOnboardingInitiation";
import VendorCommentSection from "./VendorCommentSection";
import { Badge } from "../../../components/common/Badge";

type VendorOnboardingReadOnlyViewProps = {
	onboardingId: string;
};

const VendorOnboardingReadOnlyView = ({
	onboardingId,
}: VendorOnboardingReadOnlyViewProps) => {
	const navigate = useNavigate();
	const { showToast } = useToast();

	const [isExportingExcel, setIsExportingExcel] = useState(false);

	const form = useVendorCreationForm({
		vendorRequestId: onboardingId,
		isPublicForm: false,
	});

	const {
		isLoading,
		isError,
		canEditMainForm,
		workflowStages,
		creator,
		vendorDetail,
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

	const handleEdit = () => {
		navigate(`/vendor/onboarding/${onboardingId}`);
	};

	const handleExport = async () => {
		setIsExportingExcel(true);

		try {
			const response = await ServerAxios.get(
				`/vendor-onboarding/export/${onboardingId}`,
				{ responseType: "blob" },
			);

			const referenceNumber =
				vendorDetail?.referenceNumber?.trim() || onboardingId;

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
			setIsExportingExcel(false);
		}
	};
	const actions: ActionMenuItem<string>[] = [
		// {
		// 	id: "view-pdf",
		// 	label: isPreparingPdf ? "Preparing PDF…" : "View PDF",
		// 	Icon: ScanEye,
		// 	onClick: handleViewPdf,
		// 	disabled: isPreparingPdf || isDownloadingPdf,
		// },
		{
			id: "download-pdf",
			label: isDownloadingPdf ? "Downloading…" : "Download PDF",
			Icon: FileDown,
			onClick: handleDownloadPdf,
			disabled: !pdfUrl || isDownloadingPdf,
		},
		{
			id: "export-excel",
			label: isExportingExcel ? "Exporting…" : "Export Excel",
			Icon: FileSpreadsheet,
			onClick: handleExport,
			disabled: isExportingExcel,
		},
		{
			id: "edit",
			label: "Edit",
			Icon: Pencil,
			onClick: handleEdit,
			hidden: !canEditMainForm,
		},
	];

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
			<PageHeader
				headerText="Vendor Onboarding Details"
				navigation={pageNavigation}
			/>

			<VendorCreationFormProvider value={form}>
				<Card
					className="vendor-onboarding-view-section"
					title={
						<p>
							<span className="mr-2 text-sm ">Reference No:</span>
							{form.referenceNumber}
						</p>
					}
					secondaryHeader={
						<p>
							<span className="mr-2 text-sm">Status:</span>
							{form.status ? <Badge status={form.status} /> : null}
						</p>
					}
					secondaryHeaderClassName=" py-0"
					actions={
						<ActionMenu
							size="xs"
							row={onboardingId}
							actions={actions}
							ariaLabel="Vendor onboarding actions"
							triggerLabel="Actions"
							triggerVariant="brand"
						/>
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
								creator={creator}
							/>
						}
					/>
				</Card>
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
