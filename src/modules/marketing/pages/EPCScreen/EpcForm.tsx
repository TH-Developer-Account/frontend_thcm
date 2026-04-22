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

const EpcForm = ({ epcId, userRole }: EpcFormProps) => {
	const { values, isEditMode, handleChange, handleSave, handleReset } =
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

	const isViewer = userRole === "VIEWER";

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
				<div className="py-4 px-4 mt-2 text-left lg:text-sm text-xs">
					<form>
						<div className="grid md:grid-cols-5 grid-cols-1 gap-3 mb-4 items-end">
							<FormInput
								name="epfNo"
								label="EPF No"
								value={values.epfNo}
								disabled
								className=" text-black p-2"
							/>
							<SelectInput
								name="region"
								label="Zone"
								value={
									data?.regions?.find(
										(opt: SingleValue<Option>) => opt?.value === values.region,
									) || null
								}
								options={data?.regions || []}
								onChange={(v: SingleValue<Option>) =>
									handleChange("region", v?.value as string)
								}
								required
							/>
							<SelectInput
								name="branch"
								label="Branch"
								options={data?.branches}
								value={
									data?.branches?.find(
										(opt: SingleValue<Option>) => opt?.value === values.branch,
									) || null
								}
								onChange={(option: SingleValue<Option>) =>
									handleChange("branch", option?.value || "")
								}
								required
							/>
							<FormInput
								name="event_scale"
								label="Scale"
								type="number"
								placeholder="PAX SIZE <50"
								value={values.event_scale}
								onChange={(e) => handleChange("event_scale", e.target.value)}
								className="p-2"
							/>
							<SelectInput
								name="department"
								label="Department"
								value={
									data?.departments?.find(
										(opt: SingleValue<Option>) =>
											opt?.value === values.department,
									) || null
								}
								options={data?.departments || []}
								onChange={(v: SingleValue<Option>) =>
									handleDepartmentChange(v as Option)
								}
							/>
							<SelectInput
								name="vertical"
								label="Vertical"
								value={
									data?.vertical?.find(
										(opt: SingleValue<Option>) =>
											opt?.value === selectedVertical,
									) || null
								}
								options={filteredVerticals || []}
								onChange={(v: SingleValue<Option>) =>
									handleVerticalChange(v as Option)
								}
								isDisabled={!selectedDepartment}
							/>
							<FormInput
								type="date"
								name="event_from_date"
								label="From"
								value={values.event_from_date}
								onChange={(e) =>
									handleChange("event_from_date", e.target.value)
								}
								className="p-2"
							/>

							<FormInput
								type="date"
								name="event_to_date"
								label="To"
								value={values.event_to_date}
								onChange={(e) => handleChange("event_to_date", e.target.value)}
								className="p-2"
							/>

							<SelectInput
								name="budget_master_id"
								label="Budget Code"
								value={
									data?.budgetMasters?.find(
										(opt: SingleValue<Option>) =>
											opt?.value === values.budget_master_id,
									) || null
								}
								options={data?.budgetMasters || []}
								onChange={(v: SingleValue<Option>) =>
									handleBudgetChange(v as Option)
								}
							/>
							<FormInput
								name="budgetDescription"
								label="Budget Description"
								placeholder="Budget Description"
								value={values.budgetDescription}
								className="p-2"
								disabled
							/>
						</div>
						{/*Event Description & Objective */}
						<div className="flex flex-col gap-4 md:flex-row md:items-stretch w-full">
							<div className="flex w-full flex-col gap-2">
								<SelectInput
									name="event_name"
									label="Event Name"
									value={
										data?.eventNames?.find(
											(opt: SingleValue<Option>) =>
												opt?.value === values.event_name,
										) || null
									}
									options={data?.eventNames || []}
									onChange={(v: SingleValue<Option>) =>
										handleChange("event_name", v?.value || "")
									}
								/>
								<TextareaInput
									name="event_description"
									label="Event Description"
									value={values.event_description}
									onChange={(e) =>
										handleChange("event_description", e.target.value)
									}
									className="p-2 overflow-hidden h-full"
									minLength={100}
									rows={3}
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
								/>
							</div>
						</div>

						{/* Buttons */}
						{!isViewer && (
							<div className="mt-2 flex justify-end gap-3">
								<Button
									text="Reset"
									onClick={() => handleReset()}
									status="brand"
								/>
								<Button
									text="Save as Draft"
									onClick={() => handleSave("DRAFT")}
									status="brand"
								/>
								<Button
									onClick={() => handleSave("SUBMITTED")}
									text={isEditMode ? "Update & Submit" : "Submit"}
									status="brand"
								/>
							</div>
						)}
					</form>
				</div>
			</PageRowSectionLayout>
		</React.Fragment>
	);
};

export default EpcForm;
