import React from "react";
import { ArrowRight } from "lucide-react";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import FormInput from "../../../../components/forms/FormInput";
import SelectInput from "../../../../components/forms/SelectInput";
import TextareaInput from "../../../../components/forms/TextareaInput";

import type { AppDefinition, ProfileFormValues } from "../types/profile.types";

type ProfileGeneralSectionProps = {
  form: ProfileFormValues;
  apps: AppDefinition[];
  isEditing: boolean;
  isLoadingApps: boolean;
  onFieldChange: <K extends keyof ProfileFormValues>(
    field: K,
    value: ProfileFormValues[K],
  ) => void;
  onCancel: () => void;
  onContinue: () => void;
};

const ProfileGeneralSection = ({
  form,
  apps,
  isEditing,
  isLoadingApps,
  onFieldChange,
  onCancel,
  onContinue,
}: ProfileGeneralSectionProps) => {
  const appOptions = apps.map((app) => ({
    label: app.appName,
    value: app.appKey,
  }));

  const handleTextChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const field = event.target.name as "name" | "description";
    onFieldChange(field, event.target.value);
  };

  const canContinue = Boolean(form.appKey) && Boolean(form.name.trim());

  return (
    <Card title={isEditing ? `Editing: ${form.name}` : "New User Profile"}>
      {/* A profile's app is fixed after creation: its assignments and
				permissions are only meaningful inside that app. */}
      <SelectInput
        name="appKey"
        label="Application"
        options={appOptions}
        value={
          appOptions.find((option) => option.value === form.appKey) ?? null
        }
        onChange={(option) => onFieldChange("appKey", option?.value ?? "")}
        isDisabled={isEditing}
        isLoading={isLoadingApps}
        placeholder="Select the application this profile grants access to"
        required
        className="mb-2"
      />

      <FormInput
        name="name"
        label="Profile Name"
        value={form.name}
        onChange={handleTextChange}
        placeholder="e.g. Sales Manager, HR Executive"
        required
        className="mb-2"
      />

      <TextareaInput
        name="description"
        label="Description"
        value={form.description}
        onChange={handleTextChange}
        placeholder="Briefly describe what this profile can access and do..."
      />

      <div className="flex justify-end gap-3 mt-4">
        <Button
          text="Cancel"
          type="button"
          appearance="cta"
          variant="outline"
          onClick={onCancel}
        />
        <Button
          onClick={onContinue}
          Icon={ArrowRight}
          iconPosition="right"
          text="Continue to Permissions"
          disabled={!canContinue}
          type="button"
          appearance="cta"
          variant="brand"
        />
      </div>
    </Card>
  );
};

export default ProfileGeneralSection;
