import { Pencil, Plus } from "lucide-react";

import Button from "../../../../../components/common/Button";
import Card from "../../../../../components/common/Card";
import SectionAccordion from "../../../../../components/common/SectionAccordion";

import LineTableView from "../../components/activityFormView/LineTableView";
import BudgetShare from "../../components/activityFormView/BudgetShare";
import EpfForm from "./EpfForm";

import type { EpcDetailResponse } from "../../types/epc.types";
import { mapEpfLineItemsToTableRows } from "./epf.mapper";
import { mapBudgetShareInfo } from "../../utils/formatters";

type EpfSectionProps = {
	epcData: EpcDetailResponse;
	isEditing: boolean;
	onEdit: () => void;
	onCancel: () => void;
	onSuccess: () => Promise<void>;
	canEdit?: boolean;
	canCreate?: boolean;
};

const EpfSection = ({
	epcData,
	isEditing,
	onEdit,
	onCancel,
	onSuccess,
	canEdit,
	canCreate,
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
			<SectionAccordion
				title="Activity Proposition Form"
				action={
					canCreate ? (
						<Button
							type="button"
							text="Create EPF"
							Icon={Plus}
							onClick={onEdit}
							size="sm"
							appearance="standard"
							variant="outline"
						/>
					) : null
				}
				emptyMessage="No EPF has been created for this EPC yet."
			/>
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
		<SectionAccordion
			title="Activity Proposition Form Budget Information"
			action={
				canEdit ? (
					<Button
						type="button"
						Icon={Pencil}
						text="Edit EPF"
						onClick={onEdit}
						size="sm"
						appearance="standard"
						variant="outline"
					/>
				) : null
			}
		>
			<div className="epf-summary-section">
				{epf.lineItems?.length > 0 ? (
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
		</SectionAccordion>
	);
};

export default EpfSection;
