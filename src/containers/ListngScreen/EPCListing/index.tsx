import EPCTable from "./EPCTable";
import { EPFProvider } from "../context/EPCprovider";
import { useState } from "react";
import Topbar from "../layouts/Topbar";

export default function EPCList() {
	const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

	return (
		<EPFProvider>
			<div className="bg-white p-6  rounded-xl shadow">
				<Topbar setIsFilterOpen={setIsFilterOpen} isFilterOpen={isFilterOpen} />
				<EPCTable />
			</div>
		</EPFProvider>
	);
}
