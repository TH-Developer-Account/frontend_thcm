// tabs/PurchasingDetailsTab.tsx — suppliers + parts/price table.
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { RhfInput } from "../components/CppFields";
import type { CppFormValues } from "../types/cpp.types";
import { calcPartImpact, emptyPart, formatPct } from "../utils/cpp.utils";

type SupplierKey = keyof CppFormValues["suppliers"];

const SUPPLIERS: { key: SupplierKey; title: string; hint: string }[] = [
	{ key: "existing", title: "Existing supplier", hint: "Required" },
	{ key: "other", title: "Other supplier", hint: "Optional" },
	{ key: "recommended", title: "Recommended supplier", hint: "Required" },
];

const SupplierBlock = ({
	keyName,
	title,
}: {
	keyName: SupplierKey;
	title: string;
}) => {
	const base = `suppliers.${keyName}` as const;

	return (
		<Card title={title} size="small">
			<div className="grid gap-3">
				{/* Plain input for now — swap for BusinessPartnerAsyncSelect later. */}
				<RhfInput
					name={`${base}.name`}
					label="Supplier name"
					placeholder="Enter supplier name"
					required={keyName !== "other"}
				/>
				<RhfInput
					name={`${base}.code`}
					label="Vendor code"
					placeholder="e.g. V-000000"
				/>
			</div>
		</Card>
	);
};

const COLUMNS: {
	label: string;
	key: keyof ReturnType<typeof emptyPart>;
	width: string;
	type?: string;
	right?: boolean;
}[] = [
	{ label: "Part No", key: "partNo", width: "w-[130px]" },
	{ label: "Description", key: "description", width: "w-[190px]" },
	{ label: "UOM", key: "uom", width: "w-[70px]" },
	{
		label: "Existing rate",
		key: "existingRate",
		width: "w-[104px]",
		right: true,
	},
	{
		label: "Existing w.e.f",
		key: "existingWef",
		width: "w-[136px]",
		type: "date",
	},
	{ label: "Quoted rate", key: "quotedRate", width: "w-[104px]", right: true },
	{ label: "Quoted w.e.f", key: "quotedWef", width: "w-[136px]", type: "date" },
	{ label: "Final rate", key: "finalRate", width: "w-[104px]", right: true },
	{ label: "Final w.e.f", key: "finalWef", width: "w-[136px]", type: "date" },
];

const PurchasingDetailsTab = () => {
	const { control } = useFormContext<CppFormValues>();
	const { fields, append, remove } = useFieldArray({ control, name: "parts" });
	const parts = useWatch({ control, name: "parts" });
	const noChange = useWatch({ control, name: "financial.noChange" });

	return (
		<div className="flex flex-col gap-4">
			<div className="grid gap-4 lg:grid-cols-3">
				{SUPPLIERS.map((s) => (
					<SupplierBlock key={s.key} keyName={s.key} title={s.title} />
				))}
			</div>

			<Card
				title="Parts and prices"
				subtitle="All rates in INR (₹) per unit"
				size="small"
			>
				<div className="overflow-x-auto rounded-md border border-slate-200 scrollbar-sleek">
					<table className="w-full min-w-[1280px] text-sm">
						<thead className="bg-slate-50 text-left text-xs font-semibold text-slate-700">
							<tr>
								<th className="px-2 py-2">#</th>
								{COLUMNS.map((c) => (
									<th
										key={c.key}
										className={`px-2 py-2 ${c.right ? "text-right" : ""}`}
									>
										{c.label}
									</th>
								))}
								<th className="px-2 py-2 text-right">% impact</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{fields.map((field, index) => {
								const impact = calcPartImpact(
									parts?.[index] ?? emptyPart(),
									noChange,
								);
								return (
									<tr
										key={field.id}
										className="border-t border-slate-200 align-top"
									>
										<td className="px-2 py-3 text-xs text-slate-500">
											{index + 1}
										</td>
										{COLUMNS.map((c) => (
											<td key={c.key} className="px-1.5 py-1.5">
												<RhfInput
													cell
													name={`parts.${index}.${c.key}`}
													type={c.type}
													aria-label={`${c.label} row ${index + 1}`}
													inputMode={c.right ? "decimal" : undefined}
													className={`${c.width} ${c.right ? "text-right" : ""}`}
												/>
											</td>
										))}
										<td className="px-2 py-3 text-right font-semibold">
											{formatPct(impact.pct)}
										</td>
										<td className="px-1 py-1.5">
											<Button
												type="button"
												appearance="icon"
												variant="transparent"
												Icon={Trash2}
												aria-label={`Remove part ${index + 1}`}
												disabled={fields.length < 2}
												onClick={() => remove(index)}
											/>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				<div className="mt-3 flex flex-wrap items-center gap-3">
					<Button
						type="button"
						text="Add part"
						size="sm"
						appearance="standard"
						variant="outline"
						Icon={Plus}
						onClick={() => append(emptyPart())}
					/>
					<span className="text-xs text-slate-500">
						More than 5 parts? Attach the Summary Sheet under Other Data.
					</span>
				</div>
			</Card>
		</div>
	);
};

export default PurchasingDetailsTab;
