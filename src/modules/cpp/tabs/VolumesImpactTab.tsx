// tabs/VolumesImpactTab.tsx — wizard step "Volumes & impact". Every table is optional.
//   1. Volumes taken for calculation   a / b (actual) and c (annualised) per DWD · KGP · SPARE
//   2. Per machine impact              plant · model · impact with / without amortisation (₹)
//   3. Material cost tracker           per model, all values in ₹ lakhs
// Typed values only have to be numbers; empty rows are not saved.
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import {
	RhfAmountInput,
	RhfInput,
	RhfSelect,
	toOptions,
} from "../components/CppFields";
import type { CppFormValues } from "../types/cpp.types";
import {
	CPP_MAX_TABLE_ROWS,
	CPP_MODELS,
	CPP_PLANTS,
	actualQty,
	emptyCostTracker,
	emptyPerMachine,
	formatQty,
} from "../utils/cpp.utils";

const TH = "px-2 py-2 text-xs font-semibold text-slate-700";
const TABLE_WRAP =
	"overflow-x-auto rounded-md border border-slate-200 scrollbar-sleek";

/** First message anywhere under a field path (cells only show a red border). */
const firstMessage = (node: unknown): string | undefined => {
	if (!node || typeof node !== "object") return undefined;
	const { message } = node as { message?: unknown };
	if (typeof message === "string") return message;
	for (const child of Object.values(node as Record<string, unknown>)) {
		const found = firstMessage(child);
		if (found) return found;
	}
	return undefined;
};

const TableError = ({ name }: { name: keyof CppFormValues }) => {
	const {
		formState: { errors },
	} = useFormContext<CppFormValues>();
	const message = firstMessage(errors[name]);
	return message ? (
		<p className="form-error-text mt-2" role="alert">
			{message} — check the highlighted cells.
		</p>
	) : null;
};

/** Models picked in step 1 first; the full list if none were picked. */
const useModelOptions = () => {
	const { control } = useFormContext<CppFormValues>();
	const models = useWatch({ control, name: "workflow.models" });
	return toOptions(models?.length ? models : CPP_MODELS);
};

const AddRowButton = ({
	count,
	onAdd,
}: {
	count: number;
	onAdd: () => void;
}) => (
	<div className="mt-3 flex flex-wrap items-center gap-3">
		<Button
			type="button"
			text="Add row"
			size="sm"
			appearance="standard"
			variant="outline"
			Icon={Plus}
			disabled={count >= CPP_MAX_TABLE_ROWS}
			onClick={onAdd}
		/>
		<span className="text-xs text-slate-500">
			Optional · up to {CPP_MAX_TABLE_ROWS} rows · empty rows are not saved.
		</span>
	</div>
);

const RemoveButton = ({
	index,
	disabled,
	onRemove,
}: {
	index: number;
	disabled: boolean;
	onRemove: () => void;
}) => (
	<Button
		type="button"
		appearance="icon"
		variant="transparent"
		Icon={Trash2}
		aria-label={`Remove row ${index + 1}`}
		disabled={disabled}
		onClick={onRemove}
	/>
);

/* ------------------------- 1. volumes for calculation ------------------------ */

const VOLUME_ROWS = [
	{ key: "received", label: "Rcvd qty (till date) = a", group: "For actual" },
	{ key: "remaining", label: "Remaining qty = b", group: "For actual" },
	{ key: "annual", label: "Qty/mc × ABP nos = c", group: "For annualised" },
] as const;

