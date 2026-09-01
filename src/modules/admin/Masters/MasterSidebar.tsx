import { Database } from "lucide-react";

import Button from "../../../components/common/Button";

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
			className={
				isCompact
					? "master-sidebar master-sidebar-compact scrollbar-sleek"
					: "master-sidebar master-sidebar-default"
			}
			aria-label="Masters"
		>
			{!isCompact && <p className="master-sidebar-title">Masters</p>}

			{masters.map((master) => {
				const isActive = activeMaster === master;

				return (
					<Button
						key={master}
						type="button"
						Icon={!isCompact ? Database : undefined}
						appearance="transparent"
						variant="transparent"
						active={isActive}
						className={
							isActive
								? "master-sidebar-item master-sidebar-item-active"
								: "master-sidebar-item"
						}
						onClick={() => onSelectMaster(master)}
					>
						<span className="master-sidebar-item-label">{master}</span>

						{counts[master] !== undefined && (
							<span className="master-sidebar-count">{counts[master]}</span>
						)}
					</Button>
				);
			})}
		</nav>
	);
};
