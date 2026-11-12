// tabs/FinancialImpactTab.tsx — per-part impact, totals and plant split.
// Actual = (a + b) × Δ per unit · Annualised = c × Δ per unit (CPP format F02).
import { Controller, useFormContext, useWatch } from "react-hook-form";

import Card from "../../../components/common/Card";
import Checkbox from "../../../components/forms/Checkbox";
import { RhfInput, useFieldError } from "../components/CppFields";
import type { CppFormValues } from "../types/cpp.types";
import {
	CPP_PLANTS,
	calcPartImpact,
	calcTotals,
	formatINR,
	formatPct,
	toNum,
} from "../utils/cpp.utils";

const Tile = ({
	title,
	value,
	hint,
}: {
	title: string;
	value: string;
	hint: string;
}) => (
	<div className="rounded-md border border-slate-200 bg-white p-4">
		<div className="text-xs text-slate-600">{title}</div>
		<div className="mt-1 text-xl font-semibold">{value}</div>
		<div className="text-xs text-slate-500">{hint}</div>
	</div>
);

const FinancialImpactTab = () => {
	const { control } = useFormContext<CppFormValues>();
	const parts = useWatch({ control, name: "parts" });
	const noChange = useWatch({ control, name: "financial.noChange" });
	const split = useWatch({ control, name: "financial.plantSplit" });
	const plants = useWatch({ control, name: "workflow.plants" });
	const splitError = useFieldError("financial.plantSplit");

	const totals = calcTotals(parts ?? [], noChange);
	const splitPlants = plants?.length ? plants : CPP_PLANTS;

	return (
		<div className="flex flex-col gap-4">
			<div className="grid gap-3 sm:grid-cols-3">
				<Tile
					title="Total existing value"
					value={formatINR(totals.existingValue)}
					hint="Existing rate × (a + b)"
				/>
				<Tile
					title="Actual impact"
					value={formatINR(totals.actual)}
					hint="Σ (a + b) × Δ per unit"
				/>
				<Tile
					title="Annualised impact"
					value={formatINR(totals.annual)}
					hint="Σ c × Δ per unit"
				/>
			</div>

			<Card title="Financial impact by part" size="small">
				<div className="mb-4">
					<Controller
						name="financial.noChange"
						control={control}
						render={({ field }) => (
							<Checkbox
								label="No changes in financial impact (price-neutral request)"
								checked={field.value}
								onChange={field.onChange}
							/>
						)}
					/>
				</div>

				<div className="overflow-x-auto rounded-md border border-slate-200 scrollbar-sleek">
					<table className="w-full min-w-[1100px] text-sm">
						<thead className="bg-slate-50 text-xs font-semibold text-slate-700">
							<tr>
								<th className="px-3 py-2 text-left">Part No</th>
								<th className="px-3 py-2 text-right">Existing (₹)</th>
								<th className="px-3 py-2 text-right">Final (₹)</th>
								<th className="px-3 py-2 text-right">Δ / unit (₹)</th>
								<th className="px-3 py-2 text-right">% impact</th>
								<th className="px-3 py-2 text-right">Received qty (a)</th>
								<th className="px-3 py-2 text-right">Remaining qty (b)</th>
								<th className="px-3 py-2 text-right">Annual qty (c)</th>
								<th className="px-3 py-2 text-right">Actual impact (₹)</th>
								<th className="px-3 py-2 text-right">Annualised impact (₹)</th>
							</tr>
						</thead>
						<tbody>
							{(parts ?? []).map((row, index) => {
								const impact = calcPartImpact(row, noChange);
								return (
									<tr key={index} className="border-t border-slate-200">
										<td className="px-3 py-2">{row.partNo || "—"}</td>
										<td className="px-3 py-2 text-right">
											{formatINR(toNum(row.existingRate))}
										</td>
										<td className="px-3 py-2 text-right">
											{formatINR(toNum(row.finalRate))}
										</td>
										<td className="px-3 py-2 text-right">
											{formatINR(impact.delta)}
										</td>
										<td className="px-3 py-2 text-right font-semibold">
											{formatPct(impact.pct)}
										</td>
										{(
											["qtyReceived", "qtyRemaining", "qtyAnnual"] as const
										).map((key) => (
											<td key={key} className="px-1.5 py-1.5">
												<RhfInput
													cell
													name={`parts.${index}.${key}`}
													aria-label={`${key} row ${index + 1}`}
													inputMode="numeric"
													disabled={noChange}
													className="w-[100px] text-right"
												/>
											</td>
										))}
										<td className="px-3 py-2 text-right">
											{formatINR(impact.actual)}
										</td>
										<td className="px-3 py-2 text-right">
											{formatINR(impact.annual)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</Card>

			<Card
				title="Plant-wise split"
				subtitle="Optional — percentages must add up to 100"
				size="small"
			>
				<div className="grid gap-4 sm:grid-cols-3">
					{splitPlants.map((plant) => {
						const pct = toNum(split?.[plant]) ?? 0;
						return (
							<div key={plant} className="flex flex-col gap-1">
								<RhfInput
									name={`financial.plantSplit.${plant}`}
									label={`${plant} share (%)`}
									inputMode="decimal"
									disabled={noChange}
								/>
								<span className="text-xs text-slate-500">
									Annualised: {formatINR((totals.annual * pct) / 100)}
								</span>
							</div>
						);
					})}
				</div>
				{splitError ? (
					<p className="form-error-text mt-2" role="alert">
						{splitError}
					</p>
				) : null}
			</Card>
		</div>
	);
};

export default FinancialImpactTab;
