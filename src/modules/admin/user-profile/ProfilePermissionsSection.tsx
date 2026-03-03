import React from "react";
import { Card } from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import PermissionToggleRow from "./PermissionToggleRow";
import { PROFILE_PERMISSION_TEXT } from "./constant";
import { ArrowLeft, EditIcon, PlusIcon } from "lucide-react";
import type { Profile } from "./profile.types";

interface Props {
	form: Profile;
	setForm: React.Dispatch<React.SetStateAction<Profile>>;
	modulesByApp: Record<
		string,
		{
			appKey: string;
			appName: string;
			modules: { key: string; name: string }[];
		}
	>;
	readCount: number;
	writeCount: number;
	isEditing: boolean;
	onCancel: () => void;
	onSubmit: () => void;
	onBack: () => void;
}

const Divider = ({ label }: { label: string }) => (
	<div className="flex items-center gap-3 my-2">
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
	modulesByApp,
	readCount,
	writeCount,
	isEditing,
	onCancel,
	onSubmit,
	onBack,
}) => {
	const totalModules = Object.values(modulesByApp).reduce(
		(acc, app) => acc + app.modules.length,
		0,
	);

	return (
		<Card className="p-6">
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
					<span>🔐</span> {PROFILE_PERMISSION_TEXT.title}
				</h2>
			</div>

			{/* Counters */}
			<div className="flex items-center gap-6 mb-6 p-3 bg-gray-100/40 rounded-lg border border-zinc-800">
				<div className="flex items-center gap-2">
					<div className="w-2 h-2 rounded-full bg-sky-400" />
					<span className="text-xs text-zinc-400">
						Read:{" "}
						<span className="text-sky-400 font-semibold">
							{readCount}/{totalModules}
						</span>
					</span>
				</div>

				<div className="flex items-center gap-2">
					<div className="w-2 h-2 rounded-full bg-amber-400" />
					<span className="text-xs text-zinc-400">
						Write:{" "}
						<span className="text-amber-400 font-semibold">
							{writeCount}/{totalModules}
						</span>
					</span>
				</div>
			</div>

			{/* Permission Rows */}
			<div className="space-y-6 max-h-[420px] overflow-y-auto pr-1">
				{Object.values(modulesByApp).map((app) => (
					<div key={app.appKey}>
						<Divider label={app.appName} />

						<div className="space-y-1 mt-3">
							{app.modules.map((mod) => (
								<PermissionToggleRow
									key={mod.key}
									moduleId={mod.key}
									moduleName={mod.name}
									read={form.permissions[mod.key]?.read || false}
									write={form.permissions[mod.key]?.write || false}
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
			<div className="flex justify-between mt-8">
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
