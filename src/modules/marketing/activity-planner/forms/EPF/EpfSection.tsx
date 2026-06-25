import { GlobeIcon, Pencil, Plus, UsersIcon } from "lucide-react";

import Button from "../../../../../components/common/Button";
import LineTableView from "../../components/activityFormView/LineTableView";
import BudgetShare from "../../components/activityFormView/BudgetShare";
import EpfForm from "./EpfForm";

import type { EpcDetailResponse } from "../../types/epc.types";
import { mapEpfLineItemsToTableRows } from "./epf.mapper";
import { mapBudgetShareInfo } from "../../utils/formatters";
import SectionAccordion from "../../../../../components/common/SectionAccordion";

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
					canCreate && (
						<Button
							type="button"
							text="Create EPF"
							Icon={Plus}
							onClick={onEdit}
							size="sm"
							appearance="standard"
							variant="outline"
						/>
					)
				}
			>
				<div className="text-xs text-gray-500">
					No EPF has been created for this EPC yet.
				</div>
			</SectionAccordion>
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
		<SectionAccordion
			title="Activity Proposition Form Budget Information"
			action={
				canEdit && (
					<Button
						type="button"
						Icon={Pencil}
						text="Edit EPF"
						onClick={onEdit}
						size="sm"
						appearance="standard"
						variant="outline"
					/>
				)
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
				<div className="flex items-center gap-2 my-3">
					<span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-sm">
						<UsersIcon className="h-3.5 w-3.5 text-slate-400" />
						<span className="text-slate-500">Internal</span>
						<span className="font-medium text-slate-800">
							{epf.internalParticipants || 0}
						</span>
					</span>
					<span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-sm">
						<GlobeIcon className="h-3.5 w-3.5 text-slate-400" />
						<span className="text-slate-500">External</span>
						<span className="font-medium text-slate-800">
							{epf.externalParticipants || 0}
						</span>
					</span>
					<div className="w-px h-4 bg-slate-200" />
					<span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-sm">
						<span className="text-slate-500">Total</span>
						<span className="font-medium text-slate-800">
							{totalParticipants}
						</span>
					</span>
				</div>
			) : null}

			<BudgetShare items={budgetItems} shareInfo={shareInfo} />
		</SectionAccordion>
	);
};

export default EpfSection;
