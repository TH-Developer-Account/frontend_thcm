import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { SearchInput } from "../../../../../components/FormElements/SearchInput";
import { Can } from "../../../../../context/permissionHelpers";
import Button from "../../../../../components/common/Button";
import ThreeWayToggle from "../../../../../components/common/ThreeWayToggle";
import { EpcFilterDropdown } from "./EpcFilterDropdown";
import {
	epcListFilterOptions,
	type EpcListFilter,
} from "../../utils/constants";
import type { EpcFilters } from "../../types/epc.types";
import { clearStoredEpcInfo } from "../../helpers/localstorage";
import { useMasterData } from "../../../../../hooks/useMasterData";
import { EPC_STATUS_OPTIONS } from "../../utils/constants";

type EPCTopbarProps = {
	search: string;
	onSearchChange: (value: string) => void;
	selectedFilter: EpcListFilter;
	onFilterChange: (value: EpcListFilter) => void;
	filters: EpcFilters;
	onAdvancedFilterChange: (updated: Partial<EpcFilters>) => void;
	onClearAllFilters: () => void;
	activeFilterCount: number;
};

const EPCTopbar = ({
	search,
	onSearchChange,
	selectedFilter,
	onFilterChange,
	filters,
	onAdvancedFilterChange,
	onClearAllFilters,
	activeFilterCount,
}: EPCTopbarProps) => {
	const navigate = useNavigate();
	const { data } = useMasterData();
	const eventTypeOptions = data?.eventNames ?? [];
	const zoneOptions = data?.regions ?? [];
	const statusOptions = EPC_STATUS_OPTIONS;

	const handleCreateEpc = () => {
		clearStoredEpcInfo();
		navigate("/marketing/activity-planner/create");
	};

	return (
		<div className="topbar-section">
			<header className="py-3 text-black md:px-6">
				<div className="flex items-center justify-end gap-4">
					<SearchInput
						value={search}
						onChange={onSearchChange}
						placeholder="Search by event name"
					/>
					<ThreeWayToggle
						options={epcListFilterOptions}
						value={selectedFilter}
						onChange={onFilterChange}
						className="w-[320px]"
					/>
					<EpcFilterDropdown
						filters={filters}
						onChange={onAdvancedFilterChange}
						onClearAll={onClearAllFilters}
						activeFilterCount={activeFilterCount}
						zoneOptions={zoneOptions}
						eventTypeOptions={eventTypeOptions}
						statusOptions={statusOptions}
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
			</header>
		</div>
	);
};

export default EPCTopbar;
