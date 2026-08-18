import React from "react";
import Button from "../../../../components/common/Button";
import FormInput from "../../../../components/forms/FormInput";
import TextareaInput from "../../../../components/forms/TextareaInput";
import type { Profile } from "../types/profile.types";
import { ArrowRight } from "lucide-react";
import Card from "../../../../components/common/Card";

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
	isEditing,
}) => {
	return (
		<Card title={isEditing ? `Editing: ${form?.name}` : "New User Profile"}>
			<FormInput
				name="name"
				label="Profile Name"
				value={form.name}
				onChange={handleChange}
				placeholder="e.g. Sales Manager, HR Executive"
				required
				className="mb-2"
			/>

			<TextareaInput
				name="description"
				label="Description"
				value={form.description}
				onChange={handleChange}
				placeholder="Briefly describe what this profile can access and do..."
			/>

			<div className="flex justify-end gap-3 mt-4">
				<Button
					text="Cancel"
					type="submit"
					appearance="cta"
					variant="outline"
					onClick={onCancel}
				/>

				<Button
					onClick={onPermission}
					Icon={ArrowRight}
					iconPosition="right"
					text="Continue to Permissions"
					disabled={!form.name.trim()}
					type="submit"
					appearance="cta"
					variant="brand"
				/>
			</div>
		</Card>
	);
};

export default ProfileGeneralSection;
