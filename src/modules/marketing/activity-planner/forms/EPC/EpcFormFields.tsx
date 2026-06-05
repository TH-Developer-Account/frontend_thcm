import React from "react";
import type { SingleValue } from "react-select";

import FormInput from "../../../../../components/FormElements/FormInput";
import SelectInput from "../../../../../components/FormElements/SelectInput";
import TextareaInput from "../../../../../components/FormElements/TextareaInput";
import DatePickerInput from "../../../../../components/common/DatePickerInput";
import PincodeAsyncSelect, {
	type PincodeOption,
} from "../../../../../components/FormElements/PincodeAsyncSelect";

import { formatDateOnly } from "../../../../../utils/format";
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

type EpcFormFieldsProps = {
	values: EpcFormValues;
	errors: Partial<Record<keyof EpcFormValues, string>>;
	masters?: EpcMasters;
	onChange: (name: keyof EpcFormValues, value: string) => void;
};

const toDateRange = (from?: string | null, to?: string | null) => {
	if (!from && !to) return undefined;

	return {
		from: from ? new Date(from) : undefined,
		to: to ? new Date(to) : undefined,
	};
};

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

export default function EpcFormFields({
	values,
	errors,
	masters,
	onChange,
}: EpcFormFieldsProps) {
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

	const selectedBudget = React.useMemo(() => {
		return findOption(masters?.budgetMasters ?? [], values.budget_master_id);
	}, [masters?.budgetMasters, values.budget_master_id]);

	const budgetDescription =
		values.budgetDescription ||
		selectedBudget?.description ||
		selectedBudget?.label ||
		"";

	const handleRegionChange = (option: SingleValue<Option>) => {
		const regionId = option?.value || "";

		onChange("region", regionId);
		onChange("branch", "");
	};

	const handleDepartmentChange = (option: SingleValue<Option>) => {
		const departmentId = option?.value || "";

		onChange("department", departmentId);
		onChange("vertical", "");
	};

	const handleBudgetChange = (option: SingleValue<Option>) => {
		onChange("budget_master_id", option?.value || "");
		onChange("budgetDescription", option?.description || option?.label || "");
	};

	const handleDateRangeChange = (value: unknown) => {
		if (value && typeof value === "object" && "from" in value) {
			const range = value as {
				from?: Date;
				to?: Date;
			};

			onChange("event_from_date", range.from ? formatDateOnly(range.from) : "");
			onChange("event_to_date", range.to ? formatDateOnly(range.to) : "");
			return;
		}

		onChange("event_from_date", "");
		onChange("event_to_date", "");
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
		[values.location, values.locationMeta],
	);

	const handlePincodeChange = (option: PincodeOption | null) => {
		if (!option) {
			onChange("location", "");
			onChange("locationMeta", null as any);
			return;
		}

		onChange("location", option.label);
		onChange("locationMeta", {
			pincode: option.pincode,
			officeName: option.officeName,
			district: option.district,
			stateName: option.stateName,
			latitude: option.latitude,
			longitude: option.longitude,
		} as any);
	};

	return (
		<div className="px-4 py-4 text-left text-xs lg:text-sm">
			<form>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
					<FormInput
						name="epfNo"
						label="EPC No"
						value={values.epfNo || values.proposal_number || ""}
						disabled
						className="w-full p-2 text-black"
						helperText="EPC No. auto generated"
					/>

					<SelectInput
						name="region"
						label="Zone"
						value={findOption(masters?.regions ?? [], values.region)}
						options={masters?.regions || []}
						onChange={handleRegionChange}
						required
						helperText="Select zone to auto populate branches"
						error={errors.region}
						className="w-full"
					/>

					<SelectInput
						name="branch"
						label="Branch"
						options={filteredBranches}
						value={findOption(filteredBranches, values.branch)}
						onChange={(option: SingleValue<Option>) =>
							onChange("branch", option?.value || "")
						}
						required
						helperText="Branches are filtered based on selected zone"
						error={errors.branch}
						className="w-full"
					/>

					<div className="flex flex-col gap-1">
						<PincodeAsyncSelect
							label="Location"
							value={selectedPincode}
							onChange={handlePincodeChange}
							error={errors.location}
							helperText="Search by pincode, office name, district, or state."
						/>
					</div>

					<SelectInput
						name="department"
						label="Department"
						value={findOption(masters?.departments ?? [], values.department)}
						options={masters?.departments || []}
						onChange={handleDepartmentChange}
						required
						helperText="Select department to auto populate verticals"
						error={errors.department}
						className="w-full"
					/>

					<SelectInput
						name="vertical"
						label="Vertical"
						value={findOption(filteredVerticals, values.vertical)}
						options={filteredVerticals}
						onChange={(option: SingleValue<Option>) =>
							onChange("vertical", option?.value || "")
						}
						isDisabled={!selectedDepartment}
						required
						helperText="Verticals are filtered based on selected department"
						error={errors.vertical}
						className="w-full"
					/>

					<DatePickerInput
						label="Event [From - To]"
						value={toDateRange(values.event_from_date, values.event_to_date)}
						onChange={handleDateRangeChange}
						helperText="Select the start and end date of the event."
						error={errors.event_from_date || errors.event_to_date}
					/>

					<SelectInput
						name="budget_master_id"
						label="Budget Code"
						value={selectedBudget}
						options={masters?.budgetMasters || []}
						onChange={handleBudgetChange}
						required
						helperText="Select budget code to auto populate description"
						error={errors.budget_master_id}
						className="w-full"
					/>

					<FormInput
						name="budgetDescription"
						label="Budget Description"
						placeholder="Budget Description"
						value={budgetDescription}
						className="w-full p-2"
						disabled
						helperText="Budget Description auto populated based on selected budget code"
						error={errors.budgetDescription}
					/>

					<SelectInput
						name="event_name"
						label="Event Name"
						value={findOption(masters?.eventNames ?? [], values.event_name)}
						options={masters?.eventNames || []}
						onChange={(option: SingleValue<Option>) =>
							onChange("event_name", option?.value || "")
						}
						required
						helperText="Select from past events or create new by typing and pressing enter"
						error={errors.event_name}
						className="w-full"
					/>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
					<div className="flex min-w-0 flex-col gap-4">
						<TextareaInput
							name="event_description"
							label="Event Description"
							value={values.event_description || ""}
							onChange={(event) =>
								onChange("event_description", event.target.value)
							}
							className="h-full w-full p-2"
							minLength={100}
							rows={4}
							helperText="Describe the purpose, audience, and expected outcome of this event."
							error={errors.event_description}
						/>
					</div>

					<div className="min-w-0">
						<TextareaInput
							name="event_objective"
							label="Objective"
							value={values.event_objective || ""}
							onChange={(event) =>
								onChange("event_objective", event.target.value)
							}
							minLength={100}
							rows={4}
							className="h-full w-full p-2"
							error={errors.event_objective}
							helperText="Mention the main goal of this event, such as brand awareness, lead generation, dealer engagement, product promotion, customer connect, or sales support."
						/>
					</div>
				</div>
			</form>
		</div>
	);
}
