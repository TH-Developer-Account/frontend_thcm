import LineTableView from "../../components/activityFormView/LineTableView";
import type { EpcDetailResponse } from "../../types/epc.types";
import CrfForm from "./CrfForm";
import { mapCrfLineItemsToTableRows } from "./crf.mapper";

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
	const crf = epcData.crf;
	const hasLineItems = Boolean(crf?.lineItems?.length);

	if (isEditing) {
		return (
			<CrfForm
				mode={crf ? "edit" : "create"}
				epcId={epcData.id}
				crfId={crf?.id}
				initialData={crf}
				onCancel={onCancel}
				onSuccess={onSuccess}
			/>
		);
	}

	if (!hasLineItems) {
		return (
			<p className="epf-empty-message">
				No CRF has been created for this EPC yet.
			</p>
		);
	}

	return (
		<LineTableView
			data={mapCrfLineItemsToTableRows(crf?.lineItems)}
			showGrandTotal
			grandTotalLabel="CRF Grand Total:"
		/>
	);
};

export default CrfSection;
