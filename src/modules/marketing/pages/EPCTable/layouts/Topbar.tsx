import React from "react";
import { NavLink } from "react-router-dom";
import { Filter, Plus } from "lucide-react";
import { useEPC } from "../../../context/useEPC";
import Filters from "../EPCListing/Filters";
import { SearchInput } from "../../../../../components/FormElements/SearchInput";
import { Can } from "../../../../../context/permissionHelpers";

interface TopbarProps {
	isFilterOpen: boolean;
	setIsFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Topbar: React.FC<TopbarProps> = ({ isFilterOpen, setIsFilterOpen }) => {
	const { search, setSearch } = useEPC();
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
						<SearchInput value={search} onChange={setSearch} />
						{/* Filter */}
						<button
							className="flex items-center gap-1 border rounded-full px-3 py-2 text-sm"
							onClick={() => setIsFilterOpen((prev) => !prev)}
						>
							<Filter size={16} />
						</button>
						{/* Add EPC */}
						<Can action="write" app="MAP" module="EPC">
							<button className="flex items-center gap-1 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm">
								<Plus size={16} />
								<NavLink to="/marketing/epc" rel="epc" className="text-white">
									<span className="hidden sm:inline">Create EPC</span>
								</NavLink>
							</button>
						</Can>
					</div>
				</div>
			</header>

			{isFilterOpen && <Filters />}
		</>
	);
};

export default Topbar;
