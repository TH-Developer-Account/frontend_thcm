import React from "react";
import { Card } from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import PermissionToggleRow from "./PermissionToggleRow";
import { MODULES } from "./constant";
import { PROFILE_PERMISSION_TEXT } from "./constant";
import { ArrowLeft, EditIcon, PlusIcon } from "lucide-react";
import type { Profile } from "./profile.types";

interface Props {
	form: Profile;
	setForm: React.Dispatch<React.SetStateAction<Profile>>;
	modulesByCategory: Record<string, (typeof MODULES)[number][]>;
	readCount: number;
	writeCount: number;
	isEditing: boolean;
	onCancel: () => void;
	onSubmit: () => void;
	onBack: () => void;
}

const Divider = ({ label }: { label: string }) => (
	<div className="flex items-center gap-3 my-1">
		<div className="flex-1 h-px bg-zinc-800" />
		<span className="text-xs text-zinc-600 font-medium uppercase tracking-widest whitespace-nowrap">
			{label}
		</span>
		<div className="flex-1 h-px bg-zinc-800" />
	</div>
);

const ProfilePermissionsSection: React.FC<Props> = ({
	form,
	setForm,
	modulesByCategory,
	readCount,
	writeCount,
	isEditing,
	onCancel,
	onSubmit,
	onBack,
}) => {
	const handleSubmitToggle = () => {
		const now = new Date().toISOString().split("T")[0];
		console.log("Toggled all permissions on", now);
	};
	return (
		<Card className="p-6">
			{/* Header */}
			<div className="flex items-center justify-between mb-2">
				<h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
					<span>🔐</span> {PROFILE_PERMISSION_TEXT.title}
				</h2>

				<div className="flex gap-1.5 p-1 bg-gray-100 rounded-lg border border-zinc-700">
					<span className="text-xs text-zinc-500 self-center ml-1">
						{PROFILE_PERMISSION_TEXT.quickLabel}
					</span>

					{/* Quick Buttons — wire later if needed */}
					{Object.entries(PROFILE_PERMISSION_TEXT.quickActions).map(
						([key, label]) => (
							<button
								key={key}
								type="button"
								onClick={handleSubmitToggle}
								className="text-xs cursor-pointer px-2 py-1 rounded transition-colors font-medium"
							>
								{label}
							</button>
						),
					)}
				</div>
			</div>

			{/* Counters */}
			<div className="flex items-center gap-4 mb-5 p-3 bg-gray-100/40 rounded-lg border border-zinc-800">
				<div className="flex items-center gap-2">
					<div className="w-2 h-2 rounded-full bg-sky-400" />
					<span className="text-xs text-zinc-400">
						{PROFILE_PERMISSION_TEXT.counters.read}:{" "}
						<span className="text-sky-400 font-semibold font-['DM_Mono',monospace]">
							{readCount}/{MODULES.length}
						</span>
					</span>
				</div>

				<div className="flex items-center gap-2">
					<div className="w-2 h-2 rounded-full bg-amber-400" />
					<span className="text-xs text-zinc-400">
						{PROFILE_PERMISSION_TEXT.counters.write}:{" "}
						<span className="text-amber-400 font-semibold font-['DM_Mono',monospace]">
							{writeCount}/{MODULES.length}
						</span>
					</span>
				</div>
			</div>

			{/* Permission Rows */}
			<div className="space-y-5 max-h-[420px] overflow-y-auto pr-1">
				{Object.entries(modulesByCategory).map(([cat, mods]) => (
					<div key={cat}>
						<Divider label={cat} />

						<div className="space-y-1 mt-2">
							{mods.map((mod) => (
								<PermissionToggleRow
									key={mod.id}
									moduleId={mod.id}
									moduleName={mod.name}
									category={mod.category}
									read={form.permissions[mod.id]?.read || false}
									write={form.permissions[mod.id]?.write || false}
									onToggle={(moduleId, type, value) => {
										setForm((prev) => {
											const updated = {
												read: prev.permissions[moduleId]?.read || false,
												write: prev.permissions[moduleId]?.write || false,
											};

											if (type === "read") {
												updated.read = value;
												if (!value) updated.write = false;
											} else {
												updated.write = value;
												if (value) updated.read = true;
											}

											return {
												...prev,
												permissions: {
													...prev.permissions,
													[moduleId]: updated,
												},
											};
										});
									}}
								/>
							))}
						</div>
					</div>
				))}
			</div>

			{/* Footer */}
			<div className="flex justify-between mt-6">
				<Button
					variant="disable"
					size="sm"
					onClick={onBack}
					Icon={ArrowLeft}
					text={PROFILE_PERMISSION_TEXT.buttons.back}
				/>

				<div className="flex gap-3">
					<Button
						variant="primary"
						onClick={onCancel}
						text={PROFILE_PERMISSION_TEXT.buttons.discard}
					/>
					<Button
						variant="primary"
						onClick={onSubmit}
						Icon={isEditing ? EditIcon : PlusIcon}
						text={
							isEditing
								? PROFILE_PERMISSION_TEXT.buttons.update
								: PROFILE_PERMISSION_TEXT.buttons.create
						}
					/>
				</div>
			</div>
		</Card>
	);
};

export default ProfilePermissionsSection;
