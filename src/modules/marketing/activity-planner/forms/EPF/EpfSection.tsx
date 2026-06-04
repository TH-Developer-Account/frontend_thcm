import { Pencil, Plus } from "lucide-react";

import Button from "../../../../../components/common/Button";
import Section from "../../components/common/Section";
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
	isClarifiedUpdate?: boolean;
};

const EpfSection = ({
	epcData,
	isEditing,
	onEdit,
	onCancel,
	onSuccess,
	isClarifiedUpdate,
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
				// budgetMasterId={epcData.budget_master_id}
				onCancel={onCancel}
				onSuccess={onSuccess}
				isClarifiedUpdate={isClarifiedUpdate}
			/>
		);
	}

	if (!epf) {
		return (
			<Section
				title="Activity Proposition Form"
				action={
					<Button
						type="button"
						text="Create EPF"
						Icon={Plus}
						iconColor="red"
						onClick={onEdit}
						size="sm"
						className="epf-section-label text-xs"
					/>
				}
			>
				<div className="text-xs text-gray-500">
					No EPF has been created for this EPC yet.
				</div>
			</Section>
		);
	}

	const totalParticipants =
		(Number(epf.internalParticipants) || 0) +
		(Number(epf.externalParticipants) || 0);

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
		<>
			<Section
				title="Activity Proposition Form Budget Information"
				action={
					<Button
						type="button"
						Icon={Pencil}
						iconColor="red"
						onClick={onEdit}
						size="sm"
					/>
				}
			>
				{epf.lineItems?.length > 0 ? (
					<LineTableView
						data={mapEpfLineItemsToTableRows(epf.lineItems)}
						showGrandTotal
						grandTotalLabel="Event Cost Overheads Grand Total:"
					/>
				) : (
					<div className="text-xs text-gray-500">
						No event cost overheads added.
					</div>
				)}
				{epf.internalParticipants || epf.externalParticipants ? (
					<div className="my-2 grid grid-cols-4 gap-6 px-4 py-1.5 text-sm">
						<p className="uppercase-label-text">
							Internal:{" "}
							<span className="text-xs leading-relaxed text-gray-700">
								{epf.internalParticipants || 0}
							</span>
						</p>

						<p className="uppercase-label-text">
							External:{" "}
							<span className="text-xs leading-relaxed text-gray-700">
								{epf.externalParticipants || 0}
							</span>
						</p>

						<p className="uppercase-label-text">
							Total:{" "}
							<span className="text-xs leading-relaxed text-gray-700">
								{totalParticipants}
							</span>
						</p>
					</div>
				) : null}

				<BudgetShare items={budgetItems} shareInfo={shareInfo} />
			</Section>
		</>
	);
};

export default EpfSection;
