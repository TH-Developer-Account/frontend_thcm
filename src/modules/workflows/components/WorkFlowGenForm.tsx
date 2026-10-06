import type { SingleValue } from "react-select";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import Radio from "../../../components/forms/Radio";
import SelectInput from "../../../components/forms/SelectInput";
import TextareaInput from "../../../components/forms/TextareaInput";
import { useAuth } from "../../../context/Auth/useAuth";

import type {
  WorkflowBasics,
  WorkflowGenErrors,
  WorkflowSelectOption,
} from "../types/types";

export type WorkflowGenProps = {
  basics: WorkflowBasics;
  errors: WorkflowGenErrors;
  onBasicChange: <K extends keyof WorkflowBasics>(
    key: K,
    value: WorkflowBasics[K],
  ) => void;
  onClearError: (key: keyof WorkflowGenErrors) => void;
  // Optional: WorkflowCreateMain no longer passes them, so the page owns step
  // navigation. The buttons render only when a handler is supplied.
  onNext?: () => void;
  onBack?: () => void;
  appOptions?: WorkflowSelectOption[];
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
  appOptions = [],
  categoryOptions = [],
  showCategory = false,
  showStatus = false,
}: WorkflowGenProps) => {
  const { accessibleApps, canManageApp, isSuperAdmin } = useAuth();

  // A Super Admin manages every app, so eligibility must not depend on the
  // app being found in the session list. An app admin with no module grant
  // is found through accessibleApps, not permissions.
  const selectedAppKey = accessibleApps.find(
    (app) => app.appId === basics.app,
  )?.appKey;

  const isEligibleForAppScope = Boolean(
    basics.app &&
    (isSuperAdmin || (selectedAppKey && canManageApp(selectedAppKey))),
  );

  const handleAppChange = (option: SingleValue<WorkflowSelectOption>) => {
    onBasicChange("app", option?.value ?? "");
    onBasicChange("appDesc", option?.label ?? "");

    // Never carry APP scope from one app into another app.
    onBasicChange("scope", "USER");

    if (!showCategory) {
      onBasicChange("category", "");
      onClearError("category");
    }

    onClearError("app");
  };

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
          onChange={(event) => {
            onBasicChange("name", event.target.value);
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
            appOptions.find((option) => option.value === basics.app) ?? null
          }
          options={appOptions}
          onChange={handleAppChange}
          error={errors.app}
          helperText="For which app this workflow is being created"
          required
        />

        {showCategory && (
          <SelectInput
            name="category"
            label="Category"
            value={
              categoryOptions.find(
                (option) => option.value === basics.category,
              ) ?? null
            }
            options={categoryOptions}
            onChange={(option: SingleValue<WorkflowSelectOption>) => {
              onBasicChange("category", option?.value ?? "");
              onClearError("category");
            }}
            error={errors.category}
            helperText="For which category this workflow is being created"
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
            onChange={(value) => {
              onBasicChange("scope", value as WorkflowBasics["scope"]);
            }}
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
            onChange={(value) => {
              onBasicChange("isActive", value === "true");
            }}
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
          onChange={(event) => {
            onBasicChange("description", event.target.value);
            onClearError("description");
          }}
          error={errors.description}
        />
      </div>

      {onBack || onNext ? (
        <div className="workflow-form-actions">
          {onBack && (
            <Button
              type="button"
              direction="back"
              text="Back"
              appearance="standard"
              variant="outline"
              size="sm"
              onClick={onBack}
            />
          )}

          {onNext && (
            <Button
              type="button"
              direction="forward"
              text="Next"
              appearance="standard"
              size="sm"
              variant="brand"
              onClick={onNext}
            />
          )}
        </div>
      ) : null}
    </>
  );
};

export default WorkFlowGenForm;
