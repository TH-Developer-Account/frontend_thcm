import React from "react";
import { formatCurrency } from "../../utils/formatters";
import type { BudgetItem, ShareInfo } from "../../types/epf.types";
import { StoreIcon } from "lucide-react";

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
		dealerPercent,
		dealerShare,
		tataHitachiPercent,
		tataHitachiShare,
		eventBudget,
	} = shareInfo;

	return (
		<React.Fragment>
			<div className="grid grid-cols-5 gap-2 px-1.5 py-1">
				{items.map((item) => (
					<BudgetCard key={item.label} label={item.label}>
						{typeof item.value === "number"
							? formatCurrency(item.value)
							: item.value || "--"}
					</BudgetCard>
				))}
			</div>

			<div className="grid grid-cols-[1fr_220px] gap-2 px-1.5 py-1">
				<BudgetCard label="Dealer Name">
					<div className="flex items-center gap-2">
						<div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
							<StoreIcon className="h-3.5 w-3.5 text-blue-500" />
						</div>
						{dealerName || "--"}
					</div>
				</BudgetCard>
				<BudgetCard label="Total Event Cost">
					<span className="text-orange-600 text-lg font-semibold">
						{formatCurrency(eventBudget) || "--"}
					</span>
				</BudgetCard>
			</div>

			<div className="rounded-lg px-5 py-3 m-1 bg-slate-50 border border-slate-200">
				<div className="flex justify-between text-sm mb-2">
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
