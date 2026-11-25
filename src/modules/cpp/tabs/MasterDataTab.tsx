// tabs/MasterDataTab.tsx — master data per plant / warehouse (masterData.plantDetails).
// The rows follow the Plant dropdown in Basic details: a plant shows the plant rows,
// the spares option shows the warehouse rows. Asterisks mark what the save check requires:
// one applicable row in the group, and a purchasing group and tax code on every applicable row.
import { Controller, useFormContext, useWatch } from "react-hook-form";

import TextareaInput from "../../../components/forms/TextareaInput";
import CppSection from "../components/CppSection";
import {
	RhfInput,
	RhfSelect,
	toOptions,
	useCppReadOnly,
	useFieldError,
} from "../components/CppFields";
import type { CppFormValues, CppLocationRow } from "../types/cpp.types";
import {
	INCO_TERMS,
	MATERIAL_GROUPS,
	MATERIAL_TYPES,
	TAX_CODES,
	YES_NO,
	getLocationGroup,
	getOwnLocationCode,
	isLocationApplicable,
} from "../utils/cpp.utils";

const inputClass = (error?: string) =>
	[
		"w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500",
		"disabled:bg-gray-100 disabled:text-gray-600",
		error ? "border-red-500" : "border-gray-300",
	].join(" ");

const Required = () => (
	<span aria-hidden="true" className="ml-0.5 text-red-600">
		*
	</span>
);

const CellError = ({ message }: { message?: string }) =>
	message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;

type PlantRowProps = {
	index: number;
	row: CppLocationRow;
	plant: string;
	group: "PLANT" | "SPARE";
	readOnly: boolean;
};

const PlantDetailsRow = ({
	index,
	row,
	plant,
	group,
	readOnly,
}: PlantRowProps) => {
	const { control } = useFormContext<CppFormValues>();
	const base = `masterData.plantDetails.${index}` as const;
	const isOwnPlant = getOwnLocationCode(plant) === row.code;
	const applicable = isLocationApplicable(row, plant);

	const applicableError = useFieldError(`${base}.applicable`);
	const purchasingError = useFieldError(`${base}.purchasingGroup`);
	const taxError = useFieldError(`${base}.taxCode`);

	return (
		<tr className="align-top">
			<td className="px-2 py-2">
				<Controller
					name={`${base}.applicable`}
					control={control}
					render={({ field }) => (
						<input
							type="checkbox"
							className="h-4 w-4 accent-blue-600"
							aria-label={`${row.name} applicable`}
							checked={applicable}
							disabled={readOnly || isOwnPlant}
							title={
								isOwnPlant ? "Your own plant is always applicable" : undefined
							}
							onChange={(e) => field.onChange(e.target.checked)}
							onBlur={field.onBlur}
							name={field.name}
							ref={field.ref}
						/>
					)}
				/>
				<CellError message={applicableError} />
			</td>
			<td className="whitespace-nowrap px-2 py-2 text-sm text-gray-700">
				{row.code}
			</td>
			<td className="whitespace-nowrap px-2 py-2 text-sm text-gray-700">
				{row.name}
			</td>
			<td className="px-2 py-2">
				<Controller
					name={`${base}.incoTerms`}
					control={control}
					render={({ field }) => (
						<select
							{...field}
							value={field.value ?? ""}
							disabled={readOnly}
							className={inputClass()}
						>
							<option value="">Select</option>
							{INCO_TERMS.map((term) => (
								<option key={term} value={term}>
									{term}
								</option>
							))}
						</select>
					)}
				/>
			</td>
			<td className="px-2 py-2">
				<Controller
					name={`${base}.purchasingGroup`}
					control={control}
					render={({ field }) => (
						<input
							{...field}
							value={field.value ?? ""}
							maxLength={10}
							placeholder="e.g. D07"
							disabled={readOnly}
							className={inputClass(purchasingError)}
						/>
					)}
				/>
				<CellError message={purchasingError} />
			</td>
			<td className="px-2 py-2">
				<Controller
					name={`${base}.taxCode`}
					control={control}
					render={({ field }) => (
						<select
							{...field}
							value={field.value ?? ""}
							disabled={readOnly}
							className={inputClass(taxError)}
						>
							<option value="">Select</option>
							{TAX_CODES.map((code) => (
								<option key={code} value={code}>
									{code}
								</option>
							))}
						</select>
					)}
				/>
				<CellError message={taxError} />
			</td>
			{group === "PLANT" ? (
				<td className="px-2 py-2">
					<Controller
						name={`${base}.storeLocation`}
						control={control}
						render={({ field }) => (
							<input
								{...field}
								value={field.value ?? ""}
								maxLength={60}
								placeholder="e.g. D012"
								disabled={readOnly}
								className={inputClass()}
							/>
						)}
					/>
				</td>
			) : (
				<td className="px-2 py-2">
					<Controller
						name={`${base}.pfPct`}
						control={control}
						render={({ field }) => (
							<input
								{...field}
								value={field.value ?? ""}
								type="number"
								step="0.01"
								min="0"
								placeholder="%"
								disabled={readOnly}
								className={inputClass()}
							/>
						)}
					/>
				</td>
			)}
		</tr>
	);
};

