// tabs/FinancialImpactTab.tsx — "no change" flag and plant-wise split.
// Matches the current types: financial: { noChange, plantSplit }.
// Works for the wizard (edit) and the view page (read-only via CppReadOnlyProvider).
import { Controller, useFormContext, useWatch } from "react-hook-form";

import Checkbox from "../../../components/forms/Checkbox";
import ReadOnlyField from "../../../components/forms/ReadOnlyField";
import CppSection from "../components/CppSection";
import {
	RhfInput,
	useCppReadOnly,
	useFieldError,
} from "../components/CppFields";
import type { CppFormValues } from "../types/cpp.types";
import { CPP_PLANTS, sumPlantSplit } from "../utils/cpp.utils";

const EMPTY_SPLIT = { DWD: "", KGP: "", SPARE: "" };

const FinancialImpactTab = () => {
	const { control } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const noChange = useWatch({ control, name: "financial.noChange" });
	const split = useWatch({ control, name: "financial.plantSplit" });
	const splitError = useFieldError("financial.plantSplit");

	const total = sumPlantSplit(split ?? EMPTY_SPLIT);
	const hasSplit = CPP_PLANTS.some((plant) => (split?.[plant] ?? "").trim());

	return (
		<CppSection title="Financial impact">
			<div>
				{readOnly ? (
					<ReadOnlyField
						label="No change in financial impact (price-neutral request)"
						value={noChange ? "Yes" : "No"}
					/>
				) : (
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
				)}
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				{CPP_PLANTS.map((plant) => (
					<RhfInput
						key={plant}
						name={`financial.plantSplit.${plant}`}
						label={`${plant} share (%)`}
						inputMode="decimal"
						disabled={!readOnly && noChange}
					/>
				))}
			</div>

			{!readOnly && hasSplit ? (
				<p className="text-xs text-slate-500">
					Total: {total.toFixed(2)}% (should be 100%)
				</p>
			) : null}

			{splitError ? (
				<p className="form-error-text" role="alert">
					{splitError}
				</p>
			) : null}
		</CppSection>
	);
};

export default FinancialImpactTab;
