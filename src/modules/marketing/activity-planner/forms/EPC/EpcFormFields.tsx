// forms/EPC/EpcFormFields.tsx
// EPC field grid shared by create, edit and view.
//
// mode="edit" (default) → interactive inputs, unchanged from before.
// mode="view"           → same layout, every field rendered read-only via the
//                         shared FormInput/SelectInput/TextareaInput `mode="view"`
//                         (ReadOnlyField), matching the vendor onboarding forms.
//
// DatePickerInput and PincodeAsyncSelect have no view mode, so in view mode
// they're swapped for ReadOnlyField directly.
import React from "react";
import type { SingleValue } from "react-select";

import FormInput from "../../../../../components/forms/FormInput";
import SelectInput from "../../../../../components/forms/SelectInput";
import TextareaInput from "../../../../../components/forms/TextareaInput";
import ReadOnlyField from "../../../../../components/forms/ReadOnlyField";
import type { FormFieldMode } from "../../../../../components/forms/input.types";
import DatePickerInput from "../../../../../components/common/DatePickerInput";
import PincodeAsyncSelect, {
	type PincodeOption,
} from "../../../../../components/forms/PincodeAsyncSelect";

import {
	formatDate,
	formatDateOnly,
	parseDateOnly,
	toDateRange,
} from "../../../../../utils/format";
import type { EpcFormValues } from "../../types/epc.types";

type Option = {
	value: string;
	label: string;
	code?: string;
	description?: string;
	department?: string;
	[key: string]: any;
};

type EpcMasters = {
	regions?: Option[];
	branches?: Option[];
	departments?: Option[];
	vertical?: Option[];
	eventNames?: Option[];
	budgetMasters?: Option[];
};

/**
 * Display labels used in view mode when the matching master option can't be
 * found (masters still loading, inactive master, branch filtered out, etc.).
 * Taken straight from the EPC detail response relations.
 */
export type EpcReadOnlyLabels = Partial<{
	region: string;
	branch: string;
	department: string;
	vertical: string;
	eventName: string;
	budgetCode: string;
	budgetDescription: string;
}>;

type EpcFormFieldsProps = {
	values: EpcFormValues;
	errors?: Partial<Record<keyof EpcFormValues, string>>;
	masters?: EpcMasters;
	/** Not needed in view mode. */
	onChange?: (name: keyof EpcFormValues, value: string) => void;
	lockOrgFields?: boolean;
	mode?: FormFieldMode;
	readOnlyLabels?: EpcReadOnlyLabels;
};

const EMPTY_ERRORS: Partial<Record<keyof EpcFormValues, string>> = {};

const findOption = (options: Option[] = [], value?: string | null) => {
	if (!value) return null;

	return (
		options.find(
			(option) =>
				option.value === value ||
				option.code === value ||
				option.label === value,
		) ?? null
	);
};

/** "2026-10-05" | "05-10-2026" | ISO → "05/10/2026 - 07/10/2026" */
const formatEventDateRange = (from?: string, to?: string): string => {
	const fromLabel = formatDate(parseDateOnly(from));
	const toLabel = formatDate(parseDateOnly(to));

	if (fromLabel && toLabel) return `${fromLabel} - ${toLabel}`;
	return fromLabel || toLabel || "";
};

