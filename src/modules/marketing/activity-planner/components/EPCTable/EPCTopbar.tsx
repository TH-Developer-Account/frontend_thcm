import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../../../../components/common/Button";
import ThreeWayToggle from "../../../../../components/common/ThreeWayToggle";
import { SearchInput } from "../../../../../components/FormElements/SearchInput";
import { Can } from "../../../../../context/permissionHelpers";
import { useMasterData } from "../../../../../hooks/useMasterData";

import { clearStoredEpcInfo } from "../../helpers/localstorage";
import type { EpcFilters } from "../../types/epc.types";
import {
	epcListFilterOptions,
	epcStatusOptions,
	type EpcListFilter,
} from "../../utils/constants";
import { EpcFilterDropdown } from "./EpcFilterDropdown";

type EPCTopbarProps = {
	search: string;
	onSearchChange: (value: string) => void;
	selectedFilter: EpcListFilter;
	onFilterChange: (value: EpcListFilter) => void;
	filters: EpcFilters;
	onAdvancedFilterChange: (updated: Partial<EpcFilters>) => void;
	onClearAllFilters: () => void;
	activeFilterCount: number;
	className?: string;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
) => classNames.filter(Boolean).join(" ");

const EPCTopbar = ({
	search,
	onSearchChange,
	selectedFilter,
	onFilterChange,
	filters,
	onAdvancedFilterChange,
	onClearAllFilters,
	activeFilterCount,
	className = "",
}: EPCTopbarProps) => {
	const navigate = useNavigate();
	const { data } = useMasterData();

	const eventTypeOptions = data?.eventNames ?? [];
	const zoneOptions = data?.regions ?? [];

	const handleCreateEpc = () => {
		clearStoredEpcInfo();
		navigate("/marketing/activity-planner/create");
	};

	return (
		<section
			className={joinClassNames("epc-topbar", className)}
			aria-label="EPC listing controls"
		>
			<div className="epc-topbar-search">
				<SearchInput
					value={search}
					onChange={onSearchChange}
					placeholder="Search by event name"
				/>
			</div>

			<div className="epc-topbar-toggle">
				<ThreeWayToggle
					options={epcListFilterOptions}
					value={selectedFilter}
					onChange={onFilterChange}
				/>
			</div>

			<div className="epc-topbar-actions">
				<EpcFilterDropdown
					filters={filters}
					onChange={onAdvancedFilterChange}
					onClearAll={onClearAllFilters}
					activeFilterCount={activeFilterCount}
					zoneOptions={zoneOptions}
					eventTypeOptions={eventTypeOptions}
					statusOptions={epcStatusOptions}
				/>

				<Can action="write" app="MAP" module="EPC">
					<Button
						type="button"
						appearance="cta"
						variant="brand"
						size="sm"
						Icon={Plus}
						iconSize={16}
						iconPosition="left"
						text="Create EPC"
						className="epc-topbar-create"
						onClick={handleCreateEpc}
					/>
				</Can>
			</div>
		</section>
	);
};

export default EPCTopbar;
