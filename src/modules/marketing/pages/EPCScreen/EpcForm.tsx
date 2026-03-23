import React from "react";
import type { SingleValue } from "react-select";
import { useMasterData } from "../../../../hooks/useMasterData";
import Button from "../../../../components/common/Button";
import FormInput from "../../../../components/FormElements/FormInput";
import SelectInput from "../../../../components/FormElements/SelectInput";
import TextareaInput from "../../../../components/FormElements/TextareaInput";
import { useEpcForm } from "./useEPCForm";
import type { EpcFormProps, Option } from "../../types";

const EpcForm = ({ epcId, userRole }: EpcFormProps) => {
	const { values, isEditMode, handleChange, handleSave, handleReset } =
		useEpcForm({
			epcId,
		});
	const { data } = useMasterData();

	console.log({ data });

	const isViewer = userRole === "VIEWER";

	return (
		<React.Fragment>
			<div className="p-6 mt-4 bg-white rounded-xl shadow-sm text-left lg:text-sm text-xs">
				<h2 className="text-left font-semibold mb-4 text-gray-900 text-lg lg:text-xl">
					Event Planning Calendar
				</h2>

				<div className="grid md:grid-cols-4 grid-cols-1  gap-4 items-end ">
					<FormInput
						name="epfNo"
						label="EPF No"
						value={values.epfNo}
						disabled
						className="p-2 text-black"
					/>

					<SelectInput
						name="department"
						label="Department"
						value={
							data?.departments?.find(
								(opt: SingleValue<Option>) => opt?.label === values.department,
							) || null
						}
						options={data?.departments || []}
						onChange={(v: SingleValue<Option>) =>
							handleChange("department", v?.label as string)
						}
					/>
					<SelectInput
						name="zone"
						label="Zone"
						value={
							data?.regions?.find(
								(opt: SingleValue<Option>) => opt?.label === values.zone,
							) || null
						}
						options={data?.regions || []}
						onChange={(v: SingleValue<Option>) =>
							handleChange("zone", v?.label as string)
						}
					/>
					<SelectInput
						name="branch"
						label="Branch"
						options={data?.branches}
						value={
							data?.branches?.find(
								(opt: SingleValue<Option>) => opt?.label === values.branch,
							) || null
						}
						onChange={(option: SingleValue<Option>) =>
							handleChange("branch", option?.label || "")
						}
					/>
				</div>
				<div className="grid md:grid-cols-4 grid-cols-1  gap-4 items-end">
					<SelectInput
						name="vertical"
						label="Vertical"
						// value={values.vertical}
						// options={options.verticals || []}
						// onChange={(v: string) => handleChange("vertical", v)}
					/>
					<SelectInput
						name="budgetCode"
						label="Budget Code"
						value={
							data?.budgetMasters?.find(
								(opt: SingleValue<Option>) => opt?.label === values.budgetCode,
							) || null
						}
						options={data?.budgetMasters || []}
						onChange={(v: SingleValue<Option>) =>
							handleChange("budgetCode", v?.label || "")
						}
					/>
					<FormInput
						name="budgetDescription"
						label="Budget Description"
						placeholder="Budget Description"
						value={values.budgetDescription}
						onChange={(e) => handleChange("budgetDescription", e.target.value)}
						className="p-2"
					/>
					<FormInput
						name="scale"
						label="Scale"
						placeholder="PAX SIZE <50"
						value={values.scale}
						onChange={(e) => handleChange("scale", e.target.value)}
						className="p-2"
					/>
				</div>

				<div className="grid md:grid-cols-2 grid-cols-1  gap-4 items-end">
					<SelectInput
						name="eventName"
						label="Event Name"
						value={
							data?.eventNames?.find(
								(opt: SingleValue<Option>) => opt?.label === values.eventName,
							) || null
						}
						options={data?.eventNames || []}
						onChange={(v: SingleValue<Option>) =>
							handleChange("eventName", v?.label || "")
						}
					/>

					<div className="grid grid-cols-2 gap-2  items-center justify-center">
						<FormInput
							type="date"
							name="eventFrom"
							label="From"
							value={values.eventFrom}
							onChange={(e) => handleChange("eventFrom", e.target.value)}
							className="p-2"
						/>

						<FormInput
							type="date"
							name="eventTo"
							label="To"
							value={values.eventTo}
							onChange={(e) => handleChange("eventTo", e.target.value)}
							className="p-2"
						/>
					</div>
				</div>

				<div className="grid md:grid-cols-2 grid-cols-1  gap-4 items-end">
					<TextareaInput
						name="eventDescription"
						label="Event Description"
						value={values.eventDescription}
						onChange={(e) => handleChange("eventDescription", e.target.value)}
						className="p-2"
						minLength={100}
						rows={2}
					/>
					<TextareaInput
						name="location"
						label="Location"
						value={values.location}
						onChange={(e) => handleChange("location", e.target.value)}
						className="p-2"
						minLength={100}
						rows={2}
					/>
				</div>

				{/* Objective */}
				<div className="grid grid-cols-1">
					<TextareaInput
						name="objective"
						label="Objective"
						value={values.objective}
						onChange={(e) => handleChange("objective", e.target.value)}
						minLength={100}
						rows={4}
					/>
				</div>

				{/* Buttons */}
				{!isViewer && (
					<div className="mt-6 flex justify-end gap-3">
						<Button
							text="Reset"
							onClick={() => handleReset()}
							status="brand"
							fullWidth
						/>
						<Button
							text="Save as Draft"
							onClick={() => handleSave("DRAFT")}
							status="brand"
							fullWidth
						/>
						<Button
							onClick={() => handleSave("SUBMITTED")}
							text={isEditMode ? "Update & Submit" : "Submit"}
							fullWidth
							status="brand"
						/>
					</div>
				)}
			</div>
		</React.Fragment>
	);
};

export default EpcForm;
