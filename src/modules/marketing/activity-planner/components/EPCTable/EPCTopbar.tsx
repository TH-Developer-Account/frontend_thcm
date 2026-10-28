import { Gift, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../../../../components/common/Button";
import { SearchInput } from "../../../../../components/forms/SearchInput";
import { FilterTabs } from "../../../../../components/ui/FilterTabs";
import { Can } from "../../../../../context/permissionHelpers";
import { useMasterData } from "../../../../../hooks/useMasterData";

// Deep imports (not the handouts index) so the lazy Handouts pages stay out
// of the EPC listing bundle.
import { HANDOUTS_BASE_PATH } from "../../../handouts/handouts.constants";
import { useHandoutPermissions } from "../../../handouts/useHandoutPermissions";
import { clearStoredEpcInfo } from "../../utils/localstorage";
import type { EpcFilters } from "../../types/epc.types";
import {
	epcListFilterOptions,
	epcStatusOptions,
	type EpcListFilter,
} from "../../utils/constant";
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
): string => classNames.filter(Boolean).join(" ");

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
	// const { canOpenHandouts } = useHandoutPermissions();
	const canOpenHandouts = true;
	const eventTypeOptions = data?.eventNames ?? [];
	const zoneOptions = data?.regions ?? [];

	const filterTabs = epcListFilterOptions.map((option) => ({
		value: option.value,
		label: option.label,
		tooltipLabel: option.tooltipLabel,
		Icon: option.Icon,
	}));

	const handleCreateEpc = () => {
		clearStoredEpcInfo();
		navigate("/marketing/activity-planner/create");
	};

	return (
		<section
			className={joinClassNames("epc-topbar", className)}
			aria-label="EPC listing controls"
		>
			<div className="epc-topbar-tabs">
				<FilterTabs
					id="epc-list-filter-tabs"
					ariaLabel="Filter EPC listings"
					items={filterTabs}
					value={selectedFilter}
					onChange={onFilterChange}
					className="border-b-none"
					variant="underline"
				/>
			</div>

			<div className="epc-topbar-search">
				<SearchInput
					value={search}
					onChange={onSearchChange}
					placeholder="Search by event name"
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

				{/* Souvenir handouts: anyone with a request / approve / deliver grant. */}
				{/* {canOpenHandouts ? ( */}
				<Button
					type="button"
					appearance="standard"
					variant="outline"
					size="sm"
					Icon={Gift}
					iconSize={16}
					iconPosition="left"
					text="Handouts"
					onClick={() => navigate(HANDOUTS_BASE_PATH)}
				/>
				{/* ) : null} */}

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
