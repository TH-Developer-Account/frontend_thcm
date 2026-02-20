import Button from "../../../../components/common/Button";
import FormInput from "../../../../components/FormElements/FormInput";
import SelectInput from "../../../../components/FormElements/SelectInput";
import TextareaInput from "../../../../components/FormElements/TextareaInput";
import { useEpcForm } from "./useEPCForm";
import type { EpcFormProps } from "../../types";

const EpcForm = ({ epcId, userRole }: EpcFormProps) => {
  const {
    values,
    // options,
    // regions,
    branches,
    isEditMode,
    handleChange,
    handleSave,
  } = useEpcForm({ epcId });

  const isViewer = userRole === "VIEWER";

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm text-left text-sm/4 lg:text-sm text-xs">
      <h2 className="text-left font-semibold mb-4 text-gray-900 text-lg lg:text-xl">
        Event Planning Calendar
      </h2>

      {/* EPF Section */}
      <div className="grid md:grid-cols-4 grid-cols-1 flex gap-4 items-end ">
        <FormInput
          name="epfNo"
          label="EPF No"
          value={values.epfNo}
          disabled={isEditMode}
          onChange={(e) => handleChange("epfNo", e.target.value)}
        />

        <FormInput
          name="poDocumentRefNo"
          label="PO/Document Ref No."
          value={values.poDocumentRefNo}
          // disabled
          onChange={(e) => handleChange("poDocumentRefNo", e.target.value)}
        />

        <SelectInput
          name="department"
          label="Department"
          // value={values.department}
          // options={options.departments || []}
          // disabled={isViewer}
          // onChange={(v: string) => handleChange("department", v)}
        />

        <SelectInput
          name="zone"
          label="Zone"
          // value={values.region}
          // options={regions || []}
          // disabled={isViewer}
          // onChange={(v: string) => handleChange("region", v)}
        />
      </div>

      {/* Dropdowns */}
      <div className="grid md:grid-cols-4 grid-cols-1 flex gap-4 items-end">
        <SelectInput
          name="branch"
          label="Branch"
          options={branches}
          value={branches.find((opt) => opt.value === values.branch) || null}
          onChange={(option) => handleChange("branch", option?.value || "")}
        />

        <SelectInput
          name="vertical"
          label="Vertical"
          // value={values.vertical}
          // options={options.verticals || []}
          // disabled={isViewer}
          // onChange={(v: string) => handleChange("vertical", v)}
        />
        <SelectInput
          name="budgetCode"
          label="Budget Code"
          // value={values.scale}
          // options={options.scales || []}
          // disabled={isViewer}
          // onChange={(v: string) => handleChange("scale", v)}
        />
        <SelectInput
          name="scale"
          label="Scale"
          // value={values.scale}
          // options={options.scales || []}
          // disabled={isViewer}
          // onChange={(v: string) => handleChange("scale", v)}
        />
      </div>

      {/* Event Name & Description */}
      <div className="grid md:grid-cols-2 grid-cols-1 flex gap-4 items-end">
        <FormInput
          name="eventName"
          label="Event Name"
          value={values.eventName}
          disabled={isViewer}
          onChange={(e) => handleChange("eventName", e.target.value)}
        />

        <FormInput
          name="eventDescription"
          label="Event Description"
          value={values.eventDescription}
          disabled={isViewer}
          onChange={(e) => handleChange("eventDescription", e.target.value)}
        />
      </div>

      {/* Date & Location */}
      <div className="grid md:grid-cols-2 grid-cols-1 flex gap-4 items-end">
        <div className="grid grid-cols-2 gap-2 flex items-center justify-center">
          <FormInput
            type="date"
            name="eventFrom"
            label="Date From"
            value={values.eventFrom}
            disabled={isViewer}
            onChange={(e) => handleChange("eventFrom", e.target.value)}
          />

          <FormInput
            type="date"
            name="eventTo"
            label="Date To"
            value={values.eventTo}
            disabled={isViewer}
            onChange={(e) => handleChange("eventTo", e.target.value)}
          />
        </div>

        <FormInput
          name="location"
          label="Location"
          value={values.location}
          disabled={isViewer}
          onChange={(e) => handleChange("location", e.target.value)}
        />
      </div>

      {/* Objective */}
      <div className="grid grid-cols-1">
        <TextareaInput
          name="objective"
          label="Objective"
          value={values.objective}
          disabled={isViewer}
          onChange={(e) => handleChange("objective", e.target.value)}
        />
      </div>

      {/* Buttons */}
      {!isViewer && (
        <div className="mt-6 flex justify-end gap-3">
          <Button text="Save as Draft" onClick={() => handleSave("DRAFT")} />
          <Button
            onClick={() => handleSave("SUBMITTED")}
            text={isEditMode ? "Update & Submit" : "Submit"}
          />
        </div>
      )}
    </div>
  );
};

export default EpcForm;
