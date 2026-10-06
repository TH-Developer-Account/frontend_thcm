// activity-planner/components/activityFormView/CrfSection.tsx
// EPC-side adapter for the CRF module: shows the CRF of an EPC and refreshes
// the EPC after the CRF is saved. Moved from forms/CRF/CrfSection.tsx.

import { useQueryClient } from "@tanstack/react-query";

import { epcKeys } from "../activity-planner/queries/epc.queries";
import type { EpcDetailResponse } from "../activity-planner/types/epc.types";
import { mapCrfLineItemsToTableRows } from "./crf.mapper";
import CrfForm from "./CrfForm";
import LineTableView from "../activity-planner/components/activityFormView/LineTableView";

type CrfSectionProps = {
	epcData: EpcDetailResponse;
	isEditing: boolean;
	onCancel: () => void;
	onSuccess: () => Promise<void>;
};

const CrfSection = ({
	epcData,
	isEditing,
	onCancel,
	onSuccess,
}: CrfSectionProps) => {
	const queryClient = useQueryClient();
	const crf = epcData.crf;

	const handleSaved = async () => {
		// Previously done inside the CRF mutations.
		void queryClient.invalidateQueries({
			queryKey: epcKeys.detail(epcData.id),
		});
		await onSuccess();
	};

	if (isEditing) {
		return (
			<CrfForm
				epcId={epcData.id}
				initialData={crf}
				onCancel={onCancel}
				onSuccess={handleSaved}
			/>
		);
	}

	if (!crf?.lineItems?.length) {
		return (
			<p className="epf-empty-message">
				No CRF has been created for this EPC yet.
			</p>
		);
	}

	return (
		<LineTableView
			data={mapCrfLineItemsToTableRows(crf.lineItems)}
			showGrandTotal
			grandTotalLabel="CRF Grand Total:"
		/>
	);
};

export default CrfSection;
