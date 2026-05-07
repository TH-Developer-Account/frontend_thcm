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

const getStoredEpcInfo = () => {
	try {
		return JSON.parse(localStorage.getItem("epcInfo") || "{}");
	} catch {
		return {};
	}
};

const EpcForm = ({ epcId: propEpcId }: EpcFormProps) => {
	const epcInfo = React.useMemo(() => getStoredEpcInfo(), []);
	const storedEpcId = epcInfo?.epcId || "";
	const finalEpcId = propEpcId || storedEpcId || undefined;
	const { values, errors, isEditMode, handleChange, handleSave, handleReset } =
		useEpcForm({
			epcId: finalEpcId,
			// masters: data,
		});
	console.log("Final EPC ID", values);

	const { data } = useMasterData();

	const selectedDepartment = values.department || "";

	const handleDepartmentChange = (option: Option | null) => {
		const departmentId = option?.value || "";

		handleChange("department", departmentId);
		handleChange("vertical", "");
	};

	const handleVerticalChange = (option: Option | null) => {
		handleChange("vertical", option?.value || "");
	};

	const handleBudgetChange = (option: Option | null) => {
		handleChange("budget_master_id", option?.value || "");
		handleChange("budgetDescription", option?.description || "");
	};

	const filteredVerticals = React.useMemo(() => {
		if (!selectedDepartment) return [];

		return (
			data?.vertical?.filter(
				(v: Option) => v.department === selectedDepartment,
			) || []
		);
	}, [selectedDepartment, data?.vertical]);

	return (
		<React.Fragment>
			<PageRowSectionLayout
				header_children={
					<div className="flex flex-col sm:flex-row sm:justify-between items-end sm:items-center">
						<PageHeader
							headerText={
								isEditMode
									? "Update Event Planning Calendar"
									: "Event Planning Calendar"
							}
							subtitleText="Manage your Event Planning Calendar (EPC) details here"
							badgeProps={{
								text: "Back",
								direction: "back",
							}}
						/>

						<div className="mx-2 my-4 sm:mx-4 flex flex-row gap-2 items-end">
							<Button
								text="Reset"
								onClick={() => handleReset()}
								status="brand"
							/>

							<Button
								onClick={() => handleSave("SUBMITTED")}
								text={isEditMode ? "Update" : "Submit"}
								status="brand"
							/>
						</div>
					</div>
				}
			>
				<div className="mt-2 px-4 py-4 text-left text-xs lg:text-sm">
					<form>
						<div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
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
									handleBudgetChange(v || null)
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
						</div>

						<div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
							<div className="flex min-w-0 flex-col gap-4">
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
									rows={4}
									className="w-full p-2 h-full"
									error={errors.event_objective}
								/>
							</div>
						</div>
					</form>
				</div>
			</PageRowSectionLayout>
		</React.Fragment>
	);
};

export default EpcForm;
