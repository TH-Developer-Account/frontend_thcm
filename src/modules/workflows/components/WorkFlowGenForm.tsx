import type { SingleValue } from "react-select";
import FormInput from "../../../components/forms/FormInput";
import TextareaInput from "../../../components/forms/TextareaInput";
import SelectInput from "../../../components/forms/SelectInput";
import Radio from "../../../components/forms/Radio";
import type {
  WorkflowBasics,
  WorkflowGenErrors,
  WorkflowSelectOption,
} from "../types/types";
import Button from "../../../components/common/Button";
import { useAuth } from "../../../context/Auth/useAuth";

export type WorkflowGenProps = {
  basics: WorkflowBasics;
  errors: WorkflowGenErrors;
  onBasicChange: <K extends keyof WorkflowBasics>(
    key: K,
    value: WorkflowBasics[K],
  ) => void;
  onClearError: (key: keyof WorkflowGenErrors) => void;
  onNext: () => void;
  onBack?: () => void;
  appOptions: WorkflowSelectOption[];
  categoryOptions?: WorkflowSelectOption[];
  showCategory?: boolean;
  showStatus?: boolean;
};

const WorkFlowGenForm = ({
  basics,
  errors,
  onBasicChange,
  onClearError,
  onNext,
  onBack,
  appOptions,
  categoryOptions = [],
  showCategory = false,
  showStatus = false,
}: WorkflowGenProps) => {
  const { permissions, canManageApp } = useAuth();

  // basics.app holds appId (see formatApps — appOptions' value is
  // item.appId), but canManageApp needs appKey, so resolve it via the
  // caller's own permissions rather than adding a second app lookup call.
  const selectedAppKey = permissions.find(
    (p) => p.appId === basics.app,
  )?.appKey;

  const isEligibleForAppScope = Boolean(
    selectedAppKey && canManageApp(selectedAppKey),
  );

  return (
    <>
      <div
        className={`workflow-create-field-row ${
          showCategory
            ? "workflow-create-field-row-3"
            : "workflow-create-field-row-2"
        }`}
      >
        <FormInput
          name="name"
          label="Workflow name"
          value={basics.name}
          onChange={(e) => {
            onBasicChange("name", e.target.value);
            onClearError("name");
          }}
          error={errors.name}
          placeholder="e.g. Standard Approval"
          helperText="Used to identify this workflow across modules"
          required
        />

        <SelectInput
          name="app"
          label="App"
          value={
            appOptions.find((option) => option.value === basics.app) || null
          }
          options={appOptions}
          onChange={(v: SingleValue<WorkflowSelectOption>) => {
            onBasicChange("app", v?.value || "");
            onBasicChange("appDesc", v?.label || "");

            // Selecting a different app can change eligibility — reset to
            // USER rather than carry an APP selection into an app the
            // caller might not administer.
            onBasicChange("scope", "USER");

            if (!showCategory) {
              onBasicChange("category", "");
              onClearError("category");
            }

            onClearError("app");
          }}
          error={errors.app}
          helperText="For which App this workflow is being created"
          required
        />

        {showCategory && (
          <SelectInput
            name="category"
            label="Category"
            value={
              categoryOptions.find(
                (option) => option.value === basics.category,
              ) || null
            }
            options={categoryOptions}
            onChange={(v: SingleValue<WorkflowSelectOption>) => {
              onBasicChange("category", v?.value || "");
              onClearError("category");
            }}
            error={errors.category}
            helperText="For which Category this workflow is being created"
            required
          />
        )}
      </div>

      {isEligibleForAppScope && (
        <div className="workflow-create-field-row workflow-create-field-row-2">
          <Radio
            name="scope"
            groupLabel="Who is this workflow for?"
            label1="Everyone in this app (admin template)"
            label2="Just me (personal template)"
            value1="APP"
            value2="USER"
            selectedValue={basics.scope ?? "USER"}
            onChange={(value) =>
              onBasicChange("scope", value as "APP" | "USER")
            }
          />
        </div>
      )}

      {showStatus && (
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
          onChange={(e) => {
            onBasicChange("description", e.target.value);
            onClearError("description");
          }}
          error={errors.description}
        />
      </div>

      <div className="workflow-form-actions">
        <Button
          type="button"
          direction="back"
          text="Back"
          appearance="standard"
          variant="outline"
          size="sm"
          onClick={onBack}
        />
        <Button
          onClick={onNext}
          type="button"
          direction="forward"
          text="Next"
          appearance="standard"
          size="sm"
          variant="brand"
        />
      </div>
    </>
  );
};

export default WorkFlowGenForm;
