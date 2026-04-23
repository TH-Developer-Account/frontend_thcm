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
import { ArrowBigLeft, ArrowLeft, GitBranch } from "lucide-react";
import DatePickerInput from "../../../../components/common/DatePickerInput";
import { toDateRange } from "./api";
// import UserAsyncSelect from "../../../../components/FormElements/AsyncSelect";

const formatDateOnly = (date?: Date) => {
	if (!date) return "";
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const EpcForm = ({ epcId }: EpcFormProps) => {
	const { values, errors, isEditMode, handleChange, handleSave, handleReset } =
		useEpcForm({
			epcId,
		});

	const { data } = useMasterData();

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
						Icon={ArrowLeft}
						badgeText="EPC Listing"
						path="/marketing/listing"
					/>
				}
			>
				<div className="mt-2 px-4 py-4 text-left text-xs lg:text-sm">
					<form>
						<div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
							<FormInput
								name="epfNo"
								label="EPF No"
								value={values.epfNo}
								disabled
								className="w-full p-2 text-black"
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
								className="w-full"
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
								className="w-full"
							/>

							<FormInput
								name="event_scale"
								label="Scale"
								type="number"
								placeholder="PAX SIZE <50"
								value={values.event_scale}
								onChange={(e) => handleChange("event_scale", e.target.value)}
								className="w-full p-2"
								error={errors?.event_scale}
								helperText="Select scale"
								isTooltip={true}
							/>

							<FormInput
								name="location"
								label="Location"
								placeholder="Location"
								value={values.location}
								onChange={(e) => handleChange("location", e.target.value)}
								className="w-full p-2"
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
									handleVerticalChange((v as Option) || null)
								}
								isDisabled={!selectedDepartment}
								helperText="Verticals are filtered based on selected department"
								error={errors.vertical}
								className="w-full"
							/>
							<DatePickerInput
								label="Event [From - To]"
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
								className="w-full"
								error={errors.event_from_date || errors.event_to_date}
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
								className="w-full"
							/>

							<FormInput
								name="budgetDescription"
								label="Budget Description"
								placeholder="Budget Description"
								value={values.budgetDescription}
								className="w-full p-2"
								disabled
								helperText="Budget Description auto populated based on selected budget code"
								error={errors.budgetDescription}
							/>
						</div>

						<div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
							<div className="flex min-w-0 flex-col gap-4">
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
									className="w-full"
								/>

								<TextareaInput
									name="event_description"
									label="Event Description"
									value={values.event_description}
									onChange={(e) =>
										handleChange("event_description", e.target.value)
									}
									className="w-full p-2 h-full"
									minLength={100}
									rows={4}
									error={errors.event_description}
								/>
							</div>

							<div className="min-w-0">
								<TextareaInput
									name="event_objective"
									label="Objective"
									value={values.event_objective}
									onChange={(e) =>
										handleChange("event_objective", e.target.value)
									}
									minLength={100}
									rows={9}
									className="w-full p-2 h-full"
									error={errors.event_objective}
								/>
							</div>
						</div>

						<div className="mt-4 flex flex-wrap justify-end gap-3">
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
