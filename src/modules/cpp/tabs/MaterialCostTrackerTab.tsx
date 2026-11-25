// tabs/MaterialCostTrackerTab.tsx — Material cost tracker.
// View mode (CppReadOnlyProvider): the saved tracker rows are shown as a read-only table.
// Edit mode: the table input is still behind MATERIAL_COST_TRACKER_ENABLED (utils/cpp.utils.ts),
// so the wizard keeps showing the placeholder until the feature is switched on.
import { Wrench } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { CardEmpty } from "../../../components/ui/CardSkeleton";
import { useCppReadOnly } from "../components/CppFields";
import CppSection from "../components/CppSection";
import type { CppFormValues } from "../types/cpp.types";
import { MATERIAL_COST_TRACKER_ENABLED } from "../utils/cpp.utils";

const COLUMNS = [
	{ key: "model", label: "Model", numeric: false },
	{ key: "perMachineImpact", label: "Per machine impact", numeric: true },
	{
		key: "budgetedIncrease",
		label: "Budgeted increase in price (per m/c – FY16)",
		numeric: true,
	},
	{ key: "statusYtd", label: "Status YTD (FY19)", numeric: true },
	{ key: "budgetedMaterialCost", label: "Budgeted material cost", numeric: true },
	{ key: "materialCostYtd", label: "Material cost YTD", numeric: true },
] as const;

const NUMBER_FORMAT = new Intl.NumberFormat("en-IN", {
	maximumFractionDigits: 2,
});

const show = (value: unknown, numeric: boolean): string => {
	if (value === null || value === undefined || String(value).trim() === "")
		return "Not provided";
	if (!numeric) return String(value);
	const parsed = Number(value);
	return Number.isFinite(parsed) ? NUMBER_FORMAT.format(parsed) : String(value);
};

const isFilled = (row: Record<string, unknown>): boolean =>
	COLUMNS.some((column) => String(row[column.key] ?? "").trim() !== "");

const MaterialCostTrackerTab = () => {
	const readOnly = useCppReadOnly();
	const { control } = useFormContext<CppFormValues>();
	const rows = useWatch({ control, name: "costTracker" }) ?? [];
	const filled = rows.filter((row) =>
		isFilled(row as unknown as Record<string, unknown>),
	);

	if (readOnly && filled.length > 0) {
		return (
			<CppSection
				title="Material cost tracker"
				subtitle="All values in lakhs INR"
			>
				<div className="overflow-x-auto rounded-md border border-line scrollbar-sleek">
					<table className="w-full min-w-[720px] text-sm">
						<thead className="bg-surface-readonly text-xs font-semibold text-fg">
							<tr>
								{COLUMNS.map((column) => (
									<th
										key={column.key}
										scope="col"
										className={`px-3 py-2 ${column.numeric ? "text-right" : "text-left"}`}
									>
										{column.label}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{filled.map((row, index) => (
								<tr key={index} className="border-t border-line">
									{COLUMNS.map((column) => (
										<td
											key={column.key}
											className={`px-3 py-2 text-fg ${column.numeric ? "text-right tabular-nums" : ""}`}
										>
											{show(
												(row as unknown as Record<string, unknown>)[column.key],
												column.numeric,
											)}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</CppSection>
		);
	}

	return (
		<CppSection title="Material cost tracker">
			<CardEmpty
				Icon={Wrench}
				title={
					readOnly
						? "No tracker rows were provided"
						: MATERIAL_COST_TRACKER_ENABLED
							? "Coming soon"
							: "Not in use right now"
				}
				description={
					readOnly
						? "This request was submitted without material cost tracker values."
						: "The table input is built but disabled. It will appear here when the feature flag is turned on."
				}
			/>
		</CppSection>
	);
};

export default MaterialCostTrackerTab;
