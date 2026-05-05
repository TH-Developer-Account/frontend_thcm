import Button from "../../../../components/common/Button";
import { Database } from "lucide-react";

const masters = [
	"Branches",
	"Departments",
	"Regions",
	"Event Names",
	"Budget",
	"Vertical",
];

type MasterSidebarProps = {
	activeMaster: string;
	onSelectMaster: (master: string) => void;
	counts?: Record<string, number>;
	isCompact?: boolean;
};

export const MasterSidebar = ({
	activeMaster,
	onSelectMaster,
	counts = {},
	isCompact = false,
}: MasterSidebarProps) => {
	return (
		<nav
			className={`
		w-full max-w-full min-w-0
		border border-zinc-300 shadow-sm rounded-lg p-2
		${
			isCompact
				? "flex flex-row gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-sleek"
				: "flex flex-col gap-1 shrink-0"
		}
	`}
		>
			{!isCompact && (
				<p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
					Masters
				</p>
			)}

			{masters.map((master) => {
				const isActive = activeMaster === master;

				return (
					<Button
						key={master}
						Icon={!isCompact ? Database : undefined}
						onClick={() => onSelectMaster(master)}
						className={`
				flex items-center gap-2 rounded-lg transition-colors whitespace-nowrap
				${isCompact ? "px-3 py-2" : "w-full justify-start"}
  
				${
					isActive
						? "bg-orange-50 text-orange-600 border border-orange-200"
						: "hover:bg-gray-100 text-gray-600 border border-transparent"
				}
			  `}
					>
						<span className="text-left">{master}</span>

						{counts[master] !== undefined && (
							<span
								className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none
				  ${isActive ? "bg-orange-100 text-orange-500" : "bg-zinc-100 text-zinc-400"}`}
							>
								{counts[master]}
							</span>
						)}
					</Button>
				);
			})}
		</nav>
	);
};
