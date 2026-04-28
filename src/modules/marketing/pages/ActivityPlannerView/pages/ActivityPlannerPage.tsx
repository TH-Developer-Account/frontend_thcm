import React from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ApprovalStatus from "../components/ApprovalStatus";
import ActivityFormView from "../components/ActivityFormView";
import { EPCProvider } from "../../../context/EPCprovider";
import { ServerAxios } from "../../../../../services/ServerAxios";
import { PageHeader } from "../../../../../components/ui/PageHeader";
import PageStickyLayout from "../../../../../layout/PageStickyLayout";
import type { EpcDetailResponse } from "../types/ActivityView.types";
import { statusMap } from "../../../../../utils/types";
import { Badge } from "../../../../../components/common/Badge";

const ActivityPlannerPage = () => {
	const { id } = useParams();
	const [epcData, setEPCData] = React.useState<EpcDetailResponse>();

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
	// ✅ correct title
	const title = epcData?.event_name?.title || "--";

	// ✅ proposal number
	const proposalNo = epcData?.proposal_number || "--";

	// ✅ workflow reference
	const workflow = epcData?.activeWorkflow;

	// get current stage
	// const currentStage = epcData?.stages?.find(
	// 	(s) => s.stageOrder === epcData?.currentStage,
	// );

	// get approvers
	// const approvers =
	// 	currentStage?.approvals
	// 		?.map((a) =>
	// 			`${a.approver?.first_name || ""} ${a.approver?.last_name || ""}`.trim(),
	// 		)
	// 		.filter(Boolean)
	// 		.join(", ") || "--";

	// optional: status map (recommended)
	const badgeStatus = epcData?.status ? statusMap[epcData.status] : undefined;
	// };
	return (
		<>
			<EPCProvider>
				<PageStickyLayout
					header={
						<div className="flex flex-row gap-4 justify-between">
							<PageHeader
								headerText="Activity Planner View"
								subtitleText="View your activity details"
								Icon={ArrowLeft}
								badgeText="EPC Listing"
								path="/marketing/listing"
							/>
							<div className="flex justify-between items-center page-header-section text-right">
								<div>
									<h2 className="approval-details-title">{title}</h2>
									<p className="page-subtitle">{proposalNo}</p>
									<span className="page-subtitle">
										Status: <Badge status={badgeStatus} />
									</span>
								</div>
							</div>
						</div>
					}
					sidebar={<ApprovalStatus epcData={epcData} />}
					contentClassName="pb-6"
				>
					<ActivityFormView epcId={id} epcData={epcData} />
				</PageStickyLayout>
			</EPCProvider>
		</>
	);
};

export default ActivityPlannerPage;
