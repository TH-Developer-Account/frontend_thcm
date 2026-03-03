import { useMemo, useState } from "react";
import { WORKSPACE_APPS } from "./constant";
import type { Profile } from "./profile.types";
import type { WorkspacePayload } from "./profile.types";
import { transformProfileToDTO } from "./permission.transform";
import { ArrowLeft } from "lucide-react";
import { DEFAULT_PERMISSIONS } from "./constant";
import ProfileGeneralSection from "./ProfileGeneralSection";
import ProfilePermissionsSection from "./ProfilePermissionsSection";

interface Props {
	existingProfile: Profile | null;
	onSave: (payload: WorkspacePayload) => void;
	onCancel: () => void;
}

export const ProfileFormPage: React.FC<Props> = ({
	existingProfile,
	onSave,
	onCancel,
}) => {
	const isEditing = !!existingProfile;
	const [activeSection, setActiveSection] = useState("general");

	const [form, setForm] = useState<Profile>(
		existingProfile || {
			id: "",
			name: "",
			description: "",
			role: "viewer",
			status: "active",
			color: "#f97316",
			assignedUsers: [],
			permissions: DEFAULT_PERMISSIONS(),
			createdAt: "",
			updatedAt: "",
		},
	);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	// 🔥 FINAL SUBMIT → BUILD WORKSPACE PAYLOAD
	const handleSubmit = async () => {
		const profileDTO = transformProfileToDTO(form);

		const payload: WorkspacePayload = {
			workSpaceName: "Tata Hitachi Workspace",
			apps: WORKSPACE_APPS,
			profiles: [profileDTO],
		};

		await onSave(payload);
	};

	const readCount = Object.values(form.permissions).filter(
		(p) => p.read,
	).length;

	const writeCount = Object.values(form.permissions).filter(
		(p) => p.write,
	).length;

	const modulesByApp = useMemo(() => {
		const grouped: Record<
			string,
			{
				appKey: string;
				appName: string;
				modules: { key: string; name: string }[];
			}
		> = {};

		WORKSPACE_APPS.forEach((app) => {
			grouped[app.key] = {
				appKey: app.key,
				appName: app.name,
				modules: app.modules,
			};
		});

		return grouped;
	}, []);

	return (
		<div className="max-w-full mx-auto h-full p-4">
			{/* Header */}
			<div className="flex items-center justify-between mb-8">
				<div className="flex items-center gap-4">
					<button
						onClick={onCancel}
						className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
					>
						<ArrowLeft />
					</button>

					<h2 className="text-xl font-bold text-zinc-50">
						{isEditing
							? `Editing: ${existingProfile?.name}`
							: "New User Profile"}
					</h2>
				</div>
			</div>

			{/* Content */}
			<div className="mt-4">
				{activeSection === "general" && (
					<ProfileGeneralSection
						form={form}
						isEditing={isEditing}
						handleChange={handleChange}
						setForm={setForm}
						onCancel={onCancel}
						onSubmit={() => {}}
						onPermission={() => setActiveSection("permissions")}
					/>
				)}

				{activeSection === "permissions" && (
					<ProfilePermissionsSection
						form={form}
						setForm={setForm}
						modulesByApp={modulesByApp}
						readCount={readCount}
						writeCount={writeCount}
						isEditing={isEditing}
						onCancel={onCancel}
						onSubmit={handleSubmit}
						onBack={() => setActiveSection("general")}
					/>
				)}
			</div>
		</div>
	);
};
