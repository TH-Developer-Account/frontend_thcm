import React from "react";
import { formatCurrency } from "../utils/formatters";
import type { BudgetItem, ShareInfo } from "../types/epf.types";

type BudgetShareProps = {
	items: BudgetItem[];
	shareInfo: ShareInfo;
};

const BudgetCard = ({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) => {
	return (
		<div className="epf-budget-card bg-slate-50 border border-slate-200">
			<p className="uppercase-label-text">{label}</p>
			<div className="epf-field-value">{children}</div>
		</div>
	);
};

const BudgetShare = ({ items, shareInfo }: BudgetShareProps) => {
	const {
		dealerName,
		tataHitachiPoAmount,
		dealerPercent,
		dealerShare,
		tataHitachiPercent,
		tataHitachiShare,
		eventBudget,
	} = shareInfo;

	return (
		<React.Fragment>
			<div className="grid grid-cols-3 gap-2 px-1.5 py-1">
				{items.map((item) => (
					<BudgetCard key={item.label} label={item.label}>
						{typeof item.value === "number"
							? formatCurrency(item.value)
							: item.value || "--"}
					</BudgetCard>
				))}
			</div>

			<div className="grid grid-cols-3 gap-2 px-1.5 py-1">
				<BudgetCard label="Dealer Name">{dealerName || "--"}</BudgetCard>
				<BudgetCard label="Total Event Cost">
					{formatCurrency(eventBudget) || "--"}
				</BudgetCard>
				<BudgetCard label="Tata Hitachi PO Amount">
					{formatCurrency(tataHitachiPoAmount)}
				</BudgetCard>
			</div>

			<div className="rounded-lg p-5 m-1 bg-slate-50 border border-slate-200">
				<div className="flex justify-between text-sm mb-3">
					<div>
						<span className="uppercase-label-text">Dealer Share</span>
						<p className="text-slate-800 font-semibold mt-1">
							{dealerPercent}% — {formatCurrency(dealerShare)}
						</p>
					</div>

					<div className="text-right">
						<span className="uppercase-label-text">Tata Hitachi Share</span>
						<p className="text-slate-800 font-semibold mt-1">
							{tataHitachiPercent}% — {formatCurrency(tataHitachiShare)}
						</p>
					</div>
				</div>

				<div className="epf-share-bar">
					<div
						className="epf-share-bar-fill"
						style={{ width: `${dealerPercent}%` }}
					/>
				</div>

				<div className="flex justify-between text-xs text-slate-400 mt-1">
					<span>Dealer {dealerPercent}%</span>
					<span>Tata Hitachi {tataHitachiPercent}%</span>
				</div>
			</div>
		</React.Fragment>
	);
};

export default BudgetShare;
