// tabs/FinancialImpactTab.tsx — wizard step 3: financial impact per plant.
// Typed by hand from the attached Excel (CPP format F02). +ve = price increase,
// -ve = decrease.
//   Actual     = (a + b) × impact per unit
//   Annualised = c × impact per unit (new parts: annualised purchase value)
// The ₹ totals are summed from the plant rows; the % totals are typed.
// The same table is used in edit and view mode: in view mode every cell is
// read-only and the layout follows the Excel (KGP, DWD, SPARE, Total).
// Plain content: the parent card in CppRequestCreatePage provides the surface.
import { useFormContext, useWatch } from "react-hook-form";

import CppSection from "../components/CppSection";
import {
	RhfAmountInput,
	RhfInput,
	useCppReadOnly,
} from "../components/CppFields";
import type { CppFormValues, CppPlant } from "../types/cpp.types";

/** Row order as in the Excel. */
const FINANCIAL_PLANTS: CppPlant[] = ["KGP", "DWD", "SPARE"];

const inr = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 2,
});

/** Typed amounts are strings. Blank or invalid input counts as 0 in the totals. */
const toAmount = (value: string | undefined): number => {
	const n = Number(
		String(value ?? "")
			.replace(/,/g, "")
			.trim(),
	);
	return Number.isFinite(n) ? n : 0;
};

/** View mode: a blank cell reads "—" rather than an empty box. */
const inrText = (value: string | undefined): string =>
	value?.trim() ? inr.format(toAmount(value)) : "—";

const pctText = (value: string | undefined): string =>
	value?.trim() ? `${value.trim()}%` : "—";

const Tile = ({
	title,
	value,
	hint,
}: {
	title: string;
	value: string;
	hint: string;
}) => (
	<div className="rounded-md border border-slate-200 bg-white px-3 py-2">
		<div className="text-xs text-slate-600">{title}</div>
		<div className="mt-1 text-xl font-semibold">{value}</div>
		<div className="text-xs text-slate-500">{hint}</div>
	</div>
);

const FinancialImpactTab = () => {
	const { control } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const financial = useWatch({ control, name: "financial" });
	const plants = financial?.plants;

	const sumOf = (key: "actualInr" | "annualisedInr") =>
		FINANCIAL_PLANTS.reduce(
			(total, plant) => total + toAmount(plants?.[plant]?.[key]),
			0,
		);
	const actual = sumOf("actualInr");
	const annualised = sumOf("annualisedInr");

	return (
		<div className="flex flex-col gap-4">
			<div className="grid gap-3 sm:grid-cols-2">
				<Tile
					title="Actual impact"
					value={inr.format(actual)}
					hint="Σ plant actual (₹)"
				/>
				<Tile
					title="Annualised impact"
					value={inr.format(annualised)}
					hint="Σ plant annualised (₹)"
				/>
			</div>

			<CppSection
				title="Financial impact by plant"
				subtitle="As in the Financial Impact box of the attached Excel."
			>
				<div className="overflow-x-auto rounded-md border border-slate-200 scrollbar-sleek">
					<table className="w-full min-w-[720px] text-sm">
						<thead className="bg-slate-50 text-xs font-semibold text-slate-700">
							<tr className="border-b border-slate-200">
								<th rowSpan={2} className="px-3 py-2 text-left align-bottom">
									Plant
								</th>
								<th colSpan={2} className="px-3 py-2 text-center">
									Actual = [(a + b) × Impact]
								</th>
								<th colSpan={2} className="px-3 py-2 text-center">
									Annual Impact = [c × Impact]
								</th>
							</tr>
							<tr>
								<th className="px-3 py-2 text-right font-normal">in INR</th>
								<th className="px-3 py-2 text-right font-normal">in %</th>
								<th className="px-3 py-2 text-right font-normal">in INR</th>
								<th className="px-3 py-2 text-right font-normal">in %</th>
							</tr>
						</thead>
						<tbody>
							{FINANCIAL_PLANTS.map((plant) => (
								<tr key={plant} className="border-t border-slate-200">
									<td className="px-3 py-2 font-medium">{plant}</td>
									{readOnly ? (
										<>
											<td className="px-3 py-2 text-right">
												{inrText(plants?.[plant]?.actualInr)}
											</td>
											<td className="px-3 py-2 text-right">
												{pctText(plants?.[plant]?.actualPct)}
											</td>
											<td className="px-3 py-2 text-right">
												{inrText(plants?.[plant]?.annualisedInr)}
											</td>
											<td className="px-3 py-2 text-right">
												{pctText(plants?.[plant]?.annualisedPct)}
											</td>
										</>
									) : (
										<>
											<td className="px-1.5 py-1.5">
												<RhfAmountInput
													cell
													name={`financial.plants.${plant}.actualInr`}
													aria-label={`${plant} actual impact in rupees`}
													className="w-[140px] text-right"
												/>
											</td>
											<td className="px-1.5 py-1.5">
												<RhfInput
													cell
													name={`financial.plants.${plant}.actualPct`}
													aria-label={`${plant} actual impact percent`}
													inputMode="decimal"
													className="w-[100px] text-right"
												/>
											</td>
											<td className="px-1.5 py-1.5">
												<RhfAmountInput
													cell
													name={`financial.plants.${plant}.annualisedInr`}
													aria-label={`${plant} annualised impact in rupees`}
													className="w-[140px] text-right"
												/>
											</td>
											<td className="px-1.5 py-1.5">
												<RhfInput
													cell
													name={`financial.plants.${plant}.annualisedPct`}
													aria-label={`${plant} annualised impact percent`}
													inputMode="decimal"
													className="w-[100px] text-right"
												/>
											</td>
										</>
									)}
								</tr>
							))}
							<tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
								<td className="px-3 py-2">Total</td>
								<td className="px-3 py-2 text-right">{inr.format(actual)}</td>
								{readOnly ? (
									<td className="px-3 py-2 text-right">
										{pctText(financial?.totalActualPct)}
									</td>
								) : (
									<td className="px-1.5 py-1.5">
										<RhfInput
											cell
											name="financial.totalActualPct"
											aria-label="Total actual impact percent"
											inputMode="decimal"
											className="w-[100px] text-right"
										/>
									</td>
								)}
								<td className="px-3 py-2 text-right">
									{inr.format(annualised)}
								</td>
								{readOnly ? (
									<td className="px-3 py-2 text-right">
										{pctText(financial?.totalAnnualisedPct)}
									</td>
								) : (
									<td className="px-1.5 py-1.5">
										<RhfInput
											cell
											name="financial.totalAnnualisedPct"
											aria-label="Total annualised impact percent"
											inputMode="decimal"
											className="w-[100px] text-right"
										/>
									</td>
								)}
							</tr>
						</tbody>
					</table>
				</div>
				<p className="text-xs text-slate-500">
					(+ve. → Price Increase, −ve. → Price Decrease)
				</p>
			</CppSection>
		</div>
	);
};

export default FinancialImpactTab;
