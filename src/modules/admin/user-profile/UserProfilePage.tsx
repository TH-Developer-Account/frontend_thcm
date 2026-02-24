import { useState } from "react";
import { useTheme } from "../../../providers/ThemeContext";
import { INITIAL_PROFILES } from "./constant";
import ProfileList from "./ProfileList";
import { ProfileFormPage } from "./ProfileFormPage";
import type { Profile } from "./profile.types";
import { useToast } from "../../../context/Auth/AuthContext";

export const UserProfilePage = () => {
	const { theme } = useTheme();
	const { showToast } = useToast();

	const [view, setView] = useState<"list" | "create" | "edit">("list");
	const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
	const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

	const handleCreate = () => {
		setEditingProfile(null);
		setView("create");
	};

	const handleEdit = (profile: Profile) => {
		setEditingProfile(profile);
		setView("edit");
	};

	const handleDelete = (id: string) => {
		const profile = profiles.find((p) => p.id === id);
		setProfiles((prev) => prev.filter((p) => p.id !== id));

		showToast({
			type: "info",
			title: "Profile Deleted",
			description: `"${profile?.name}" deleted successfully`,
		});
	};

	const handleSave = (data: Profile) => {
		const isEditing = profiles.some((p) => p.id === data.id);

		setProfiles((prev) =>
			isEditing
				? prev.map((p) => (p.id === data.id ? data : p))
				: [data, ...prev],
		);

		showToast({
			type: "success",
			title: isEditing ? "Profile Updated" : "Profile Created",
			description: `"${data.name}" saved successfully`,
		});

		setView("list");
	};

	return (
		<div className="background-color 0.3s ease" data-theme={theme}>
			{view === "list" && (
				<ProfileList
					profiles={profiles}
					onCreateNew={handleCreate}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			)}

			{(view === "create" || view === "edit") && (
				<ProfileFormPage
					existingProfile={editingProfile}
					onSave={handleSave}
					onCancel={() => setView("list")}
				/>
			)}
		</div>
	);
};
