import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { SearchInput } from "../../../../../components/FormElements/SearchInput";
import { Can } from "../../../../../context/permissionHelpers";
import Button from "../../../../../components/common/Button";
import ThreeWayToggle from "../../../../../components/common/ThreeWayToggle";

import {
	epcListFilterOptions,
	type EpcListFilter,
} from "../../utils/constants";

import { clearStoredEpcInfo } from "../../helpers/localstorage";

type EPCTopbarProps = {
	search: string;
	onSearchChange: (value: string) => void;

	selectedFilter: EpcListFilter;
	onFilterChange: (value: EpcListFilter) => void;
};

const EPCTopbar = ({
	search,
	onSearchChange,
	selectedFilter,
	onFilterChange,
}: EPCTopbarProps) => {
	const navigate = useNavigate();

	const handleCreateEpc = () => {
		clearStoredEpcInfo();
		navigate("/marketing/activity-planner/create");
	};

	return (
		<div className="topbar-section">
			<header className="py-3 text-black md:px-6">
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-end gap-4">
						<SearchInput value={search} onChange={onSearchChange} />

						<ThreeWayToggle
							options={epcListFilterOptions}
							value={selectedFilter}
							onChange={onFilterChange}
							className="w-[320px]"
						/>
						<Can action="write" app="MAP" module="EPC">
							<Button
								Icon={Plus}
								iconSize="16"
								iconPosition="left"
								text="Create EPC"
								status="brand"
								size="sm"
								onClick={handleCreateEpc}
							/>
						</Can>
					</div>
				</div>
			</header>
		</div>
	);
};

export default EPCTopbar;
