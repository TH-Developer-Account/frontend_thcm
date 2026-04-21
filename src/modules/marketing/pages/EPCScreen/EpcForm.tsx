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
            />
            {/* <SelectInput
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
            /> */}

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
              name="event_from_date"
              label="From"
              value={values.event_from_date}
              onChange={(e) => handleChange("event_from_date", e.target.value)}
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
            <div className="col-span-2">
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
            </div>
            <div className="col-span-2">
              <TextareaInput
                name="event_description"
                label="Event Description"
                value={values.event_description}
                onChange={(e) =>
                  handleChange("event_description", e.target.value)
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
              name="event_objective"
              label="Objective"
              placeholder=""
              value={values.event_objective}
              onChange={(e) => handleChange("event_objective", e.target.value)}
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
