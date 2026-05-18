import { useNavigate, useParams } from "react-router-dom";

import EpfForm from "../forms/EPF/EpfForm";
import { useEpcDetailQuery } from "../queries/useEpcListQuery";

export default function EpfFormPage() {
	const navigate = useNavigate();
	const { epcId } = useParams<{ epcId: string }>();

	const {
		data: epcData,
		isLoading,
		isFetching,
		refetch,
	} = useEpcDetailQuery(epcId);

	if (isLoading || isFetching) {
		return (
			<div className="flex h-64 items-center justify-center text-sm text-[var(--color-text-muted)]">
				Loading EPF details...
			</div>
		);
	}

	if (!epcId || !epcData) {
		return (
			<div className="flex h-64 items-center justify-center text-sm text-red-600">
				EPC details not found.
			</div>
		);
	}

	return (
		<EpfForm
			mode={epcData?.epf ? "edit" : "create"}
			epcId={epcData.id}
			crfId={epcData?.crf?.id}
			epfId={epcData?.epf?.id}
			initialData={epcData?.epf}
			crfData={epcData?.crf}
			budgetMasterId={epcData?.budget_master_id}
			onCancel={() => navigate(`/marketing/activity-planner/${epcId}`)}
			onSuccess={async () => {
				await refetch();
				navigate(`/marketing/activity-planner/${epcId}`);
			}}
		/>
	);
}
