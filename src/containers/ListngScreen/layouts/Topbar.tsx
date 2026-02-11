import React from "react";
import { Search, Filter, Plus } from "lucide-react";
import Filters from "../EPCListing/Filters";

interface TopbarProps {
  isFilterOpen: boolean;
  setIsFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Topbar: React.FC<TopbarProps> = ({ isFilterOpen, setIsFilterOpen }) => {
  return (
    <>
      <header className="bg-white md:px-6 py-3 pt-0 text-black">
        <div className="flex items-center justify-between">
          {/* Left group */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Title */}
            <span className="text-sm md:text-base font-medium whitespace-nowrap">
              Event Planning Calendar (EPC)
            </span>
          </div>

          {/* Right group */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={16}
              />
              <input
                className="pl-9 pr-3 py-2 border rounded-lg text-sm w-48 md:w-64"
                placeholder="Search..."
              />
            </div>

            {/* Filter */}
            <button
              className="flex items-center gap-1 border rounded-full px-3 py-2 text-sm"
              onClick={() => setIsFilterOpen((prev) => !prev)}
            >
              <Filter size={16} />
            </button>

            {/* Add EPC */}
            <button className="flex items-center gap-1 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm">
              <Plus size={16} />
              <a href="/epc" rel="epc" className="text-white">
                <span className="hidden sm:inline">Create EPC</span>
              </a>
            </button>
          </div>
        </div>
      </header>

      {isFilterOpen && <Filters />}
    </>
  );
};

export default Topbar;
