import Card from "../../../../../components/common/Card";

import BudgetShare from "../../components/activityFormView/BudgetShare";
import LineTableView from "../../components/activityFormView/LineTableView";
import type { EpcDetailResponse } from "../../types/epc.types";
import { mapBudgetShareInfo } from "../../utils/formatters";
import EpfForm from "./EpfForm";
import { mapEpfLineItemsToTableRows } from "./epf.mapper";

type EpfSectionProps = {
	epcData: EpcDetailResponse;
	isEditing: boolean;
	onCancel: () => void;
	onSuccess: () => Promise<void>;
};

const EpfSection = ({
	epcData,
	isEditing,
	onCancel,
	onSuccess,
}: EpfSectionProps) => {
	const epf = epcData.epf;
	const crf = epcData.crf;

	if (isEditing) {
		return (
			<EpfForm
				mode={epf ? "edit" : "create"}
				epcId={epcData.id}
				crfId={crf?.id}
				epfId={epf?.id}
				initialData={epf}
				crfData={crf}
				onCancel={onCancel}
				onSuccess={onSuccess}
			/>
		);
	}

	if (!epf) {
		return (
			<p className="epf-empty-message">
				No EPF has been created for this EPC yet.
			</p>
		);
	}

	const internalParticipants = Number(epf.internalParticipants) || 0;
	const externalParticipants = Number(epf.externalParticipants) || 0;
	const { items: budgetItems, shareInfo } = mapBudgetShareInfo({
		eventBudget: epf.eventBudget,
		annualBudget: epf.annualBudget,
		availableBudget: epf.availableBudget,
		allotedBudget: epf.allotedBudget,
		dealerName: epf.dealerName,
		tataHitachiPoAmount: epf.tataHitachiPoAmount,
		dealerPercent: epf.dealerPercent,
	});

	return (
		<div className="epf-summary-section">
			{epf.lineItems?.length ? (
				<LineTableView
					data={mapEpfLineItemsToTableRows(epf.lineItems)}
					showGrandTotal
					grandTotalLabel="Event Cost Overheads Grand Total:"
				/>
			) : (
				<Card variant="subtle" padding="compact">
					<p className="epf-empty-message">No event cost overheads added.</p>
				</Card>
			)}

			<BudgetShare
				items={budgetItems}
				shareInfo={shareInfo}
				internalParticipants={internalParticipants}
				externalParticipants={externalParticipants}
			/>
		</div>
	);
};

export default EpfSection;
