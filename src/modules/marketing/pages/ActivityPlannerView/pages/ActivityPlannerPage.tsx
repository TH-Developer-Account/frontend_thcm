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
import { useEPC } from "../../../context/useEPC";

const ActivityPlannerPageContent = () => {
	const { id } = useParams();
	const { data } = useEPC();

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

	const epcFromList = data?.find((item) => item.id === epcData?.id);

	const title = epcData?.event_name?.title || "--";
	const proposalNo = epcData?.proposal_number || "--";

	const createdBy = epcFromList
		? `${epcFromList.first_name || ""} ${epcFromList.last_name || ""}`.trim()
		: "--";

	const badgeStatus = epcData?.status ? statusMap[epcData.status] : undefined;

	return (
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
							<p>
								<span className="form-view-label uppercase-label-text ">
									Status:{" "}
								</span>
								<Badge status={badgeStatus} />
							</p>
							<h2 className="approval-details-title">{proposalNo}</h2>
							<p className="page-subtitle approval-details-subtitle">
								<span className="form-view-label uppercase-label-text ">
									Created By:{" "}
								</span>
								{createdBy}
							</p>
						</div>
					</div>
				</div>
			}
			sidebar={<ApprovalStatus epcData={epcData} />}
			contentClassName="pb-6"
		>
			<ActivityFormView epcId={id} epcData={epcData} />
		</PageStickyLayout>
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