export default function EpcFormFields({
	values,
	errors = EMPTY_ERRORS,
	masters,
	onChange,
	lockOrgFields = false,
	mode = "edit",
	readOnlyLabels,
}: EpcFormFieldsProps) {
	const isView = mode === "view";

	// Helper texts describe how to fill a field — irrelevant when read-only.
	const helper = (text: string) => (isView ? undefined : text);
	const emit = (name: keyof EpcFormValues, value: string) =>
		onChange?.(name, value);

	const selectedDepartment = values.department || "";

	const filteredBranches = React.useMemo(() => {
		const branches = masters?.branches ?? [];

		if (!values.region) return branches;

		return branches.filter((branch) => {
			const regionValue =
				branch.regionId ??
				branch.region_id ??
				branch.region ??
				branch.zoneId ??
				branch.zone_id;

			if (!regionValue) return true;

			return regionValue === values.region;
		});
	}, [masters?.branches, values.region]);

	const filteredVerticals = React.useMemo(() => {
		const verticals = masters?.vertical ?? [];

		if (!selectedDepartment) return verticals;

		return verticals.filter((vertical) => {
			const departmentValue =
				vertical.department ?? vertical.departmentId ?? vertical.department_id;

			if (!departmentValue) return true;

			return departmentValue === selectedDepartment;
		});
	}, [selectedDepartment, masters?.vertical]);

	const budgetCodeOptions = React.useMemo<Option[]>(() => {
		return (masters?.budgetMasters ?? []).map((budget) => ({
			...budget,
			value: budget.value,
			label: budget.code || budget.label || budget.value,
		}));
	}, [masters?.budgetMasters]);

	const budgetDescriptionOptions = React.useMemo<Option[]>(() => {
		return (masters?.budgetMasters ?? []).map((budget) => ({
			...budget,
			value: budget.value,
			label: budget.description || budget.label || budget.code || budget.value,
		}));
	}, [masters?.budgetMasters]);

	const selectedBudgetCode = React.useMemo(() => {
		return findOption(budgetCodeOptions, values.budget_master_id);
	}, [budgetCodeOptions, values.budget_master_id]);

	const selectedBudgetDescription = React.useMemo(() => {
		return findOption(budgetDescriptionOptions, values.budget_master_id);
	}, [budgetDescriptionOptions, values.budget_master_id]);

	const handleRegionChange = (option: SingleValue<Option>) => {
		const regionId = option?.value || "";

		emit("region", regionId);
		emit("branch", "");
	};

	const handleDepartmentChange = (option: SingleValue<Option>) => {
		const departmentId = option?.value || "";

		emit("department", departmentId);
		emit("vertical", "");
	};

	const handleBudgetChange = (option: SingleValue<Option>) => {
		const budgetMasterId = option?.value || "";

		const selectedMaster = findOption(
			masters?.budgetMasters ?? [],
			budgetMasterId,
		);

		emit("budget_master_id", budgetMasterId);
		emit(
			"budgetDescription",
			selectedMaster?.description || selectedMaster?.label || "",
		);
	};

	const handleDateRangeChange = (value: unknown) => {
		if (value && typeof value === "object" && "from" in value) {
			const range = value as {
				from?: Date;
				to?: Date;
			};

			emit("event_from_date", range.from ? formatDateOnly(range.from) : "");
			emit("event_to_date", range.to ? formatDateOnly(range.to) : "");
			return;
		}

		emit("event_from_date", "");
		emit("event_to_date", "");
	};

	const buildPincodeOptionFromValues = (
		values: EpcFormValues,
	): PincodeOption | null => {
		if (!values.location || !values.locationMeta) return null;

		return {
			value: values.locationMeta.pincode,
			label: values.location,
			pincode: values.locationMeta.pincode,
			officeName: values.locationMeta.officeName,
			district: values.locationMeta.district,
			stateName: values.locationMeta.stateName,
			latitude: values.locationMeta.latitude ?? null,
			longitude: values.locationMeta.longitude ?? null,
		};
	};

	const selectedPincode = React.useMemo(
		() => buildPincodeOptionFromValues(values),
		[values],
	);

	const handlePincodeChange = (option: PincodeOption | null) => {
		if (!option) {
			emit("location", "");
			onChange?.("locationMeta", null as any);
			return;
		}

		emit("location", option.label);
		onChange?.("locationMeta", {
			pincode: option.pincode,
			officeName: option.officeName,
			district: option.district,
			stateName: option.stateName,
			latitude: option.latitude,
			longitude: option.longitude,
		} as any);
	};

	return (
		<form noValidate onSubmit={(event) => event.preventDefault()}>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
				<FormInput
					mode={mode}
					name="epfNo"
					label="EPC No"
					value={values.epfNo || values.proposal_number || ""}
					disabled
					className="w-full p-2 text-black"
					helperText={helper("EPC No. auto generated")}
				/>

				<SelectInput
					mode={mode}
					name="region"
					label="Zone"
					value={findOption(masters?.regions ?? [], values.region)}
					readOnlyValue={readOnlyLabels?.region}
					options={masters?.regions || []}
					onChange={handleRegionChange}
					isDisabled={lockOrgFields}
					required
					helperText={helper(
						lockOrgFields
							? "Zone cannot be changed after EPC creation"
							: "Select zone to auto populate branches",
					)}
					error={errors.region}
					className="w-full"
				/>

				<SelectInput
					mode={mode}
					name="branch"
					label="Branch"
					options={filteredBranches}
					value={findOption(filteredBranches, values.branch)}
					readOnlyValue={readOnlyLabels?.branch}
					onChange={(option: SingleValue<Option>) =>
						emit("branch", option?.value || "")
					}
					isDisabled={lockOrgFields}
					required
					helperText={helper(
						lockOrgFields
							? "Branch cannot be changed after EPC creation"
							: "Branches are filtered based on selected zone",
					)}
					error={errors.branch}
					className="w-full"
				/>

				<div className="flex flex-col gap-1">
					{isView ? (
						<ReadOnlyField label="Location" value={values.location} />
					) : (
						<PincodeAsyncSelect
							label="Location"
							value={selectedPincode}
							onChange={handlePincodeChange}
							error={errors.location}
							helperText="Search by pincode, office name, district, or state."
						/>
					)}
				</div>

				<SelectInput
					mode={mode}
					name="department"
					label="Department"
					value={findOption(masters?.departments ?? [], values.department)}
					readOnlyValue={readOnlyLabels?.department}
					options={masters?.departments || []}
					onChange={handleDepartmentChange}
					isDisabled={lockOrgFields}
					required
					helperText={helper(
						lockOrgFields
							? "Department cannot be changed after EPC creation"
							: "Select department to auto populate verticals",
					)}
					error={errors.department}
					className="w-full"
				/>

				<SelectInput
					mode={mode}
					name="vertical"
					label="Vertical"
					value={findOption(filteredVerticals, values.vertical)}
					readOnlyValue={readOnlyLabels?.vertical}
					options={filteredVerticals}
					onChange={(option: SingleValue<Option>) =>
						emit("vertical", option?.value || "")
					}
					isDisabled={lockOrgFields || !selectedDepartment}
					required
					helperText={helper(
						lockOrgFields
							? "Vertical cannot be changed after EPC creation"
							: "Verticals are filtered based on selected department",
					)}
					error={errors.vertical}
					className="w-full"
				/>

				{isView ? (
					<ReadOnlyField
						label="Event [From - To]"
						value={formatEventDateRange(
							values.event_from_date,
							values.event_to_date,
						)}
						required
					/>
				) : (
					<DatePickerInput
						label="Event [From - To]"
						value={toDateRange(values.event_from_date, values.event_to_date)}
						onChange={handleDateRangeChange}
						helperText="Select the start and end date of the event."
						error={errors.event_from_date || errors.event_to_date}
						disablePast
					/>
				)}

				<SelectInput
					mode={mode}
					name="budget_master_id"
					label="Budget Code"
					value={selectedBudgetCode}
					readOnlyValue={readOnlyLabels?.budgetCode}
					options={budgetCodeOptions}
					onChange={handleBudgetChange}
					required
					helperText={helper(
						"Select a budget code to populate its description",
					)}
					error={errors.budget_master_id}
					className="w-full"
				/>

				<SelectInput
					mode={mode}
					name="budgetDescription"
					label="Budget Description"
					value={selectedBudgetDescription}
					readOnlyValue={readOnlyLabels?.budgetDescription}
					options={budgetDescriptionOptions}
					onChange={handleBudgetChange}
					required
					helperText={helper(
						"Select a description to populate its budget code",
					)}
					error={errors.budgetDescription}
					className="w-full"
				/>

				<SelectInput
					mode={mode}
					name="event_name"
					label="Event Name"
					value={findOption(masters?.eventNames ?? [], values.event_name)}
					readOnlyValue={readOnlyLabels?.eventName}
					options={masters?.eventNames || []}
					onChange={(option: SingleValue<Option>) =>
						emit("event_name", option?.value || "")
					}
					required
					helperText={helper(
						"Select from past events or create new by typing and pressing enter",
					)}
					error={errors.event_name}
					className="w-full"
				/>
			</div>

			<div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
				<div className="flex min-w-0 flex-col gap-4">
					<TextareaInput
						mode={mode}
						name="event_description"
						label="Event Description"
						value={values.event_description || ""}
						onChange={(event) => emit("event_description", event.target.value)}
						className="h-full w-full p-2"
						minLength={100}
						rows={4}
						helperText={helper(
							"Describe the purpose, audience, and expected outcome of this event.",
						)}
						error={errors.event_description}
					/>
				</div>

				<div className="min-w-0">
					<TextareaInput
						mode={mode}
						name="event_objective"
						label="Objective"
						value={values.event_objective || ""}
						onChange={(event) => emit("event_objective", event.target.value)}
						minLength={100}
						rows={4}
						className="h-full w-full p-2"
						error={errors.event_objective}
						helperText={helper(
							"Mention the main goal of this event, such as brand awareness, lead generation, dealer engagement, product promotion, customer connect, or sales support.",
						)}
					/>
				</div>
			</div>
		</form>
	);
}