const MasterDataTab = () => {
	const { control } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const plant =
		(useWatch({ control, name: "plant" }) as string | undefined) ?? "";
	const rows =
		(useWatch({ control, name: "masterData.plantDetails" }) as
			| CppLocationRow[]
			| undefined) ?? [];

	const group = getLocationGroup(plant);
	const visible = rows
		.map((row, index) => ({ row, index }))
		.filter(({ row }) => group !== null && row.group === group);
	// The save check reports "select at least one" on the first row of the group.
	const groupErrorPath = visible[0]
		? `masterData.plantDetails.${visible[0].index}.applicable`
		: "";
	const groupError = useFieldError(groupErrorPath);
	const groupLabel = group === "SPARE" ? "warehouses" : "plants";

	return (
		<CppSection
		// title="Master data"
		// subtitle="Details for each plant or warehouse that the price applies to"
		>
			<div className="space-y-6">
				<div>
					<div className="mb-2 flex items-baseline justify-between gap-2">
						<h4 className="text-sm font-semibold text-gray-800">
							{group === "SPARE"
								? "Applicable warehouses"
								: "Applicable plants"}
							{group && <Required />}
						</h4>
						{!group && (
							<p className="text-xs text-gray-500">
								Select a plant in Basic details to see its rows.
							</p>
						)}
					</div>

					{group && (
						<>
							<p className="mb-2 text-xs text-gray-500">
								Tick every {groupLabel} the price applies to. Each ticked row
								needs a purchasing group and a tax code.
							</p>
							<CellError message={groupError} />
							<div className="overflow-x-auto rounded border border-gray-200">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
										<tr>
											<th className="px-2 py-2">
												Applicable
												<Required />
											</th>
											<th className="px-2 py-2">Code</th>
											<th className="px-2 py-2">Name</th>
											<th className="px-2 py-2">Inco terms</th>
											<th className="px-2 py-2">
												Purchasing group
												<Required />
											</th>
											<th className="px-2 py-2">
												Tax code
												<Required />
											</th>
											<th className="px-2 py-2">
												{group === "SPARE" ? "P&F (%)" : "Store location"}
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-100 bg-white">
										{visible.map(({ row, index }) => (
											<PlantDetailsRow
												key={row.code}
												index={index}
												row={row}
												plant={plant}
												group={group}
												readOnly={readOnly}
											/>
										))}
									</tbody>
								</table>
							</div>
						</>
					)}
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<RhfSelect
						name="masterData.materialGroup"
						label="Material group"
						options={toOptions(MATERIAL_GROUPS)}
					/>
					<RhfSelect
						name="masterData.materialType"
						label="Material type"
						options={toOptions(MATERIAL_TYPES)}
					/>
					<RhfInput
						name="masterData.validFrom"
						label="Info record valid from"
						type="date"
					/>
					<RhfSelect
						name="masterData.updateSourceList"
						label="Update source list"
						options={toOptions(YES_NO)}
					/>
					<div className="sm:col-span-2 lg:col-span-3">
						<Controller
							name="masterData.note"
							control={control}
							render={({ field }) => (
								<TextareaInput
									{...field}
									label="Note for master data team"
									rows={3}
								/>
							)}
						/>
					</div>
				</div>
			</div>
		</CppSection>
	);
};

export default MasterDataTab;
