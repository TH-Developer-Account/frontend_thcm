import React from "react";
import Button from "../../../../components/common/Button";
import FormInput from "../../../../components/FormElements/FormInput";
import TextareaInput from "../../../../components/FormElements/TextareaInput";
import type { Profile } from "../types/profile.types";
import { ArrowRight } from "lucide-react";

interface Props {
  form: Profile;
  isEditing: boolean;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  setForm: React.Dispatch<React.SetStateAction<Profile>>;
  onCancel: () => void;
  onSubmit: () => void;
  onPermission: () => void;
}

const ProfileGeneralSection: React.FC<Props> = ({
  form,
  handleChange,
  onPermission,
  onCancel,
}) => {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl h-full">
      <FormInput
        name="name"
        label="Profile Name"
        value={form.name}
        onChange={handleChange}
        placeholder="e.g. Sales Manager, HR Executive"
        required
      />

      <TextareaInput
        name="description"
        label="Description"
        value={form.description}
        onChange={handleChange}
        placeholder="Briefly describe what this profile can access and do..."
      />

      <div className="flex justify-end gap-3 mt-6">
        <Button text="Cancel" variant="disable" onClick={onCancel} />

        <Button
          variant="primary"
          onClick={onPermission}
          Icon={ArrowRight}
          iconPosition="right"
          text="Continue to Permissions"
          disabled={!form.name.trim()}
        />
      </div>
    </div>
  );
};

export default ProfileGeneralSection;
