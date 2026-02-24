import { useCallback, useMemo, useState } from "react";
import Button from "../../../components/common/Button";
import { Card } from "../../../components/common/Card";
import { ALL_USERS, MODULES } from "./constant";
import type { Profile } from "./profile.types";
import { ArrowLeft, ArrowRight } from "lucide-react";
import UserProfileSidebar from "./UserProfileSidebar";
import { Badge } from "../../../components/common/Badge";
import { SearchInput } from "../../../components/FormElements/SearchInput";
import { DEFAULT_PERMISSIONS, sections } from "./constant";
import ProfileGeneralSection from "./ProfileGeneralSection";
import ProfilePermissionsSection from "./ProfilePermissionsSection";

interface Props {
	existingProfile: Profile | null;
	onSave: (profile: Profile) => void;
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
	const [userSearch, setUserSearch] = useState("");

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = () => {
		const now = new Date().toISOString().split("T")[0];

		onSave({
			...form,
			id: form.id || `p-${Date.now()}`,
			createdAt: form.createdAt || now,
			updatedAt: now,
		});
	};
	const readCount = Object.values(form.permissions).filter(
		(p) => p.read,
	).length;
	const writeCount = Object.values(form.permissions).filter(
		(p) => p.write,
	).length;
	const toggleUser = useCallback((userId: string) => {
		setForm((p) => ({
			...p,
			assignedUsers: p.assignedUsers.includes(userId)
				? p.assignedUsers.filter((id) => id !== userId)
				: [...p.assignedUsers, userId],
		}));
	}, []);
	const filteredUsers = ALL_USERS.filter(
		(u) =>
			u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
			u.dept.toLowerCase().includes(userSearch.toLowerCase()) ||
			u.email.toLowerCase().includes(userSearch.toLowerCase()),
	);
	const modulesByCategory = useMemo(() => {
		const cats: Record<string, (typeof MODULES)[number][]> = {};

		MODULES.forEach((m) => {
			if (!cats[m.category]) {
				cats[m.category] = [];
			}
			cats[m.category].push(m);
		});

		return cats;
	}, []);

	return (
		<div className="max-w-5xl mx-auto h-full p-6">
			{/* Header */}
			<div className="flex items-center justify-between mb-8 animate-slide-up">
				<div className="flex items-center gap-4">
					<button
						onClick={onCancel}
						className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
					>
						<ArrowLeft />
					</button>
					<div>
						<p className="text-xs font-semibold text-amber-500 text-left uppercase tracking-[0.2em] font-['DM_Mono',monospace]">
							{isEditing ? "Edit Profile" : "Create Profile"}
						</p>
						<h2 className="text-4xl font-bold text-zinc-50 tracking-tight">
							{isEditing
								? `Editing: ${existingProfile.name}`
								: "New User Profile"}
						</h2>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
				{/* Sidebar */}
				<UserProfileSidebar form={form}>
					{sections.map((s) => (
						<button
							key={s.id}
							onClick={() => setActiveSection(s.id)}
							className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${activeSection === s.id ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-400 hover:text-zinc-800 hover:bg-gray-100"}`}
						>
							<span>{s.icon}</span>
							<span>{s.label}</span>
							{s.id === "users" && form.assignedUsers.length > 0 && (
								<span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-['DM_Mono',monospace]">
									{form.assignedUsers.length}
								</span>
							)}
							{s.id === "permissions" && readCount > 0 && (
								<span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-['DM_Mono',monospace]">
									{readCount}R/{writeCount}W
								</span>
							)}
						</button>
					))}
				</UserProfileSidebar>

				{/* Content */}
				<div
					className="lg:col-span-3 animate-slide-up"
					style={{ animationDelay: "0.05s" }}
				>
					{/* General */}
					{activeSection === "general" && (
						<ProfileGeneralSection
							form={form}
							isEditing={isEditing}
							handleChange={handleChange}
							setForm={setForm}
							onCancel={onCancel}
							onSubmit={handleSubmit}
						/>
					)}
					{/* Users */}
					{activeSection === "users" && (
						<Card className="p-6">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
									<span>👥</span> Assign Users
								</h2>
								<Badge variant="primary">
									{form.assignedUsers.length} selected
								</Badge>
							</div>
							<div className="relative mb-4">
								<SearchInput
									value={userSearch}
									onChange={setUserSearch}
									onClear={() => setUserSearch("")}
								/>
							</div>
							<div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
								{filteredUsers.map((user) => {
									const selected = form.assignedUsers.includes(user.id);
									return (
										<div
											key={user.id}
											onClick={() => toggleUser(user.id)}
											className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${selected ? "bg-amber-500/5 border-amber-500/30" : "bg-gray-100/40 border-zinc-800 hover:border-zinc-700 hover:bg-gray-200/70"}`}
										>
											<div
												className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${selected ? "bg-amber-500/20 text-amber-300" : "bg-gray-100 text-zinc-300"}`}
											>
												{user.avatar}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-semibold text-zinc-200 truncate">
													{user.name}
												</p>
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-xs text-zinc-500 truncate">
													{user.email
														? user.email
														: "example.@tatahitachi.co.in"}
												</p>
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-xs text-zinc-500 truncate">
													{user.dept}
												</p>
											</div>
											<div
												className={`w-5 h-5 rounded-md border flex items-center justify-center ${selected ? "bg-amber-500 border-amber-500" : "border-zinc-600"}`}
											>
												{selected && (
													<span className="text-zinc-900 text-xs font-bold">
														✓
													</span>
												)}
											</div>
										</div>
									);
								})}
							</div>
							<div className="flex justify-between mt-6">
								<Button
									variant="disable"
									size="sm"
									onClick={() => setActiveSection("general")}
									Icon={ArrowLeft}
								>
									Back
								</Button>
								<Button
									variant="primary"
									onClick={() => setActiveSection("permissions")}
									Icon={ArrowRight}
									iconPosition="right"
									text="Continue to Permissions"
								></Button>
							</div>
						</Card>
					)}

					{/* Permissions */}
					{activeSection === "permissions" && (
						<ProfilePermissionsSection
							form={form}
							setForm={setForm}
							modulesByCategory={modulesByCategory}
							readCount={readCount}
							writeCount={writeCount}
							isEditing={isEditing}
							onCancel={onCancel}
							onSubmit={handleSubmit}
							onBack={() => setActiveSection("users")}
						/>
					)}
				</div>
			</div>
		</div>
	);
};
