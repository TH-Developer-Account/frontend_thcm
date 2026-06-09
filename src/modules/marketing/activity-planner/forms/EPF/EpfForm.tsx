import { RefreshCcw, Save, Send, X } from "lucide-react";

import Button from "../../../../../components/common/Button";
import Section from "../../components/common/Section";

import EpfItemsSection from "./EpfItemSection";
import { useEpfForm, type EpfFormProps } from "./useEpfForm";
import EpfFormFields from "./EpfFormFields";

export default function EpfForm(props: EpfFormProps) {
  const { onCancel } = props;

  const {
    values,
    errors,
    handleChange,
    handleReset,
    options,
    costItems,
    setCostItems,
    handleSubmit,
    eventCost,
    isEditMode,
    loading,
    submitting,
    previewRows,
    previewLoading,
    handlePreviewWorkflow,
  } = useEpfForm(props);

  const saveStatus = props.isClarifiedUpdate ? "DRAFT" : "SUBMITTED";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--color-text-muted)]">
        Loading EPF details...
      </div>
    );
  }

  return (
    <div className=" mx-auto h-auto w-full max-w-full">
      <Section
        title={
          isEditMode
            ? "Edit Event Proposition Form"
            : "Create Event Proposition Form"
        }
      >
        <EpfItemsSection
          items={costItems}
          onChange={setCostItems}
          options={options}
          isViewer={false}
        />

        <div className="mb-2">
          <EpfFormFields
            values={values}
            errors={errors}
            handleChange={handleChange}
            eventCost={eventCost}
            previewRows={previewRows}
            previewLoading={previewLoading}
            handlePreviewWorkflow={handlePreviewWorkflow}
          />
        </div>

        <div className="mt-4 flex flex-row items-center justify-end gap-2 py-2  px-4 border-t border-dashed border-zinc-300">
          {onCancel && (
            <Button
              type="button"
              text="Cancel"
              onClick={onCancel}
              className="text-red-600"
              size="sm"
              Icon={X}
              status="brand"
              iconColor="white"
              disabled={submitting}
            />
          )}

          <Button
            type="button"
            text="Reset"
            onClick={handleReset}
            Icon={RefreshCcw}
            size="sm"
            className="text-red-600"
            status="brand"
            iconColor="white"
            disabled={submitting}
          />

          <Button
            type="button"
            onClick={() => handleSubmit(saveStatus)}
            text={isEditMode ? "Update" : "Submit"}
            size="sm"
            className="text-red-600"
            status="brand"
            iconColor="white"
            Icon={isEditMode ? Save : Send}
            disabled={submitting}
          />
        </div>
      </Section>
    </div>
  );
}
