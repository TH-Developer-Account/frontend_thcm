import React from "react";
import { useParams } from "react-router-dom";
import { Download, Eye } from "lucide-react";
// import ApprovalStatus from "../components/ApprovalStatus";
import ActivityFormView from "../components/ActivityFormView";
import { EPCProvider } from "../../../context/EPCprovider";
import { ServerAxios } from "../../../../../services/ServerAxios";
import { PageHeader } from "../../../../../components/ui/PageHeader";
import type { EpcDetailResponse } from "../types/ActivityView.types";
import { statusMap } from "../../../../../utils/types";
import { Badge } from "../../../../../components/common/Badge";
import { useEPC } from "../../../context/useEPC";
import html2pdf from "html2pdf.js";
import Button from "../../../../../components/common/Button";
import { Modal } from "../../../../../components/common/Modal";
import ActivityPlannerPdfTemplate from "../components/ActivityPlannerPdfTemplate";
import PageRowSectionLayout from "../../../../../layout/PageRowSectionLayout";

const ActivityPlannerPageContent = () => {
	const { id } = useParams();
	const { data } = useEPC();

	const [epcData, setEPCData] = React.useState<EpcDetailResponse>();
	const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

	React.useEffect(() => {
		if (!id) return;

		const load = async () => {
			try {
				const {
					data: { data },
				} = await ServerAxios.get(`/epc/${id}`);

				setEPCData(data);
			} catch (err) {
				console.log({ err });
			}
		};

		load();
	}, [id]);

	const epcFromList = data?.find((item) => item.id === epcData?.id);

	const title = epcData?.event_name?.title || "--";
	const proposalNo = epcData?.proposal_number || "--";

	const createdBy = epcFromList
		? `${epcFromList.first_name || ""} ${epcFromList.last_name || ""}`.trim()
		: "--";

	const badgeStatus = epcData?.status ? statusMap[epcData.status] : undefined;

	const handleDownload = async () => {
		const element = document.getElementById("pdf-content");

		if (!element) return;

		document.body.classList.add("pdf-export-mode");

		try {
			await html2pdf()
				.set({
					margin: 8,
					filename: `${proposalNo || "activity-planner"}.pdf`,
					image: { type: "jpeg", quality: 0.98 },
					html2canvas: {
						scale: 2,
						useCORS: true,
						backgroundColor: "#ffffff",
					},
					jsPDF: {
						unit: "mm",
						format: "a4",
						orientation: "portrait",
					},
					// pagebreak: {
					// 	mode: ["avoid-all", "css", "legacy"],
					// },
				})
				.from(element)
				.save();
		} finally {
			document.body.classList.remove("pdf-export-mode");
		}
	};
	return (
		<>
			<PageRowSectionLayout
				header_children={
					<div className="flex flex-row gap-4 justify-between items-center">
						<PageHeader
							headerText="Activity Planner View"
							subtitleText="View your activity details"
							badgeProps={{
								text: "Back",
								direction: "back",
							}}
						/>
						<div className="flex justify-between flex-col items-center page-header-section">
							<h2 className="page-title-section text-darkBlue">{title}</h2>
							<p className="page-subtitle">
								<span className="form-view-label uppercase-label-text">
									{proposalNo}
								</span>
							</p>
						</div>

						<div className="flex justify-between items-center page-header-section text-right">
							<div>
								<div className="flex gap-2 justify-end">
									<Badge status={badgeStatus} />

									<Button
										Icon={Eye}
										iconPosition="right"
										onClick={() => setIsPreviewOpen(true)}
										status="outline"
										className="p-1 text-xs rounded-full cursor-pointer"
									/>
								</div>

								<h2 className="page-title-section text-darkBlue">
									<span className="font-semibold text-black text-[12px] uppercase-label-text">
										Proposer:{" "}
									</span>
									{createdBy}
								</h2>
							</div>
						</div>
					</div>
				}
				// sidebar={<ApprovalStatus epcData={epcData} />}
			>
				<ActivityFormView epcId={id} epcData={epcData} />
			</PageRowSectionLayout>

			<Modal
				open={isPreviewOpen}
				title="PDF Preview"
				onClose={() => setIsPreviewOpen(false)}
				size="xl"
				className="content-box"
				header_children={
					<Button
						text="Download PDF"
						Icon={Download}
						iconPosition="right"
						onClick={handleDownload}
						status="brand"
						size="sm"
					/>
				}
			>
				<div className="max-h-[90vh] overflow-y-auto scrollbar-sleek">
					<div id="pdf-content" className="text-[#111827] mx-auto">
						<ActivityPlannerPdfTemplate
							epcData={epcData}
							createdBy={createdBy}
						/>
					</div>
				</div>
			</Modal>
		</>
	);
};

const ActivityPlannerPage = () => {
	return (
		<EPCProvider>
			<ActivityPlannerPageContent />
		</EPCProvider>
	);
};

export default ActivityPlannerPage;
