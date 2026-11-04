import type { ComponentType, ReactNode } from "react";
import {
	BadgeIndianRupee,
	Building2,
	RefreshCcw,
	Store,
	Wallet,
} from "lucide-react";

import Button from "../../../../../components/common/Button";
import { formatCurrency } from "../../utils/formatters";

// Headline numbers for the EPF form and the EPF view: one row of four stat
// tiles (total event cost, dealer share, Tata Hitachi share, budget
// remaining). The form passes live values, the view passes the saved ones.
//
// `loading` / `error` / `onRetry` are optional: the EPF form fetches the
// budget separately, so only this summary shows its own loading / error state
// while the rest of the form stays usable.

type BudgetShareProps = {
	eventCost: number;
	dealerName?: string | null;
	dealerPercent: number;
	dealerShare: number;
	tataHitachiPercent: number;
	tataHitachiShare: number;
	/** Budget still available before this EPF is counted. */
	availableBudget: number;
	/** Budget info is still being fetched. */
	loading?: boolean;
	/** Budget info failed to load. */
	error?: boolean;
	onRetry?: () => void;
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
	loading = false,
	error = false,
	onRetry,
}: BudgetShareProps) => {
	if (loading) {
		return (
			<p className="text-sm text-[var(--color-text-muted)]" role="status">
				Loading budget summary…
			</p>
		);
	}

	if (error) {
		return (
			<div
				className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]"
				role="alert"
			>
				<span>Couldn't load the budget summary.</span>
				{onRetry ? (
					<Button
						type="button"
						text="Retry"
						Icon={RefreshCcw}
						size="sm"
						appearance="standard"
						variant="outline"
						onClick={onRetry}
					/>
				) : null}
			</div>
		);
	}

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
