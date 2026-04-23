import React from "react";
import { Plus } from "lucide-react";
import { useEPC } from "../../../context/useEPC";
// import Filters from "../EPCListing/Filters";
import { SearchInput } from "../../../../../components/FormElements/SearchInput";
import { Can } from "../../../../../context/permissionHelpers";
import Button from "../../../../../components/common/Button";

interface TopbarProps {
	isFilterOpen: boolean;
	setIsFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Topbar: React.FC<TopbarProps> = ({ isFilterOpen, setIsFilterOpen }) => {
	const { search, setSearch } = useEPC();
	return (
		<div className="topbar-section">
			<header className=" md:px-6 py-3 text-black">
				<div className="flex items-center justify-between">
					{/* Right group */}
					<div className="flex items-center gap-2">
						{/* Search */}
						<SearchInput value={search} onChange={setSearch} />
						{/* Filter */}
						{/* <button
							className="flex items-center gap-1 border rounded-full px-3 py-2 text-sm"
							onClick={() => setIsFilterOpen((prev) => !prev)}
						>
							<Filter size={16} />
						</button> */}
						{/* Add EPC */}
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
				</div>
			</header>

			{/* {isFilterOpen && <Filters />} */}
		</div>
	);
};

export default Topbar;
