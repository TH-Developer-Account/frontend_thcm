import { Pencil, Plus } from "lucide-react";
import Button from "../../../../components/common/Button";
import Section from "./Section";
import LineTableView from "./LineTableView";
import BudgetShare from "./BudgetShare";
import EpfForm from "../forms/EPF/EpfForm";
import type { EpcDetailResponse } from "../types/epc.types";
import { mapEpfLineItemsToFormItems } from "../forms/EPF/epf.mapper";
import { mapBudgetShareInfo } from "../utils/formatters";

type EpfSectionProps = {
	epcData: EpcDetailResponse;
	isEditing: boolean;
	onEdit: () => void;
	onCancel: () => void;
	onSuccess: () => Promise<void>;
};

const EpfSection = ({
	epcData,
	isEditing,
	onEdit,
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
				title="Event Cost Overheads"
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
					<LineTableView data={mapEpfLineItemsToFormItems(epf.lineItems)} />
				) : (
					<div className="text-xs text-gray-500">
						No event cost overheads added.
					</div>
				)}
			</Section>

			<Section title="Activity Proposition Form Budget Information">
				{epf.internalParticipants || epf.externalParticipants ? (
					<div className="grid grid-cols-4 gap-6 my-2 text-sm px-4 py-1.5">
						<p className="uppercase-label-text">
							Internal:{" "}
							<span className="text-gray-700 leading-relaxed text-xs">
								{epf.internalParticipants || 0}
							</span>
						</p>

						<p className="uppercase-label-text">
							External:{" "}
							<span className="text-gray-700 leading-relaxed text-xs">
								{epf.externalParticipants || 0}
							</span>
						</p>

						<p className="uppercase-label-text">
							Total:{" "}
							<span className="text-gray-700 leading-relaxed text-xs">
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
