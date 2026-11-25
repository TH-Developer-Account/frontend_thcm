// tabs/BasicDetailsTab.tsx — wizard step 1.
// category · plant · conditions · material type · commodity · initiation date ·
// reason · models · price type · pricing condition · justification.
// These decide which approval workflow runs, so they come first.
// Applicable plants are NOT picked here: they are the rows ticked in the
// Master data step (see workflowPlantsOf in helpers/cpp.mapper.ts).
// Plain content: the parent card in CppRequestCreatePage provides the surface.
// Every control goes through the read-only-aware wrappers in CppFields, so on
// the view page (CppReadOnlyProvider) nothing here stays editable.
// The effects below keep the form consistent while a request is being edited;
// they never run in view mode, which must not rewrite a saved request.
import { useEffect, useMemo } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import TextareaInput from "../../../components/forms/TextareaInput";
import {
	FieldAnchor,
	RhfCheckGroup,
	RhfInput,
	RhfMultiSelect,
	RhfRadio,
	RhfSelect,
	toOptions,
	useCppReadOnly,
} from "../components/CppFields";
import type { CppFormValues } from "../types/cpp.types";
import {
	CPP_CATEGORY_OPTIONS,
	CPP_PLANT_OPTIONS,
	CPP_PRICE_TYPE_OPTIONS,
} from "../utils/cpp.constants";
import {
	CPP_EFFECTS,
	CPP_MODELS,
	CPP_PRICING_CONDITIONS,
	CPP_REASONS,
	MIN_JUSTIFICATION,
	NEW_PART_REASON,
	getConditionGroup,
	getConditionOptions,
	isConditionAllowed,
} from "../utils/cpp.utils";

const MATERIAL_TYPE_OPTIONS = toOptions(["Direct", "Indirect"]);

const RoutingFields = () => {
	const { control, setValue, getValues } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const category = useWatch({ control, name: "category" });
	const conditionOptions = useMemo(
		() => getConditionOptions(category),
		[category],
	);

	// Category drives material type, and limits which conditions can be picked.
	useEffect(() => {
		if (!category || readOnly) return;
		setValue(
			"materialType",
			getConditionGroup(category) === "INDIRECT" ? "Indirect" : "Direct",
			{ shouldDirty: true },
		);
		const condition = getValues("condition");
		if (condition && !isConditionAllowed(condition, category)) {
			setValue("condition", "", { shouldDirty: true });
		}
		// Steel has a single scenario, so there is nothing to choose.
		if (category === "STEEL") {
			setValue("condition", "STEEL_COMMODITY", { shouldDirty: true });
		}
	}, [category, getValues, readOnly, setValue]);

	return (
		<div className="grid gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
			<RhfSelect
				name="category"
				label="Category"
				required
				placeholder="Select category"
				options={CPP_CATEGORY_OPTIONS}
			/>
			<RhfSelect
				name="plant"
				label="Plant"
				required
				placeholder="Select plant"
				options={CPP_PLANT_OPTIONS}
			/>
			<RhfSelect
				name="condition"
				label="Conditions"
				required
				placeholder={category ? "Select condition" : "Select category first"}
				isDisabled={!category}
				options={conditionOptions}
			/>
			<RhfInput
				name="initiationDate"
				label="CPP initiation date"
				type="date"
				disabled
			/>
		</div>
	);
};

const RequestDetailsFields = () => {
	const { control, setValue } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const reason = useWatch({ control, name: "reason" });
	const isNewPart = reason === NEW_PART_REASON;

	// Effect (Q/C/D) applies to existing materials only.
	useEffect(() => {
		if (isNewPart && !readOnly) setValue("effects", []);
	}, [isNewPart, readOnly, setValue]);

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
			{/* Row 2: material type · effect on · reason · models */}
			<RhfSelect
				name="materialType"
				label="Material type"
				required
				placeholder="Select material type"
				options={MATERIAL_TYPE_OPTIONS}
			/>

			<div>
				<RhfCheckGroup
					name="effects"
					label="Commodity price adjustment – effect on"
					options={CPP_EFFECTS}
					disabled={isNewPart}
				/>
				{isNewPart ? (
					<p className="form-helper-text">
						Effect applies to existing materials only.
					</p>
				) : null}
			</div>

			<RhfSelect
				name="reason"
				label="Reason for price update"
				required
				placeholder="Select reason"
				options={toOptions(CPP_REASONS)}
			/>
			<RhfMultiSelect
				name="workflow.models"
				label="Models"
				required
				placeholder="Select models"
				options={toOptions(CPP_MODELS)}
			/>

			{/* Row 3: price type */}
			<RhfSelect
				name="priceType"
				label="Price type"
				required
				placeholder="Select price type"
				options={CPP_PRICE_TYPE_OPTIONS}
			/>

			<div className="sm:col-span-2 lg:col-span-4">
				<RhfRadio
					name="workflow.pricingCondition"
					groupLabel="Pricing condition"
					required
					options={CPP_PRICING_CONDITIONS}
				/>
			</div>
		</div>
	);
};

const JustificationField = () => {
	const { control } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();

	return (
		<FieldAnchor name="justification">
			<Controller
				name="justification"
				control={control}
				render={({ field, fieldState }) => (
					<TextareaInput
						{...field}
						{...(readOnly ? { mode: "view" as const } : {})}
						label="Justification for this price change"
						required
						rows={6}
						maxLength={2000}
						placeholder={`Explain the reason, negotiation outcome and why the recommended supplier was chosen (min. ${MIN_JUSTIFICATION} characters)`}
						error={readOnly ? undefined : fieldState.error?.message}
						helperText={
							readOnly
								? undefined
								: `${field.value.trim().length} / ${MIN_JUSTIFICATION} min`
						}
						isTooltip={false}
					/>
				)}
			/>
		</FieldAnchor>
	);
};

const BasicDetailsTab = () => (
	<div className="flex flex-col gap-4">
		<RoutingFields />
		<RequestDetailsFields />
		<JustificationField />
	</div>
);

export default BasicDetailsTab;
