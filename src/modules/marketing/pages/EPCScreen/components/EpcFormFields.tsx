import React from "react";
import type { SingleValue } from "react-select";

import FormInput from "../../../../../components/FormElements/FormInput";
import SelectInput from "../../../../../components/FormElements/SelectInput";
import TextareaInput from "../../../../../components/FormElements/TextareaInput";
import DatePickerInput from "../../../../../components/common/DatePickerInput";

import { toDateRange } from "../api";
import { formatDateOnly } from "../../../../../utils/format";

import type { EpcFormValues, Option } from "../../../types";

type EpcFormFieldsProps = {
	values: EpcFormValues;
	errors: Partial<Record<keyof EpcFormValues, string>>;
	masters?: any;
	onChange: (name: keyof EpcFormValues, value: string) => void;
};

export default function EpcFormFields({
	values,
	errors,
	masters,
	onChange,
}: EpcFormFieldsProps) {
	const selectedDepartment = values.department || "";

	const filteredVerticals = React.useMemo(() => {
		if (!selectedDepartment) return [];

		return (
			masters?.vertical?.filter(
				(v: Option) => v.department === selectedDepartment,
			) || []
		);
	}, [selectedDepartment, masters?.vertical]);

	const handleDepartmentChange = (option: Option | null) => {
		const departmentId = option?.value || "";

		onChange("department", departmentId);
		onChange("vertical", "");
	};

	const handleVerticalChange = (option: Option | null) => {
		onChange("vertical", option?.value || "");
	};

	const handleBudgetChange = (option: Option | null) => {
		onChange("budget_master_id", option?.value || "");
		onChange("budgetDescription", option?.description || "");
	};
	const selectedBudget = React.useMemo(() => {
		return (
			masters?.budgetMasters?.find(
				(opt: Option) => opt.value === values.budget_master_id,
			) || null
		);
	}, [masters?.budgetMasters, values.budget_master_id]);

	const budgetDescription =
		values.budgetDescription || selectedBudget?.description || "";
	return (
		<div className="px-4 py-4 text-left text-xs lg:text-sm">
			<form>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
					<FormInput
						name="epfNo"
						label="EPC No"
						value={values.epfNo}
						disabled
						className="w-full p-2 text-black"
						helperText="EPC No. auto generated"
					/>

					<SelectInput
						name="region"
						label="Zone"
						value={
							masters?.regions?.find(
								(opt: Option) => opt.value === values.region,
							) || null
						}
						options={masters?.regions || []}
						onChange={(v: SingleValue<Option>) =>
							onChange("region", v?.value || "")
						}
						required
						helperText="Select zone to auto populate branches"
						error={errors.region}
						className="w-full"
					/>

					<SelectInput
						name="branch"
						label="Branch"
						options={masters?.branches || []}
						value={
							masters?.branches?.find(
								(opt: Option) => opt.value === values.branch,
							) || null
						}
						onChange={(option: SingleValue<Option>) =>
							onChange("branch", option?.value || "")
						}
						required
						helperText="Branches are filtered based on selected zone"
						error={errors.branch}
						className="w-full"
					/>

					<FormInput
						name="location"
						label="Location"
						placeholder="Location"
						value={values.location}
						onChange={(e) => onChange("location", e.target.value)}
						className="w-full p-2"
						required
						helperText="Location of the event"
						error={errors.location}
					/>

					<SelectInput
						name="department"
						label="Department"
						value={
							masters?.departments?.find(
								(opt: Option) => opt.value === values.department,
							) || null
						}
						options={masters?.departments || []}
						onChange={(v: SingleValue<Option>) =>
							handleDepartmentChange(v || null)
						}
						helperText="Select department to auto populate verticals"
						error={errors.department}
						className="w-full"
					/>

					<SelectInput
						name="vertical"
						label="Vertical"
						value={
							filteredVerticals.find(
								(opt: Option) => opt.value === values.vertical,
							) || null
						}
						options={filteredVerticals}
						onChange={(v: SingleValue<Option>) =>
							handleVerticalChange(v || null)
						}
						isDisabled={!selectedDepartment}
						helperText="Verticals are filtered based on selected department"
						error={errors.vertical}
						className="w-full"
					/>

					<DatePickerInput
						label="Event [From - To]"
						value={toDateRange(values.event_from_date, values.event_to_date)}
						onChange={(value) => {
							if (value && typeof value === "object" && "from" in value) {
								onChange("event_from_date", formatDateOnly(value.from));
								onChange("event_to_date", formatDateOnly(value.to));
							} else {
								onChange("event_from_date", "");
								onChange("event_to_date", "");
							}
						}}
						helperText="Select the start and end date of the event."
						error={errors.event_from_date || errors.event_to_date}
					/>

					<SelectInput
						name="budget_master_id"
						label="Budget Code"
						value={selectedBudget}
						options={masters?.budgetMasters || []}
						onChange={(v: SingleValue<Option>) => handleBudgetChange(v || null)}
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
						value={
							masters?.eventNames?.find(
								(opt: Option) => opt.value === values.event_name,
							) || null
						}
						options={masters?.eventNames || []}
						onChange={(v: SingleValue<Option>) =>
							onChange("event_name", v?.value || "")
						}
						helperText="Select from past events or create new by typing and pressing enter"
						error={errors.event_name}
						className="w-full"
					/>
				</div>

				<div className="grid grid-cols-1 gap-4 xl:grid-cols-2 mt-4">
					<div className="flex min-w-0 flex-col gap-4">
						<TextareaInput
							name="event_description"
							label="Event Description"
							value={values.event_description}
							onChange={(e) => onChange("event_description", e.target.value)}
							className="w-full p-2 h-full"
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
							value={values.event_objective}
							onChange={(e) => onChange("event_objective", e.target.value)}
							minLength={100}
							rows={4}
							className="w-full p-2 h-full"
							error={errors.event_objective}
							helperText="Mention the main goal of this event, such as brand awareness, lead generation, dealer engagement, product promotion, customer connect, or sales support."
						/>
					</div>
				</div>
			</form>
		</div>
	);
}
