import React from "react";
import { Plus } from "lucide-react";
import { useEPC } from "../../../context/useEPC";
// import Filters from "../EPCListing/Filters";
import { SearchInput } from "../../../../../components/FormElements/SearchInput";
import { Can } from "../../../../../context/permissionHelpers";
import Button from "../../../../../components/common/Button";
import ThreeWayToggle from "../../../../../components/common/ThreeWayToggle";
import { epcListFilterOptions } from "../../../constant";

interface TopbarProps {
  isFilterOpen?: boolean;
  setIsFilterOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

const Topbar: React.FC<TopbarProps> = () => {
  const { search, setSearch, selectedFilter, setSelectedFilter } = useEPC();

  return (
    <div className="topbar-section">
      <header className=" md:px-6 py-3 text-black">
        <div className="flex gap-4 flex-col justify-end">
          <div className="flex items-center justify-end gap-4">
            {/* Right group */}
            {/* Search */}
            <SearchInput value={search} onChange={setSearch} />

            <Can action="write" app="MAP" module="EPC">
              <Button
                Icon={Plus}
                iconSize="16"
                iconPosition="left"
                text="Create EPC"
                status="brand"
                path="/marketing/epc"
              />
            </Can>
          </div>
          {/* Filter */}
          <ThreeWayToggle
            options={epcListFilterOptions}
            value={selectedFilter}
            onChange={setSelectedFilter}
            className="w-[420px]"
          />
        </div>
      </header>

      {/* {isFilterOpen && <Filters />} */}
    </div>
  );
};

export default Topbar;
