import { EditIcon, TrashIcon } from "lucide-react";
import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import { Card } from "../../../components/common/Card";
import { MODULES } from "./constant";

type ProfileCardProps = {
	profile: any;
	onEdit: () => void;
	onDelete: () => void;
	style?: React.CSSProperties;
};
const formatDate = (d: any) =>
	new Date(d).toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});

const getPermissionLevel = (permissions: any[]) => {
	const vals = Object.values(permissions);
	const w = vals.filter((p) => p.write).length,
		r = vals.filter((p) => p.read).length;
	if (w === MODULES.length)
		return { label: "Full Access", color: "text-amber-400" };
	if (w > 0) return { label: `${w} Modules`, color: "text-emerald-400" };
	if (r > 0) return { label: "Read Only", color: "text-sky-400" };
	return { label: "No Access", color: "text-zinc-500" };
};

export const ProfileCard: React.FC<ProfileCardProps> = ({
	profile,
	onEdit,
	onDelete,
	style,
}) => {
	const permLevel = getPermissionLevel(profile.permissions);
	const readCount = Object.values(profile.permissions).filter(
		(p) => p.read,
	).length;
	const writeCount = Object.values(profile.permissions).filter(
		(p) => p.write,
	).length;
	return (
		<Card
			className="p-5 relative overflow-hidden animate-slide-up"
			hoverable
			style={style}
		>
			<div
				className="absolute top-0 left-0 right-0 h-0.5 opacity-60"
				style={{
					background: `linear-gradient(90deg,${profile.color},transparent)`,
				}}
			/>
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center gap-3">
					<div
						className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
						style={{
							background: `${profile.color}18`,
							border: `1px solid ${profile.color}40`,
							color: profile.color,
						}}
					>
						{profile.name.charAt(0)}
					</div>
					<div>
						<h3 className="text-zinc-100 font-semibold text-sm leading-tight">
							{profile.name}
						</h3>
						<Badge variant={"primary"}>{profile.role}</Badge>
					</div>
				</div>
				<Badge variant={profile.status === "success" ? "success" : "danger"}>
					{profile.status}
				</Badge>
			</div>
			<p className="text-zinc-500 text-xs leading-relaxed mb-4 line-clamp-2">
				{profile.description}
			</p>
			<div className="flex items-center gap-4 mb-4 py-3 px-3 bg-zinc-800/40 rounded-lg border border-zinc-800">
				<div className="text-center">
					<p className="text-xs text-zinc-500">Read</p>
					<p className="text-sm font-bold text-sky-400 font-['DM_Mono',monospace]">
						{readCount}/{MODULES.length}
					</p>
				</div>
				<div className="w-px h-8 bg-zinc-700" />
				<div className="text-center">
					<p className="text-xs text-zinc-500">Write</p>
					<p className="text-sm font-bold text-amber-400 font-['DM_Mono',monospace]">
						{writeCount}/{MODULES.length}
					</p>
				</div>
				<div className="w-px h-8 bg-zinc-700" />
				<div className="text-center flex-1">
					<p className="text-xs text-zinc-500">Level</p>
					<p className={`text-xs font-bold ${permLevel.color}`}>
						{permLevel.label}
					</p>
				</div>
			</div>
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<span className="text-xs text-zinc-500">
						{profile.assignedUsers.length} user
						{profile.assignedUsers.length !== 1 ? "s" : ""}
					</span>
				</div>
				<span className="text-xs text-zinc-600 font-['DM_Mono',monospace]">
					Updated {formatDate(profile.updatedAt)}
				</span>
			</div>
			<div className="flex gap-2 pt-3 border-t border-zinc-800">
				<Button
					variant="primary"
					size="sm"
					onClick={onEdit}
					Icon={EditIcon}
					className="flex-1 justify-center"
					text="Edit Profile"
				/>
				<Button
					variant="danger"
					size="sm"
					onClick={onDelete}
					Icon={TrashIcon}
					className="flex-1 justify-center"
					text="Delete Profile"
				/>
			</div>
		</Card>
	);
};
