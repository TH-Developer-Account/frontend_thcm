import type { ComponentType, ReactNode } from "react";
import { BadgeIndianRupee, Building2, Store, Wallet } from "lucide-react";

import { formatCurrency } from "../../utils/formatters";

// Headline numbers for the EPF form and the EPF view: one row of four stat
// tiles (total event cost, dealer share, Tata Hitachi share, budget
// remaining). The form passes live values, the view passes the saved ones.

type BudgetShareProps = {
	eventCost: number;
	dealerName?: string | null;
	dealerPercent: number;
	dealerShare: number;
	tataHitachiPercent: number;
	tataHitachiShare: number;
	/** Budget still available before this EPF is counted. */
	availableBudget: number;
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

const StatTile = ({ label, value, Icon, tone = "info" }: SummaryItem) => (
	<div className="epf-stat">
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
	eventCost,
	dealerName,
	dealerPercent,
	dealerShare,
	tataHitachiPercent,
	tataHitachiShare,
	availableBudget,
}: BudgetShareProps) => {
	const remaining = availableBudget - eventCost;
	const isOverBudget = remaining < 0;

	const stats: SummaryItem[] = [
		{
			label: "Total event cost",
			value: (
				<span className="epf-event-cost-value">
					{formatCurrency(eventCost) || "--"}
				</span>
			),
			Icon: BadgeIndianRupee,
			tone: "brand",
		},
		{
			label: `Dealer share · ${dealerPercent}%`,
			value: formatCurrency(dealerShare) || "--",
			Icon: Store,
			tone: "info",
		},
		{
			label: `Tata Hitachi share · ${tataHitachiPercent}%`,
			value: formatCurrency(tataHitachiShare) || "--",
			Icon: Building2,
			tone: "neutral",
		},
		{
			label: isOverBudget ? "Over budget by" : "Budget remaining",
			value: formatCurrency(Math.abs(remaining)) || "--",
			Icon: Wallet,
			tone: isOverBudget ? "warning" : "success",
		},
	];

	return (
		<div
			className="epf-stat-strip"
			role="group"
			aria-label={`Cost summary${dealerName && dealerName !== "-" ? ` for ${dealerName}` : ""}`}
		>
			{stats.map((item) => (
				<StatTile key={item.label} {...item} />
			))}
		</div>
	);
};

export default BudgetShare;
