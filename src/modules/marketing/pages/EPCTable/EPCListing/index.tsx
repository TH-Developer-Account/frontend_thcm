import EPCTable from "./EPCTable";
import { EPCProvider } from "../../../context/EPCprovider";
import { useState } from "react";
import Topbar from "../layouts/Topbar";

export default function EPCList() {
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  return (
    <EPCProvider>
      <div className="bg-white p-4 mt-4 rounded-xl shadow">
        <Topbar setIsFilterOpen={setIsFilterOpen} isFilterOpen={isFilterOpen} />
        <div className="h-screen flex flex-col">
          <div className="flex-1 p-1 min-h-0">
            <EPCTable />
          </div>
        </div>
      </div>
    </EPCProvider>
  );
}
