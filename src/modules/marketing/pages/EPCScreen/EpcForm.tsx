import React from "react";
import type { SingleValue } from "react-select";
import { useMasterData } from "../../../../hooks/useMasterData";
import Button from "../../../../components/common/Button";
import FormInput from "../../../../components/FormElements/FormInput";
import SelectInput from "../../../../components/FormElements/SelectInput";
import TextareaInput from "../../../../components/FormElements/TextareaInput";
import { useEpcForm } from "./useEPCForm";
import type { EpcFormProps, Option } from "../../types";
import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { GitBranch } from "lucide-react";
import DatePickerInput from "../../../../components/common/DatePickerInput";
import { toDateRange } from "./api";
import { validateEpcForm } from "./validation";
// import UserAsyncSelect from "../../../../components/FormElements/AsyncSelect";

const formatDateOnly = (date?: Date) => {
	if (!date) return "";
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const EpcForm = ({ epcId }: EpcFormProps) => {
	const { values, isEditMode, handleChange, handleSave, handleReset } =
		useEpcForm({
			epcId,
		});

	const { data } = useMasterData();

	const errors = validateEpcForm(values);
	const [selectedDepartment, setSelectedDepartment] = React.useState<
		string | null
	>(null);
	const [selectedVertical, setSelectedVertical] = React.useState<string | null>(
		null,
	);

	const handleDepartmentChange = (option: Option) => {
		setSelectedDepartment(option.value || null);
		handleChange("department", option?.value as string);
		setSelectedVertical(null);
	};

	const handleVerticalChange = (option: Option) => {
		setSelectedVertical(option.value || null);
		handleChange("vertical", option?.value as string);
	};

	const handleBudgetChange = (option: Option) => {
		console.log({ option });
		handleChange("budget_master_id", option?.value as string);
		handleChange("budgetDescription", option?.description as string);
	};

	const filteredVerticals = React.useMemo(() => {
		if (!selectedDepartment) return [];

		return data?.vertical.filter(
			(v: Option) => v.department === selectedDepartment,
		);
	}, [selectedDepartment, data?.vertical]);
	console.log("Values", values);
	return (
		<React.Fragment>
			<PageRowSectionLayout
				header_children={
					<PageHeader
						headerText="Event Planning Calender"
						subtitleText="Manager your Event Planning Calendar (EPC) details here"
						Icon={GitBranch}
						badgeText="EPC Form"
					/>
				}
			>
				<div className="mt-2 px-4 py-4 text-left text-xs lg:text-sm">
					<form>
						<div className="mb-4 grid grid-cols-1 items-end gap-3 md:grid-cols-5">
							<FormInput
								name="epfNo"
								label="EPF No"
								value={values.epfNo}
								disabled
								className="p-2 text-black"
								helperText="EPF No. auto generated"
							/>

							<SelectInput
								name="region"
								label="Zone"
								value={
									data?.regions?.find(
										(opt: Option) => opt.value === values.region,
									) || null
								}
								options={data?.regions || []}
								onChange={(v: SingleValue<Option>) =>
									handleChange("region", v?.value || "")
								}
								required
								helperText="Select zone to auto populate branches"
								error={errors.region}
							/>

							<SelectInput
								name="branch"
								label="Branch"
								options={data?.branches || []}
								value={
									data?.branches?.find(
										(opt: Option) => opt.value === values.branch,
									) || null
								}
								onChange={(option: SingleValue<Option>) =>
									handleChange("branch", option?.value || "")
								}
								required
								helperText="Branches are filtered based on selected zone"
								error={errors.branch}
							/>

							<FormInput
								name="event_scale"
								label="Scale"
								type="number"
								placeholder="PAX SIZE <50"
								value={values.event_scale}
								onChange={(e) => handleChange("event_scale", e.target.value)}
								className="p-2"
								error={errors?.event_scale}
								helperText="Select scale"
							/>

							{/* <UserAsyncSelect
								label="Location"
								value={
									data?.eventNames?.find(
										(opt: Option) => opt.value === values.event_name,
									) || null
								}
								onChange={(v: SingleValue<Option>) =>
									handleChange("location", v?.value || "")
								}
							/> */}
							<FormInput
								name="location"
								label="Location"
								placeholder="Location"
								value={values.location}
								className="p-2"
								required
								helperText="Location of the event"
								error={errors.location}
							/>
							<SelectInput
								name="department"
								label="Department"
								value={
									data?.departments?.find(
										(opt: Option) => opt.value === values.department,
									) || null
								}
								options={data?.departments || []}
								onChange={(v: SingleValue<Option>) =>
									handleDepartmentChange((v as Option) || null)
								}
								helperText="Select department to auto populate verticals"
								error={errors.department}
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
									handleVerticalChange((v as Option) || null)
								}
								isDisabled={!selectedDepartment}
								helperText="Verticals are filtered based on selected department"
								error={errors.vertical}
							/>

							<DatePickerInput
								label="Event date"
								mode="range"
								value={toDateRange(
									values.event_from_date,
									values.event_to_date,
								)}
								onChange={(value) => {
									if (value && typeof value === "object" && "from" in value) {
										handleChange("event_from_date", formatDateOnly(value.from));
										handleChange("event_to_date", formatDateOnly(value.to));
									} else {
										handleChange("event_from_date", "");
										handleChange("event_to_date", "");
									}
								}}
								numberOfMonths={1}
								helperText="Date Range"
							/>
							<SelectInput
								name="budget_master_id"
								label="Budget Code"
								value={
									data?.budgetMasters?.find(
										(opt: Option) => opt.value === values.budget_master_id,
									) || null
								}
								options={data?.budgetMasters || []}
								onChange={(v: SingleValue<Option>) =>
									handleBudgetChange((v as Option) || null)
								}
								helperText="Select budget code to auto populate description"
								error={errors.budget_master_id}
							/>

							<FormInput
								name="budgetDescription"
								label="Budget Description"
								placeholder="Budget Description"
								value={values.budgetDescription}
								className="p-2"
								disabled
								helperText="Budget Description auto populated based on selected budget code"
								error={errors.budgetDescription}
							/>
						</div>

						<div className="flex w-full flex-col gap-4 md:flex-row md:items-stretch">
							<div className="flex w-full flex-col gap-2">
								<SelectInput
									name="event_name"
									label="Event Name"
									value={
										data?.eventNames?.find(
											(opt: Option) => opt.value === values.event_name,
										) || null
									}
									options={data?.eventNames || []}
									onChange={(v: SingleValue<Option>) =>
										handleChange("event_name", v?.value || "")
									}
									helperText="Select from past events or create new by typing and pressing enter"
									error={errors.event_name}
								/>

								<TextareaInput
									name="event_description"
									label="Event Description"
									value={values.event_description}
									onChange={(e) =>
										handleChange("event_description", e.target.value)
									}
									className="h-full overflow-hidden p-2"
									minLength={100}
									rows={3}
									// helperText="Provide a brief description of the event, including key highlights and unique aspects that set it apart from other events."
									error={errors.event_description}
								/>
							</div>

							<div className="w-full">
								<TextareaInput
									name="event_objective"
									label="Objective"
									placeholder=""
									value={values.event_objective}
									onChange={(e) =>
										handleChange("event_objective", e.target.value)
									}
									minLength={100}
									rows={6}
									className="h-full"
									error={errors.event_objective}
									// helperText="Clearly outline the primary goals and objectives of the event, such as brand awareness, lead generation, customer engagement, or product launch."
								/>
							</div>
						</div>

						<div className="mt-2 flex justify-end gap-3">
							<Button
								text="Reset"
								onClick={() => handleReset()}
								status="brand"
							/>

							<Button
								onClick={() => handleSave("SUBMITTED")}
								text={isEditMode ? "Update & Submit" : "Submit"}
								status="brand"
							/>
						</div>
					</form>
				</div>
			</PageRowSectionLayout>
		</React.Fragment>
	);
};

export default EpcForm;
