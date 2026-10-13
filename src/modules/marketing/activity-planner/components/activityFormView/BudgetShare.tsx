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

import { formatCurrency } from "../../utils/formatters";
import type { BudgetItem, ShareInfo } from "../../types/epf.types";

// Compact budget summary: ONE flat grid of small stat tiles (participants,
// budget figures, dealer, total cost) followed by the share bar. Replaces the
// four stacked grids of Card-wrapped tiles that left most of the page empty.

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
	wide?: boolean;
};

const BUDGET_PRESENTATION: Array<{ Icon: IconComponent; tone: SummaryTone }> = [
	{ Icon: Landmark, tone: "success" },
	{ Icon: WalletCards, tone: "warning" },
	{ Icon: Coins, tone: "neutral" },
	{ Icon: BadgeIndianRupee, tone: "neutral" },
	{ Icon: WalletCards, tone: "brand" },
];

const StatTile = ({ label, value, Icon, tone = "info", wide }: SummaryItem) => (
	<div
		className={["epf-stat", wide && "epf-stat--wide"].filter(Boolean).join(" ")}
	>
		<span
			className={`epf-summary-card-icon epf-summary-card-icon-${tone}`}
			aria-hidden="true"
		>
			<Icon size={16} strokeWidth={1.75} />
		</span>
		<div className="epf-stat-copy">
			<p className="epf-summary-card-label">{label}</p>
			<div className="epf-summary-card-value">{value}</div>
		</div>
	</div>
);

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
	const hasParticipants = internalParticipants > 0 || externalParticipants > 0;

	const participantItems: SummaryItem[] = hasParticipants
		? [
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
					label: "Total participants",
					value: totalParticipants,
					Icon: UsersRound,
					tone: "brand",
				},
			]
		: [];

	const budgetItems: SummaryItem[] = items.map((item, index) => {
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

	const stats: SummaryItem[] = [
		...participantItems,
		{
			label: "Dealer name",
			value: dealerName || "--",
			Icon: StoreIcon,
			tone: "info",
			wide: true,
		},
		...budgetItems,
		{
			label: "Total event cost",
			value: (
				<span className="epf-event-cost-value">
					{formatCurrency(eventBudget) || "--"}
				</span>
			),
			Icon: BadgeIndianRupee,
			tone: "brand",
			wide: true,
		},
	];

	return (
		<div className="epf-budget-summary epf-budget-summary--compact">
			<div className="epf-stat-grid">
				{stats.map((item) => (
					<StatTile key={item.label} {...item} />
				))}
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
			</div>
		</div>
	);
};

export default BudgetShare;
