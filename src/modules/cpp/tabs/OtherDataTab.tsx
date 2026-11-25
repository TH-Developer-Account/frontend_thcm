// tabs/OtherDataTab.tsx — wizard step 6: remarks and "Price in other plant location (if any)".
// The table is a free list: add or remove rows while editing; view mode shows the saved rows.
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import Button from "../../../components/common/Button";
import TextareaInput from "../../../components/forms/TextareaInput";
import {
	RhfAmountInput,
	RhfInput,
	useCppReadOnly,
} from "../components/CppFields";
import CppSection from "../components/CppSection";
import type { CppFormValues } from "../types/cpp.types";
import { CPP_MAX_TABLE_ROWS, emptyPlantPrice } from "../utils/cpp.utils";

const PlantPriceRow = ({
	index,
	onRemove,
}: {
	index: number;
	onRemove: () => void;
}) => {
	const readOnly = useCppReadOnly();

	return (
		<tr className="border-t border-slate-200 align-top">
			<td className="px-1.5 py-1.5">
				<RhfInput
					name={`other.plantPrices.${index}.plant`}
					aria-label={`Row ${index + 1} plant`}
					placeholder="e.g. NGP"
				/>
			</td>
			<td className="px-1.5 py-1.5">
				<RhfInput
					name={`other.plantPrices.${index}.partNumber`}
					aria-label={`Row ${index + 1} part number`}
					placeholder="Part number"
				/>
			</td>
			<td className="px-1.5 py-1.5">
				<RhfAmountInput
					cell
					name={`other.plantPrices.${index}.price`}
					aria-label={`Row ${index + 1} price in rupees`}
					className="text-right"
					placeholder="0.00"
				/>
			</td>
			{readOnly ? null : (
				<td className="px-1.5 py-1.5 text-right">
					<Button
						type="button"
						text="Remove"
						size="sm"
						onClick={onRemove}
					/>
				</td>
			)}
		</tr>
	);
};

const OtherDataTab = () => {
	const { control } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const { fields, append, remove } = useFieldArray({
		control,
		name: "other.plantPrices",
	});
	const rowLimitReached = fields.length >= CPP_MAX_TABLE_ROWS;

	return (
		<div className="flex flex-col gap-4">
			<Controller
				name="other.remarks"
				control={control}
				render={({ field }) => (
					<TextareaInput
						{...field}
						label="Additional remarks"
						rows={4}
						maxLength={1000}
					/>
				)}
			/>

			<CppSection
				title="Price in other plant location (if any)"
				subtitle="Price of the same part in another plant. Leave the table empty if there is none."
			>
				{fields.length === 0 ? (
					<p className="text-sm text-slate-500">
						No other plant prices added.
					</p>
				) : (
					<div className="overflow-x-auto rounded-md border border-slate-200 scrollbar-sleek">
						<table className="w-full min-w-[480px] text-sm">
							<thead className="bg-slate-50 text-xs font-semibold text-slate-700">
								<tr>
									<th className="px-3 py-2 text-left">Plant</th>
									<th className="px-3 py-2 text-left">Part number</th>
									<th className="px-3 py-2 text-right">Price (₹)</th>
									{readOnly ? null : (
										<th className="w-[1%] px-3 py-2">
											<span className="sr-only">Actions</span>
										</th>
									)}
								</tr>
							</thead>
							<tbody>
								{fields.map((item, index) => (
									<PlantPriceRow
										key={item.id}
										index={index}
										onRemove={() => remove(index)}
									/>
								))}
							</tbody>
						</table>
					</div>
				)}

				{readOnly ? null : (
					<div className="flex items-center gap-3">
						<Button
							type="button"
							text="Add row"
							size="sm"
							disabled={rowLimitReached}
							onClick={() => append(emptyPlantPrice())}
						/>
						{rowLimitReached ? (
							<span className="text-xs text-slate-500">
								Maximum {CPP_MAX_TABLE_ROWS} rows.
							</span>
						) : null}
					</div>
				)}
			</CppSection>
		</div>
	);
};

export default OtherDataTab;