const VolumesTable = () => {
	const { control } = useFormContext<CppFormValues>();
	const volumes = useWatch({ control, name: "volumes" });

	return (
		<Card
			title="Volumes taken for calculation"
			subtitle="Actual = (a + b) × impact · Annual = c × impact"
			size="small"
		>
			<div className={TABLE_WRAP}>
				<table className="w-full min-w-[640px] text-sm">
					<thead className="bg-slate-50">
						<tr>
							<th className={`${TH} text-left`}>Plant →</th>
							{CPP_PLANTS.map((plant) => (
								<th key={plant} className={`${TH} text-right`}>
									{plant}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{VOLUME_ROWS.map((row, rowIndex) => (
							<tr key={row.key} className="border-t border-slate-200">
								<td className="px-2 py-2">
									{rowIndex === 0 || VOLUME_ROWS[rowIndex - 1].group !== row.group ? (
										<span className="block text-xs font-semibold text-slate-500">
											{row.group}
										</span>
									) : null}
									<span className="text-slate-800">{row.label}</span>
								</td>
								{CPP_PLANTS.map((plant) => (
									<td key={plant} className="px-1.5 py-1.5">
										<RhfInput
											cell
											name={`volumes.${plant}.${row.key}`}
											aria-label={`${row.label} · ${plant}`}
											inputMode="numeric"
											className="w-full min-w-[110px] text-right"
										/>
									</td>
								))}
							</tr>
						))}
						<tr className="border-t border-slate-200 bg-slate-50">
							<td className="px-2 py-2 text-xs font-semibold text-slate-700">
								Actual qty (a + b)
							</td>
							{CPP_PLANTS.map((plant) => (
								<td
									key={plant}
									className="px-3 py-2 text-right font-semibold text-slate-800"
								>
									{formatQty(actualQty(volumes?.[plant] ?? { received: "", remaining: "", annual: "" }))}
								</td>
							))}
						</tr>
					</tbody>
				</table>
			</div>
			<TableError name="volumes" />
		</Card>
	);
};

/* ----------------------------- 2. per machine impact ------------------------- */

const PerMachineTable = () => {
	const { control } = useFormContext<CppFormValues>();
	const { fields, append, remove } = useFieldArray({
		control,
		name: "perMachineImpact",
	});
	const modelOptions = useModelOptions();

	return (
		<Card title="Per machine impact" subtitle="₹ per machine" size="small">
			<div className={TABLE_WRAP}>
				<table className="w-full min-w-[720px] text-sm">
					<thead className="bg-slate-50">
						<tr>
							<th className={`${TH} text-left`}>Plant</th>
							<th className={`${TH} text-left`}>Model</th>
							<th className={`${TH} text-right`}>Impact (with amort.) ₹</th>
							<th className={`${TH} text-right`}>Impact (w/o amort.) ₹</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{fields.map((field, index) => (
							<tr key={field.id} className="border-t border-slate-200 align-top">
								<td className="px-1.5 py-1.5 min-w-[140px]">
									<RhfSelect
										name={`perMachineImpact.${index}.plant`}
										placeholder="Plant"
										options={toOptions(CPP_PLANTS)}
									/>
								</td>
								<td className="px-1.5 py-1.5 min-w-[160px]">
									<RhfSelect
										name={`perMachineImpact.${index}.model`}
										placeholder="Model"
										options={modelOptions}
									/>
								</td>
								<td className="px-1.5 py-1.5">
									<RhfAmountInput
										cell
										name={`perMachineImpact.${index}.withAmort`}
										aria-label={`Impact with amortisation row ${index + 1}`}
										className="w-full min-w-[130px] text-right"
									/>
								</td>
								<td className="px-1.5 py-1.5">
									<RhfAmountInput
										cell
										name={`perMachineImpact.${index}.withoutAmort`}
										aria-label={`Impact without amortisation row ${index + 1}`}
										className="w-full min-w-[130px] text-right"
									/>
								</td>
								<td className="px-1">
									<RemoveButton
										index={index}
										disabled={fields.length < 2}
										onRemove={() => remove(index)}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<TableError name="perMachineImpact" />
			<AddRowButton
				count={fields.length}
				onAdd={() => append(emptyPerMachine())}
			/>
		</Card>
	);
};

/* ---------------------------- 3. material cost tracker ----------------------- */

// Labels kept as in the CPP format (FY16 / FY19 included).
const TRACKER_COLUMNS = [
	{ key: "perMachineImpact", label: "Per machine impact (based on PO)" },
	{ key: "budgetedIncrease", label: "Budgeted increase in price (per m/c – FY16)" },
	{ key: "statusYtd", label: "Status YTD (FY19) (MAP based)" },
	{ key: "budgetedMaterialCost", label: "Budgeted material cost (as per Fin. MIS)" },
	{ key: "materialCostYtd", label: "Material cost YTD (FY16)" },
] as const;

const CostTrackerTable = () => {
	const { control } = useFormContext<CppFormValues>();
	const { fields, append, remove } = useFieldArray({
		control,
		name: "costTracker",
	});
	const modelOptions = useModelOptions();

	return (
		<Card
			title="Material cost tracker"
			subtitle="All values in ₹ lakhs"
			size="small"
		>
			<div className={TABLE_WRAP}>
				<table className="w-full min-w-[1000px] text-sm">
					<thead className="bg-slate-50">
						<tr>
							<th className={`${TH} text-left`}>Model</th>
							{TRACKER_COLUMNS.map((column) => (
								<th key={column.key} className={`${TH} text-right`}>
									{column.label}
								</th>
							))}
							<th />
						</tr>
					</thead>
					<tbody>
						{fields.map((field, index) => (
							<tr key={field.id} className="border-t border-slate-200 align-top">
								<td className="px-1.5 py-1.5 min-w-[160px]">
									<RhfSelect
										name={`costTracker.${index}.model`}
										placeholder="Model"
										options={modelOptions}
									/>
								</td>
								{TRACKER_COLUMNS.map((column) => (
									<td key={column.key} className="px-1.5 py-1.5">
										<RhfAmountInput
											cell
											words="none"
											name={`costTracker.${index}.${column.key}`}
											aria-label={`${column.label} row ${index + 1}`}
											className="w-full min-w-[120px] text-right"
										/>
									</td>
								))}
								<td className="px-1">
									<RemoveButton
										index={index}
										disabled={fields.length < 2}
										onRemove={() => remove(index)}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<TableError name="costTracker" />
			<AddRowButton
				count={fields.length}
				onAdd={() => append(emptyCostTracker())}
			/>
		</Card>
	);
};

/* ------------------------------------ step ----------------------------------- */

const VolumesImpactTab = () => (
	<div className="flex flex-col gap-3">
		<VolumesTable />
		<PerMachineTable />
		<CostTrackerTable />
	</div>
);

export default VolumesImpactTab;
