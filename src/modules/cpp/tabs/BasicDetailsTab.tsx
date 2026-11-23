// tabs/BasicDetailsTab.tsx — wizard step 1.
// category · plant · conditions · commodity · reason · material type ·
// models · price type · pricing condition · justification.
// These decide which approval workflow runs, so they come first.
// Applicable plants are picked in Master data only; the workflow plants are
// derived from those rows when the request is saved (see cpp.mapper.ts).
// Plain content: the parent card in CppRequestCreatePage provides the surface.
import { useEffect, useMemo } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import Checkbox from "../../../components/forms/Checkbox";
import Radio from "../../../components/forms/Radio";
import TextareaInput from "../../../components/forms/TextareaInput";
import {
	RhfInput,
	RhfMultiSelect,
	RhfSelect,
	toOptions,
	useFieldError,
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

const RoutingFields = () => {
	const { control, setValue, getValues } = useFormContext<CppFormValues>();
	const category = useWatch({ control, name: "category" });
	const conditionOptions = useMemo(
		() => getConditionOptions(category),
		[category],
	);

	// Category drives material type, and limits which conditions can be picked.
	useEffect(() => {
		if (!category) return;
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
	}, [category, getValues, setValue]);

	return (
		<>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
			</div>
		</>
	);
};

const RequestDetailsFields = () => {
	const { control, setValue } = useFormContext<CppFormValues>();
	const reason = useWatch({ control, name: "reason" });
	const typeError = useFieldError("materialType");
	const pricingError = useFieldError("workflow.pricingCondition");
	const isNewPart = reason === NEW_PART_REASON;

	// Effect (Q/C/D) applies to existing materials only.
	useEffect(() => {
		if (isNewPart) setValue("effects", []);
	}, [isNewPart, setValue]);

	return (
		<>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Controller
					name="materialType"
					control={control}
					render={({ field }) => (
						<Radio
							name="materialType"
							groupLabel="Material type"
							required
							options={[
								{ label: "Direct", value: "Direct" },
								{ label: "Indirect", value: "Indirect" },
							]}
							selectedValue={field.value}
							onChange={field.onChange}
							error={typeError}
						/>
					)}
				/>

				<div className="lg:col-span-2">
					<span className="form-label">
						Commodity price adjustment – effect on
					</span>
					<Controller
						name="effects"
						control={control}
						render={({ field }) => (
							<div className="mt-2 flex flex-row flex-wrap items-center gap-x-8 gap-y-2">
								{CPP_EFFECTS.map((effect) => (
									<div key={effect} className="w-auto shrink-0">
										<Checkbox
											label={effect}
											disabled={isNewPart}
											checked={field.value.includes(effect)}
											onChange={(checked) =>
												field.onChange(
													checked
														? [...field.value, effect]
														: field.value.filter((item) => item !== effect),
												)
											}
										/>
									</div>
								))}
							</div>
						)}
					/>
					{isNewPart ? (
						<p className="form-helper-text">
							Effect applies to existing materials only.
						</p>
					) : null}
				</div>

				<RhfInput
					name="initiationDate"
					label="CPP initiation date"
					type="date"
					disabled
				/>

				<RhfSelect
					name="reason"
					label="Reason for price update"
					required
					placeholder="Select reason"
					options={toOptions(CPP_REASONS)}
					className="lg:col-span-2"
				/>
				<RhfMultiSelect
					name="workflow.models"
					label="Models"
					required
					placeholder="Select models"
					options={toOptions(CPP_MODELS)}
					className="lg:col-span-2"
				/>

				<RhfSelect
					name="priceType"
					label="Price type"
					required
					placeholder="Select price type"
					options={CPP_PRICE_TYPE_OPTIONS}
				/>

				<div className="sm:col-span-2 lg:col-span-4">
					<Controller
						name="workflow.pricingCondition"
						control={control}
						render={({ field }) => (
							<Radio
								name="workflow.pricingCondition"
								groupLabel="Pricing condition"
								required
								options={CPP_PRICING_CONDITIONS}
								selectedValue={field.value}
								onChange={field.onChange}
								error={pricingError}
							/>
						)}
					/>
				</div>
			</div>
		</>
	);
};

const JustificationField = () => {
	const { control } = useFormContext<CppFormValues>();

	return (
		<>
			<Controller
				name="justification"
				control={control}
				render={({ field, fieldState }) => (
					<TextareaInput
						{...field}
						label="Justification for this price change"
						required
						rows={5}
						maxLength={2000}
						placeholder={`Explain the reason, negotiation outcome and why the recommended supplier was chosen (min. ${MIN_JUSTIFICATION} characters)`}
						error={fieldState.error?.message}
						helperText={`${field.value.trim().length} / ${MIN_JUSTIFICATION} min`}
						isTooltip={false}
					/>
				)}
			/>
		</>
	);
};

const BasicDetailsTab = () => (
	<div className="flex flex-col gap-6">
		<RoutingFields />
		<RequestDetailsFields />
		<JustificationField />
	</div>
);

export default BasicDetailsTab;
