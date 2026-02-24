import React from "react";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/FormElements/FormInput";
import SelectInput from "../../../components/FormElements/SelectInput";
import TextareaInput from "../../../components/FormElements/TextareaInput";
import { ROLE_OPTIONS } from "./constant";
import type { Profile } from "./profile.types";

interface Props {
	form: Profile;
	isEditing: boolean;
	handleChange: (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => void;
	setForm: React.Dispatch<React.SetStateAction<Profile>>;
	onCancel: () => void;
	onSubmit: () => void;
}

const ProfileGeneralSection: React.FC<Props> = ({
	form,
	isEditing,
	handleChange,
	setForm,
	onCancel,
	onSubmit,
}) => {
	return (
		<form
			className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl"
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit();
			}}
		>
			<h2 className="text-xl font-bold">
				{isEditing ? "Edit Profile" : "Create Profile"}
			</h2>

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

			<div className="flex items-center gap-4 justify-between text-left text-sm">
				<SelectInput
					label="Role"
					options={ROLE_OPTIONS}
					value={ROLE_OPTIONS.find((r) => r.value === form.role)}
					onChange={(option) =>
						setForm((prev) => ({
							...prev,
							role: option?.value as Profile["role"],
						}))
					}
				/>

				<SelectInput
					label="Status"
					options={[
						{ value: "active", label: "Active" },
						{ value: "inactive", label: "Inactive" },
					]}
					value={
						form.status === "active"
							? { value: "active", label: "Active" }
							: { value: "inactive", label: "Inactive" }
					}
					onChange={(option) =>
						setForm((prev) => ({
							...prev,
							status: option?.value as Profile["status"],
						}))
					}
				/>
			</div>

			<div className="flex justify-end gap-3 mt-6">
				<Button text="Cancel" variant="disable" onClick={onCancel} />
				<Button
					type="submit"
					text={isEditing ? "Update Profile" : "Create Profile"}
				/>
			</div>
		</form>
	);
};

export default ProfileGeneralSection;
