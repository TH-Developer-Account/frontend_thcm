// tabs/AmortisationTab.tsx — shown when the pricing condition is the amortised one (PB50).
// Amortisation per unit = price incl. amortisation − price after amortisation.
// Total recovered = per unit × amortised qty. Plain content: the parent card provides the surface.
// In view mode (CppReadOnlyProvider) the rows are values only: no add / remove.
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
import {
	RhfAmountInput,
	RhfInput,
	useCppReadOnly,
} from "../components/CppFields";
import CppSection from "../components/CppSection";
import type { CppFormValues } from "../types/cpp.types";
import { calcAmort, emptyAmort, formatINR } from "../utils/cpp.utils";

const AmortisationTab = () => {
	const { control } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const { fields, append, remove } = useFieldArray({
		control,
		name: "amortisation",
	});
	const rows = useWatch({ control, name: "amortisation" });

	return (
		<CppSection title="Amortisation" subtitle="In case of amortisation only">
			{readOnly ? null : (
				<div className="mb-2">
					<Alert
						type="banner"
						variant="info"
						title="Amortised price selected — fill in every row."
						description="Amortisation per unit = price incl. amortisation − price after amortisation. Total recovered = per unit × amortised qty."
					/>
				</div>
			)}

			<div className="overflow-x-auto rounded-md border border-slate-200 scrollbar-sleek">
				<table className="w-full min-w-[960px] text-sm">
					<thead className="bg-slate-50 text-xs font-semibold text-slate-700">
						<tr>
							<th className="px-2 py-2 text-left">Part no</th>
							<th className="px-2 py-2 text-right">
								Price incl. amortisation (₹)
							</th>
							<th className="px-2 py-2 text-left">Cut-off date</th>
							<th className="px-2 py-2 text-right">Amortised qty</th>
							<th className="px-2 py-2 text-right">
								Price after amortisation (₹)
							</th>
							<th className="px-2 py-2 text-right">Amortisation / unit (₹)</th>
							<th className="px-2 py-2 text-right">Total recovered (₹)</th>
							{readOnly ? null : <th />}
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
										<RhfAmountInput
											cell
											name={`amortisation.${index}.priceInclAmort`}
											aria-label="Price incl. amortisation"
											className="w-[140px] text-right"
										/>
									</td>
									<td className="px-1.5 py-1.5">
										<RhfInput
											cell
											name={`amortisation.${index}.cutoffDate`}
											aria-label="Cut-off date"
											type="date"
											className="w-[160px]"
										/>
									</td>
									<td className="px-1.5 py-1.5">
										<RhfInput
											cell
											name={`amortisation.${index}.amortQty`}
											aria-label="Amortised quantity"
											inputMode="decimal"
											className="w-[120px] text-right"
										/>
									</td>
									<td className="px-1.5 py-1.5">
										<RhfAmountInput
											cell
											name={`amortisation.${index}.priceAfterAmort`}
											aria-label="Price after amortisation"
											className="w-[140px] text-right"
										/>
									</td>
									<td className="px-2 py-3 text-right">
										{formatINR(calc.perUnit)}
									</td>
									<td className="px-2 py-3 text-right font-semibold">
										{formatINR(calc.total)}
									</td>
									{readOnly ? null : (
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
									)}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{readOnly ? null : (
				<div>
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
			)}
		</CppSection>
	);
};

export default AmortisationTab;
