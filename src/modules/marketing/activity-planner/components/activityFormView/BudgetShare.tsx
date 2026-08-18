import type { ComponentType, ReactNode } from "react";
import {
	BadgeIndianRupee,
	Coins,
	GlobeIcon,
	Landmark,
	StoreIcon,
	UsersIcon,
	UsersRound,
	WalletCards,
} from "lucide-react";

import Card from "../../../../../components/common/Card";

import { formatCurrency } from "../../utils/formatters";
import type { BudgetItem, ShareInfo } from "../../types/epf.types";

type BudgetShareProps = {
	items: BudgetItem[];
	shareInfo: ShareInfo;
	internalParticipants?: number;
	externalParticipants?: number;
};

type IconComponent = ComponentType<{
	size?: number;
	strokeWidth?: number;
	className?: string;
	"aria-hidden"?: boolean;
}>;

type SummaryTone = "info" | "success" | "warning" | "brand" | "neutral";

type SummaryItem = {
	label: string;
	value: ReactNode;
	Icon: IconComponent;
	tone?: SummaryTone;
};

const BUDGET_PRESENTATION: Array<{
	Icon: IconComponent;
	tone: SummaryTone;
}> = [
	{
		Icon: Landmark,
		tone: "success",
	},
	{
		Icon: WalletCards,
		tone: "warning",
	},
	{
		Icon: Coins,
		tone: "neutral",
	},
	{
		Icon: BadgeIndianRupee,
		tone: "neutral",
	},
	{
		Icon: WalletCards,
		tone: "brand",
	},
];

const SummaryCardContent = ({
	label,
	value,
	Icon,
	tone = "info",
}: SummaryItem) => {
	return (
		<div className="epf-summary-card-content">
			<span
				className={`epf-summary-card-icon epf-summary-card-icon-${tone}`}
				aria-hidden="true"
			>
				<Icon size={18} strokeWidth={1.75} />
			</span>

			<div className="epf-summary-card-copy">
				<p className="epf-summary-card-label">{label}</p>

				<div className="epf-summary-card-value">{value}</div>
			</div>
		</div>
	);
};

const BudgetShare = ({
	items,
	shareInfo,
	internalParticipants = 0,
	externalParticipants = 0,
}: BudgetShareProps) => {
	const {
		dealerName,
		dealerPercent,
		dealerShare,
		tataHitachiPercent,
		tataHitachiShare,
		eventBudget,
	} = shareInfo;

	const totalParticipants = internalParticipants + externalParticipants;

	const participantItems: SummaryItem[] = [
		{
			label: "Internal",
			value: internalParticipants,
			Icon: UsersIcon,
			tone: "success",
		},
		{
			label: "External",
			value: externalParticipants,
			Icon: GlobeIcon,
			tone: "success",
		},
		{
			label: "Total",
			value: totalParticipants,
			Icon: UsersRound,
			tone: "brand",
		},
	];

	const budgetSummaryItems: SummaryItem[] = items.map((item, index) => {
		const presentation =
			BUDGET_PRESENTATION[index] ??
			BUDGET_PRESENTATION[BUDGET_PRESENTATION.length - 1];

		return {
			label: item.label,
			value:
				typeof item.value === "number"
					? formatCurrency(item.value)
					: item.value || "--",
			Icon: presentation.Icon,
			tone: presentation.tone,
		};
	});

	const hasParticipants = internalParticipants > 0 || externalParticipants > 0;

	return (
		<div className="epf-budget-summary">
			{hasParticipants ? (
				<div
					className="epf-participant-card-grid"
					aria-label="Participant summary"
				>
					{participantItems.map((item) => (
						<Card key={item.label} variant="subtle" padding="compact">
							<SummaryCardContent {...item} />
						</Card>
					))}
				</div>
			) : null}

			<div className="epf-budget-card-grid">
				{budgetSummaryItems.map((item) => (
					<Card key={item.label} variant="subtle" padding="compact">
						<SummaryCardContent {...item} />
					</Card>
				))}
			</div>

			<div className="epf-dealer-card-grid">
				<Card variant="default" padding="compact">
					<SummaryCardContent
						label="Dealer Name"
						value={dealerName || "--"}
						Icon={StoreIcon}
						tone="info"
					/>
				</Card>

				<Card variant="subtle" padding="compact">
					<SummaryCardContent
						label="Total Event Cost"
						value={
							<span className="epf-event-cost-value">
								{formatCurrency(eventBudget) || "--"}
							</span>
						}
						Icon={BadgeIndianRupee}
						tone="brand"
					/>
				</Card>
			</div>

			<div className="epf-share-panel">
				<div className="epf-share-heading">
					<div>
						<span className="uppercase-label-text">Dealer Share</span>

						<p className="epf-share-value">
							{dealerPercent}% — {formatCurrency(dealerShare)}
						</p>
					</div>

					<div className="epf-share-heading-end">
						<span className="uppercase-label-text">Tata Hitachi Share</span>

						<p className="epf-share-value">
							{tataHitachiPercent}% — {formatCurrency(tataHitachiShare)}
						</p>
					</div>
				</div>

				<progress
					className="epf-share-progress"
					value={dealerPercent}
					max={100}
					aria-label={`Dealer share ${dealerPercent}%`}
				>
					{dealerPercent}%
				</progress>

				<div className="epf-share-footer">
					<span>Dealer {dealerPercent}%</span>

					<span>Tata Hitachi {tataHitachiPercent}%</span>
				</div>
			</div>
		</div>
	);
};

export default BudgetShare;
