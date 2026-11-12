// tabs/AmortisationTab.tsx — always visible, always the last tab.
// Calculation = Amount ÷ Amortised qty · Per machine = Calculation × Qty/m/c.
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { RhfInput } from "../components/CppFields";
import type { CppFormValues } from "../types/cpp.types";
import {
	AMORTISED_CONDITION,
	calcAmort,
	emptyAmort,
	formatINR,
} from "../utils/cpp.utils";

const AmortisationTab = () => {
	const { control } = useFormContext<CppFormValues>();
	const { fields, append, remove } = useFieldArray({
		control,
		name: "amortisation",
	});
	const rows = useWatch({ control, name: "amortisation" });
	const condition = useWatch({ control, name: "workflow.pricingCondition" });
	const isAmortised = condition === AMORTISED_CONDITION;

	return (
		<Card title="Amortisation" size="small">
			<div className="mb-4">
				<Alert
					type="banner"
					variant="info"
					title={
						isAmortised
							? "Amortised price selected — fill in every row."
							: "Needed only when the price includes tooling or development cost."
					}
					description="Calculation = Amount ÷ Amortised quantity. Per-machine impact = Calculation × Qty per machine."
				/>
			</div>

			<div className="overflow-x-auto rounded-md border border-slate-200 scrollbar-sleek">
				<table className="w-full min-w-[820px] text-sm">
					<thead className="bg-slate-50 text-xs font-semibold text-slate-700">
						<tr>
							<th className="px-2 py-2 text-left">Part No</th>
							<th className="px-2 py-2 text-right">Amount (₹)</th>
							<th className="px-2 py-2 text-right">Amortised over (qty)</th>
							<th className="px-2 py-2 text-right">Calculation (₹ / unit)</th>
							<th className="px-2 py-2 text-right">Qty per m/c</th>
							<th className="px-2 py-2 text-right">Per machine impact (₹)</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{fields.map((field, index) => {
							const calc = calcAmort(rows?.[index] ?? emptyAmort());
							return (
								<tr
									key={field.id}
									className="border-t border-slate-200 align-top"
								>
									<td className="px-1.5 py-1.5">
										<RhfInput
											cell
											name={`amortisation.${index}.partNo`}
											aria-label="Part no"
											className="w-[140px]"
										/>
									</td>
									<td className="px-1.5 py-1.5">
										<RhfInput
											cell
											name={`amortisation.${index}.amount`}
											aria-label="Amortisation amount"
											inputMode="decimal"
											className="w-[130px] text-right"
										/>
									</td>
									<td className="px-1.5 py-1.5">
										<RhfInput
											cell
											name={`amortisation.${index}.qty`}
											aria-label="Amortised over quantity"
											inputMode="numeric"
											className="w-[120px] text-right"
										/>
									</td>
									<td className="px-2 py-3 text-right">
										{formatINR(calc.perUnit)}
									</td>
									<td className="px-1.5 py-1.5">
										<RhfInput
											cell
											name={`amortisation.${index}.perMachineQty`}
											aria-label="Quantity per machine"
											inputMode="decimal"
											className="w-[100px] text-right"
										/>
									</td>
									<td className="px-2 py-3 text-right font-semibold">
										{formatINR(calc.perMachine)}
									</td>
									<td className="px-1">
										<Button
											type="button"
											appearance="icon"
											variant="transparent"
											Icon={Trash2}
											aria-label="Remove row"
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

			<div className="mt-3">
				<Button
					type="button"
					text="Add row"
					size="sm"
					appearance="standard"
					variant="outline"
					Icon={Plus}
					onClick={() => append(emptyAmort())}
				/>
			</div>
		</Card>
	);
};

export default AmortisationTab;
