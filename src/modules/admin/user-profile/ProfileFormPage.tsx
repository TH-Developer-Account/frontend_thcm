import { useState } from "react";
// import { WORKSPACE_APPS } from "./constant";
import type { Profile } from "./profile.types";
// import type { WorkspacePayload } from "./profile.types";
// import { transformProfileToDTO } from "./permission.transform";
import { ArrowLeft } from "lucide-react";
import { DEFAULT_PERMISSIONS } from "./constant";
import ProfileGeneralSection from "./ProfileGeneralSection";
import PermissionMatrix from "./PermissionMatrix";

interface Props {
	existingProfile: Profile | null;
	// onSave: (payload: WorkspacePayload) => void;
	onCancel: () => void;
}

export const ProfileFormPage: React.FC<Props> = ({
	existingProfile,
	// onSave,
	onCancel,
}) => {
	const isEditing = !!existingProfile;
	const [activeSection, setActiveSection] = useState("general");
	const [onSavePerm, setOnSavePerm] = useState();

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
	const handleSubmit = async (e) => {
		const data = e.target.value;
		console.log("Permissions:", e.target.value);

		// call API
		// saveProfilePermissions(data)
		setOnSavePerm(data);
	};
	type Action = "read" | "write";

	interface Module {
		key: string;
		name: string;
	}

	interface AppItem {
		key: string;
		name: string;
		modules: Module[];
	}

	type Permission = {
		read: boolean;
		write: boolean;
	};

	type PermState = Record<string, Record<string, Permission>>;

	const apps: AppItem[] = [
		{
			key: "MAP",
			name: "Marketing Activity Planner",
			modules: [
				{ key: "EPC", name: "Event Planning" },
				{ key: "CAM", name: "Campaign Manager" },
			],
		},
		{
			key: "CRM",
			name: "Customer Management",
			modules: [
				{ key: "LEAD", name: "Lead Management" },
				{ key: "CUST", name: "Customers" },
			],
		},
	];

	const [search, setSearch] = useState("");
	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

	const [permState, setPermState] = useState<PermState>({
		MAP: {
			EPC: { read: false, write: false },
			CAM: { read: false, write: false },
		},
		CRM: {
			LEAD: { read: false, write: false },
			CUST: { read: false, write: false },
		},
	});

	const filteredApps = apps.map((app) => ({
		...app,
		modules: app.modules.filter((m) =>
			m.name.toLowerCase().includes(search.toLowerCase()),
		),
	}));

	const togglePerm = (app: string, mod: string, action: Action) => {
		setPermState((prev) => ({
			...prev,
			[app]: {
				...prev[app],
				[mod]: {
					...prev[app][mod],
					[action]: !prev[app][mod][action],
				},
			},
		}));
	};

	const toggleModule = (app: string, mod: string) => {
		const current = permState[app][mod];
		const next = !(current.read && current.write);

		setPermState((prev) => ({
			...prev,
			[app]: {
				...prev[app],
				[mod]: {
					read: next,
					write: next,
				},
			},
		}));
	};

	const toggleAppAll = (app: string) => {
		const modules = permState[app];
		const next = !Object.values(modules).every((p) => p.read && p.write);

		const updated: any = {};
		Object.keys(modules).forEach((m) => {
			updated[m] = { read: next, write: next };
		});

		setPermState((prev) => ({
			...prev,
			[app]: updated,
		}));
	};

	const toggleAppAction = (app: string, action: Action) => {
		const modules = permState[app];

		const next = !Object.values(modules).every((p) => p[action]);

		const updated: any = {};
		Object.keys(modules).forEach((m) => {
			updated[m] = {
				...modules[m],
				[action]: next,
			};
		});

		setPermState((prev) => ({
			...prev,
			[app]: updated,
		}));
	};

	const colState = () => ({ all: false, some: false });
	const appState = (app: string) => {
		const modules = permState[app];
		const all = Object.values(modules).every((p) => p.read && p.write);
		const some = Object.values(modules).some((p) => p.read || p.write);
		return { all, some };
	};

	const appActionState = (app: string, action: Action) => {
		const modules = permState[app];
		const all = Object.values(modules).every((p) => p[action]);
		const some = Object.values(modules).some((p) => p[action]);
		return { all, some };
	};

	const modState = (app: string, mod: string) => {
		const p = permState[app][mod];
		const all = p.read && p.write;
		const some = p.read || p.write;
		return { all, some };
	};

	const toggleColumnAll = () => {};

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
					<PermissionMatrix
						filteredApps={filteredApps}
						collapsed={collapsed}
						permState={permState}
						search={search}
						setSearch={setSearch}
						setCollapsed={setCollapsed}
						colState={colState}
						appState={appState}
						appActionState={appActionState}
						modState={modState}
						toggleColumnAll={toggleColumnAll}
						toggleAppAll={toggleAppAll}
						toggleAppAction={toggleAppAction}
						toggleModule={toggleModule}
						togglePerm={togglePerm}
						onSavePermissions={handleSubmit}
					/>
				)}
			</div>
		</div>
	);
};
