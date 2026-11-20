// tabs/BasicDetailsTab.tsx — wizard step 1.
// category · plant · conditions · material type · effect · reason · initiation date ·
// models · price type · pricing condition · justification.
// Applicable plants is hidden on this step. These fields decide which approval
// workflow runs, so they come first.
// Plain content: the parent card in CppRequestCreatePage provides the surface.
import { useEffect, useMemo } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { Alert } from "../../../components/common/Alert";
import Checkbox from "../../../components/forms/Checkbox";
import Radio from "../../../components/forms/Radio";
import ReadOnlyField from "../../../components/forms/ReadOnlyField";
import TextareaInput from "../../../components/forms/TextareaInput";
import {
	RhfInput,
	RhfMultiSelect,
	RhfSelect,
	toOptions,
	useCppReadOnly,
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

const EFFECT_LABEL = "Commodity price adjustment – effect on";
const JUSTIFICATION_HELP =
	"Explains the change. Approvers read it before deciding.";

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
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<RhfSelect
				name="category"
				label="Category"
				required
				placeholder="Select category"
				options={CPP_CATEGORY_OPTIONS}
				helperText="Sets the material group and which conditions you can pick."
			/>
			<RhfSelect
				name="plant"
				label="Plant"
				required
				placeholder="Select plant"
				options={CPP_PLANT_OPTIONS}
				helperText="Spares follow the spares flow. DWD and KGP follow the plant flow."
			/>
			<RhfSelect
				name="condition"
				label="Conditions"
				required
				placeholder={category ? "Select condition" : "Select category first"}
				isDisabled={!category}
				options={conditionOptions}
				helperText="Picks the approval sheet and the bands that route approval."
			/>
		</div>
	);
};

const RequestDetailsFields = () => {
	const { control, setValue } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const reason = useWatch({ control, name: "reason" });
	const typeError = useFieldError("materialType");
	const isNewPart = reason === NEW_PART_REASON;

	// Effect (Q/C/D) applies to existing materials only.
	useEffect(() => {
		if (isNewPart) setValue("effects", []);
	}, [isNewPart, setValue]);

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<Controller
				name="materialType"
				control={control}
				render={({ field }) =>
					readOnly ? (
						<ReadOnlyField label="Material type" value={field.value} />
					) : (
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
							helperText="Set from category: Indirect for indirect categories, otherwise Direct."
							isTooltip={false}
						/>
					)
				}
			/>

			<Controller
				name="effects"
				control={control}
				render={({ field }) => {
					if (readOnly) {
						return (
							<ReadOnlyField
								label={EFFECT_LABEL}
								value={field.value.join(", ") || undefined}
								className="lg:col-span-2"
							/>
						);
					}
					return (
						<div className="lg:col-span-2">
							<span className="form-label">{EFFECT_LABEL}</span>
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
							<p className="form-helper-text">
								{isNewPart
									? "Turned off for new parts: effect applies to existing materials only."
									: "Tick the impact(s) this price change has. Existing materials only."}
							</p>
						</div>
					);
				}}
			/>

			<RhfInput
				name="initiationDate"
				label="CPP initiation date"
				type="date"
				disabled
				helperText="Date the CPP was initiated. Set by the system."
				isTooltip={false}
			/>

			<RhfSelect
				name="reason"
				label="Reason for price update"
				required
				placeholder="Select reason"
				options={toOptions(CPP_REASONS)}
				className="lg:col-span-2"
				helperText="Classifies the change. 'New part' turns off Effect."
			/>
			<RhfMultiSelect
				name="workflow.models"
				label="Models"
				required
				placeholder="Select models"
				options={toOptions(CPP_MODELS)}
				className="lg:col-span-2"
				helperText="Models this price change applies to."
			/>

			<RhfSelect
				name="priceType"
				label="Price type"
				required
				placeholder="Select price type"
				options={CPP_PRICE_TYPE_OPTIONS}
				helperText="Standard or subcontracting (MASOP) price basis."
			/>
			<RhfSelect
				name="workflow.pricingCondition"
				label="Pricing condition"
				required
				placeholder="Select pricing condition"
				options={CPP_PRICING_CONDITIONS}
				helperText="Regular, one-time, amortised or provisional. PB50 adds the Amortisation step."
			/>
		</div>
	);
};

const JustificationField = () => {
	const { control } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();

	return (
		<Controller
			name="justification"
			control={control}
			render={({ field, fieldState }) => {
				const length = field.value.trim().length;
				return (
					<TextareaInput
						{...field}
						label="Justification for this price change"
						required
						rows={10}
						maxLength={2000}
						mode={readOnly ? "view" : "edit"}
						placeholder={`Explain the reason, negotiation outcome and why the recommended supplier was chosen (min. ${MIN_JUSTIFICATION} characters)`}
						error={readOnly ? undefined : fieldState.error?.message}
						helperText={
							readOnly
								? undefined
								: `${length} / ${MIN_JUSTIFICATION} min. ${JUSTIFICATION_HELP}`
						}
						isTooltip={false}
					/>
				);
			}}
		/>
	);
};

const BasicDetailsTab = () => (
	<div className="flex flex-col gap-6">
		<Alert
			type="banner"
			variant="info"
			title="These inputs decide the workflow"
			description="Category, condition, reason, models, price type and pricing condition set the approval route and the steps that follow. Check them before moving on."
		/>
		<RoutingFields />
		<RequestDetailsFields />
		<JustificationField />
	</div>
);

export default BasicDetailsTab;
