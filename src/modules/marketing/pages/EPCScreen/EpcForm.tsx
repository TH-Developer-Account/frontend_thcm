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
  const [selectedDepartment, setSelectedDepartment] = React.useState<
    string | null
  >(null);
  const [selectedVertical, setSelectedVertical] = React.useState<string | null>(
    null,
  );

  console.log({ data, values });

  const isViewer = userRole === "VIEWER";

  const handleDepartmentChange = (option: Option) => {
    setSelectedDepartment(option.value || null);
    handleChange("department", option?.label as string);
    setSelectedVertical(null);
  };

  const handleVerticalChange = (option: Option) => {
    setSelectedVertical(option.value || null);
    handleChange("vertical", option?.label as string);
  };

  const handleBudgetChange = (option: Option) => {
    console.log({ option });
    handleChange("budgetCode", option?.label as string);
    handleChange("budgetDescription", option?.description as string);
  };

  const filteredVerticals = React.useMemo(() => {
    if (!selectedDepartment) return [];

    return data?.vertical.filter(
      (v: Option) => v.department === selectedDepartment,
    );
  }, [selectedDepartment, data?.vertical]);

  console.log({ data });

  return (
    <React.Fragment>
      <div className="py-4 px-1 mt-2 text-left lg:text-sm text-xs ">
        <h2 className="text-left font-normal mb-2 text-gray-900 text-lg lg:text-xl ">
          Event Planning Calendar
        </h2>
        {/* <div className="ember-header">
					{" "}
					<div>
						<h2>Event Request Form</h2>
						<p>Complete all fields to submit your event request</p>{" "}
					</div>{" "}
					<span className="ember-badge">
						{isEditMode ? "Edit Request" : "New Request"}{" "}
					</span>{" "}
				</div> */}
        <form className="">
          <div className="grid md:grid-cols-5 grid-cols-1 gap-3 mb-4 items-end">
            <FormInput
              name="epfNo"
              label="EPF No"
              value={values.epfNo}
              disabled
              className=" text-black p-2"
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
              name="state"
              label="State"
              value={
                data?.branches?.find(
                  (opt: SingleValue<Option>) => opt?.label === values.zone,
                ) || null
              }
              options={data?.branches || []}
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
            <FormInput
              name="scale"
              label="Scale"
              placeholder="PAX SIZE <50"
              value={values.scale}
              onChange={(e) => handleChange("scale", e.target.value)}
              className="p-2"
            />
            <SelectInput
              name="department"
              label="Department"
              value={
                data?.departments?.find(
                  (opt: SingleValue<Option>) =>
                    opt?.label === values.department,
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
                  (opt: SingleValue<Option>) => opt?.value === selectedVertical,
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

            <SelectInput
              name="budgetCode"
              label="Budget Code"
              value={
                data?.budgetMasters?.find(
                  (opt: SingleValue<Option>) =>
                    opt?.label === values.budgetCode,
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
            <div className="col-span-2">
              <SelectInput
                name="eventName"
                label="Event Name"
                value={
                  data?.eventNames?.find(
                    (opt: SingleValue<Option>) =>
                      opt?.label === values.eventName,
                  ) || null
                }
                options={data?.eventNames || []}
                onChange={(v: SingleValue<Option>) =>
                  handleChange("eventName", v?.label || "")
                }
              />
            </div>
            <div className="col-span-2">
              <TextareaInput
                name="eventDescription"
                label="Event Description"
                value={values.eventDescription}
                onChange={(e) =>
                  handleChange("eventDescription", e.target.value)
                }
                className="p-2 col-span-2"
                minLength={100}
                rows={1}
              />
            </div>
          </div>
          {/*Event Description & Objective */}
          <div className="grid objective grid-cols-1  gap-4 items-end">
            <TextareaInput
              name="objective"
              label="Objective"
              placeholder=""
              value={values.objective}
              onChange={(e) => handleChange("objective", e.target.value)}
              minLength={100}
              rows={4}
            />
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
    </React.Fragment>
  );
};

export default EpcForm;
