import Toggle from "../../../components/common/Toggle";

interface PermissionToggleRowProps {
	moduleId: string;
	moduleName: string;
	category: string;
	read: boolean;
	write: boolean;
	onToggle: (moduleId: string, type: "read" | "write", value: boolean) => void;
}

const PermissionToggleRow: React.FC<PermissionToggleRowProps> = ({
	moduleId,
	moduleName,
	category,
	read,
	write,
	onToggle,
}) => {
	return (
		<div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-100/50 transition-colors">
			{/* LEFT SIDE */}
			<div className="flex items-center gap-3">
				<span className="text-base leading-none">🧩</span>
				<div>
					<p className="text-sm font-medium">{moduleName}</p>
					<p className="text-xs text-zinc-500">{category}</p>
				</div>
			</div>

			{/* RIGHT SIDE */}
			<div className="flex items-center gap-6">
				{/* READ */}
				<div className="flex flex-col items-center gap-1">
					<Toggle
						checked={read}
						size="sm"
						onChange={(value) => onToggle(moduleId, "read", value)}
					/>
					<span className="text-xs text-zinc-500 font-medium">Read</span>
				</div>

				{/* WRITE */}
				<div className="flex flex-col items-center gap-1">
					<Toggle
						checked={write}
						size="sm"
						disabled={!read}
						onChange={(value) => onToggle(moduleId, "write", value)}
					/>
					<span className="text-xs text-zinc-500 font-medium">Write</span>
				</div>
			</div>
		</div>
	);
};

export default PermissionToggleRow;
