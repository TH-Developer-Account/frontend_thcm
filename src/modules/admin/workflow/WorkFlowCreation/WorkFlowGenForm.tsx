import { useNavigate, useParams } from "react-router-dom";
import type { SingleValue } from "react-select";
import { useAuth } from "../../../../context/Auth/useAuth";
import FormInput from "../../../../components/FormElements/FormInput";
import TextareaInput from "../../../../components/FormElements/TextareaInput";
import SelectInput from "../../../../components/FormElements/SelectInput";
import Radio from "../../../../components/FormElements/Radio";
import type { Option } from "../../../../components/FormElements/input.types";
import type { WorkflowBasics } from "../types/workflow.types";
import { formatApps } from "../constant/workflow.constant";

export type WorkflowGenProps = {
  basics: WorkflowBasics;
  onBasicChange: <K extends keyof WorkflowBasics>(
    key: K,
    value: WorkflowBasics[K],
  ) => void;
  onNext: () => void;
};

const WorkFlowGenForm = ({
  basics,
  onBasicChange,
  onNext,
}: WorkflowGenProps) => {
  const { permissions } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const apps = formatApps(permissions);
  return (
    <>
      <div className="workflow-create-field-row workflow-create-field-row-2">
        <FormInput
          label="Workflow name"
          value={basics.name}
          onChange={(e) => onBasicChange("name", e.target.value)}
          placeholder="e.g. Standard EPC Approval"
          helperText="Used to identify this workflow across modules"
          required
        />

        <SelectInput
          name="app"
          label="App"
          value={apps.find((opt: Option) => opt.value === basics?.app) || null}
          options={apps}
          onChange={(v: SingleValue<Option>) =>
            onBasicChange("app", v?.value || "")
          }
          helperText="For which App this workflow is being created"
        />
      </div>

      {id && (
        <div className="workflow-create-field-row workflow-create-field-row-2">
          <Radio
            name="status"
            groupLabel="Status"
            label1="Active"
            label2="Inactive"
            value1="true"
            value2="false"
            selectedValue={String(basics.isActive)}
            onChange={(value) => onBasicChange("isActive", value === "true")}
          />
        </div>
      )}

      <div className="workflow-create-field-row">
        <TextareaInput
          name="description"
          label="Description"
          className="workflow-create-textarea"
          rows={2}
          draggable="false"
          value={basics.description}
          onChange={(e) => onBasicChange("description", e.target.value)}
        />
      </div>

      <div className="mt-4 flex justify-between">
        <button
          type="button"
          className="workflow-create-secondary-btn"
          onClick={() => navigate("/admin/workflows")}
        >
          Back
        </button>
        <button
          type="button"
          className="workflow-create-primary-btn"
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default WorkFlowGenForm;
