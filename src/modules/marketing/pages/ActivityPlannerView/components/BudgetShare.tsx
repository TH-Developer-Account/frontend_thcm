import React from "react";
import { formatCurrency } from "../../../../../utils/format";
import type { BudgetItem, ShareInfo } from "./helper";

type BudgetProps = {
	items: BudgetItem[];
	shareInfo: ShareInfo;
};

const BudgetShare = ({ items, shareInfo }: BudgetProps) => {
	const {
		dealerName,
		tataHitachiPoAmount,
		dealerPercent,
		dealerShare,
		tataHitachiPercent,
		tataHitachiShare,
	} = shareInfo;

	return (
		<React.Fragment>
			<div className="grid grid-cols-3 gap-4 p-2">
				{items.map((item) => (
					<div
						key={item.label}
						className="epf-budget-card"
						style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
					>
						<p className="uppercase-label-text">{item.label}</p>
						<p className="epf-field-value">{item.value}</p>
					</div>
				))}
			</div>

			<div className="grid grid-cols-2 gap-5 p-2">
				<div
					className="epf-budget-card"
					style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
				>
					<p className="uppercase-label-text">Dealer Name</p>
					<p className="epf-field-value">{dealerName || "-"}</p>
				</div>

				<div
					className="epf-budget-card"
					style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
				>
					<p className="uppercase-label-text">Tata Hitachi PO Amount</p>
					<p className="epf-field-value">
						{formatCurrency(tataHitachiPoAmount)}
					</p>
				</div>
			</div>

			<div
				className="rounded-lg p-5 m-2"
				style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
			>
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
						style={{
							width: `${dealerPercent}%`,
							background: "linear-gradient(90deg,#3b82f6,#60a5fa)",
						}}
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
