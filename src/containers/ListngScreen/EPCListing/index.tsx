import EPCTable from "./EPCTable";
import { EPFProvider } from "../context/EPCprovider";
import { DashboardLayout } from "../../../layout/DashboardLayout";
import { Home, Settings, BarChart } from "lucide-react";
import type { SidebarItem } from "../../../layout/sidebar.types";
import { useState } from "react";
import UserProfile from "../../../components/common/UserProfile";
import Topbar from "../layouts/Topbar";

export default function EPCList() {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
	const sidebarItems: SidebarItem[] = [
		{
			id: "home",
			label: "Home",
			icon: <Home size={18} />,
		},
		{
			id: "analytics",
			label: "Analytics",
			icon: <BarChart size={18} />,
		},
		{
			id: "settings",
			label: "Settings",
			icon: <Settings size={18} />,
		},
	];
	return (
		<EPFProvider>
			<DashboardLayout
				isSidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen((p) => !p)}
				sidebarItems={sidebarItems}
				header={
					<>
						{/* <h3 className="font-semibold"></h3> */}
						<span className="text-base sm:text-xl font-bold tracking-wide logo-font">
							TATA HITACHI
						</span>
						<UserProfile />
					</>
				}
			>
				<div className="bg-white p-6  rounded-xl shadow">
					<Topbar
						onOpen={() => setSidebarOpen(true)}
						setIsFilterOpen={setIsFilterOpen}
						isFilterOpen={isFilterOpen}
					/>
					<EPCTable />
				</div>
			</DashboardLayout>
		</EPFProvider>
	);
}
