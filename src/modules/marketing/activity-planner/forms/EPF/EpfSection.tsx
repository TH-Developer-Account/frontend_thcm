import type { ReactNode } from "react";
import { Banknote, HandCoins, Receipt, Users, Wallet } from "lucide-react";

import Card, { type CardSection } from "../../../../../components/common/Card";
import ReadOnlyField from "../../../../../components/forms/ReadOnlyField";

import BudgetShare from "../../components/activityFormView/BudgetShare";
import LineTableView from "../../components/activityFormView/LineTableView";
import type { EpcDetailResponse } from "../../types/epc.types";
import { formatCurrency, mapBudgetShareInfo } from "../../utils/formatters";
import EpfForm from "./EpfForm";
import { mapEpfLineItemsToTableRows } from "./epf.mapper";

type EpfSectionProps = {
	epcData: EpcDetailResponse;
	isEditing: boolean;
	onCancel: () => void;
	onSuccess: () => Promise<void>;
	/** Title of the ONE card this section renders (view and edit). */
	title?: ReactNode;
	/** Header actions of the card (e.g. the Edit button) — view mode only. */
	actions?: ReactNode;
};

const num = (value: unknown) => Number(value) || 0;
const money = (value: unknown) => formatCurrency(num(value)) || "--";

const EpfSection = ({
	epcData,
	isEditing,
	onCancel,
	onSuccess,
	title,
	actions,
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
				title={title}
			/>
		);
	}

	if (!epf) {
		return (
			<Card title={title} actions={actions}>
				<p className="epf-empty-message">
					No EPF has been created for this EPC yet.
				</p>
			</Card>
		);
	}

	const { shareInfo } = mapBudgetShareInfo({
		eventBudget: epf.eventBudget,
		annualBudget: epf.annualBudget,
		availableBudget: epf.availableBudget,
		allotedBudget: epf.allotedBudget,
		dealerName: epf.dealerName,
		tataHitachiPoAmount: epf.tataHitachiPoAmount,
		dealerPercent: epf.dealerPercent,
	});

	const lineItemCount = epf.lineItems?.length ?? 0;

	const externalParticipants = num(epf.externalParticipants);
	const internalParticipants = num(epf.internalParticipants);

	// Same five sections, in the same order, as the EPF form — so the view and
	// the form line up.
	const sections: CardSection[] = [
		{
			id: "summary",
			title: "Budget Summary",
			Icon: Wallet,
			className: "epf-section--full",
			children: (
				<BudgetShare
					eventCost={shareInfo.eventBudget ?? 0}
					dealerName={shareInfo.dealerName}
					dealerPercent={shareInfo.dealerPercent}
					dealerShare={shareInfo.dealerShare}
					tataHitachiPercent={shareInfo.tataHitachiPercent}
					tataHitachiShare={shareInfo.tataHitachiShare}
					availableBudget={num(epf.availableBudget)}
				/>
			),
		},
		{
			id: "overheads",
			title: "Event Cost Overheads",
			Icon: Receipt,
			className: "epf-section--full",
			actions: (
				<span className="line-item-editor-count">
					{lineItemCount} {lineItemCount === 1 ? "item" : "items"}
				</span>
			),
			children: lineItemCount ? (
				<LineTableView
					data={mapEpfLineItemsToTableRows(epf.lineItems)}
					showGrandTotal
					grandTotalLabel="Event Cost Overheads Grand Total:"
				/>
			) : (
				<p className="epf-empty-message">No event cost overheads added.</p>
			),
		},
		{
			id: "participants",
			title: "Participants",
			Icon: Users,
			children: (
				<div className="epf-card-fields">
					<ReadOnlyField label="External" value={externalParticipants} />
					<ReadOnlyField label="Internal" value={internalParticipants} />
					<ReadOnlyField
						label="Total"
						value={externalParticipants + internalParticipants}
					/>
				</div>
			),
		},
		{
			id: "dealer",
			title: "Dealer Info",
			Icon: HandCoins,
			children: (
				<>
					<div className="epf-card-fields epf-card-fields--2">
						<div className="epf-card-field-wide">
							<ReadOnlyField label="Dealer name" value={epf.dealerName} />
						</div>
						<ReadOnlyField
							label="Dealer"
							value={`${shareInfo.dealerPercent}%`}
						/>
						<ReadOnlyField
							label="Tata Hitachi"
							value={`${shareInfo.tataHitachiPercent}%`}
						/>
						<ReadOnlyField
							label="Dealer share"
							value={money(shareInfo.dealerShare)}
						/>
						<ReadOnlyField
							label="Tata Hitachi share"
							value={money(shareInfo.tataHitachiShare)}
						/>
					</div>

					<progress
						className="epf-share-progress"
						value={shareInfo.dealerPercent}
						max={100}
						aria-label={`Dealer share ${shareInfo.dealerPercent}%`}
					>
						{shareInfo.dealerPercent}%
					</progress>
				</>
			),
		},
		{
			id: "budget",
			title: "Budget",
			Icon: Banknote,
			children: (
				<div className="epf-card-fields epf-card-fields--2">
					<ReadOnlyField
						label="CRF total"
						value={money((epf as { crfTotal?: number | string }).crfTotal)}
					/>
					<ReadOnlyField label="Event budget" value={money(epf.eventBudget)} />
					<ReadOnlyField
						label="Annual budget"
						value={money(epf.annualBudget)}
					/>
					<ReadOnlyField label="Available" value={money(epf.availableBudget)} />
					<ReadOnlyField label="Allotted" value={money(epf.allotedBudget)} />
					<ReadOnlyField
						label="Tata Hitachi PO amount"
						value={money(epf.tataHitachiPoAmount)}
					/>
				</div>
			),
		},
	];

	// The ONLY card on the tab: title + Edit button in its header, the five
	// collapsible sections inside it.
	return (
		<Card
			className="epf-sections-card"
			title={title}
			actions={actions}
			sections={sections}
		/>
	);
};

export default EpfSection;
