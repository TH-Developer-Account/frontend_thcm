import React, { useState } from "react";
import { DashboardLayout } from "../../layout/DashboardLayout";
import type { SidebarItem } from "../../layout/sidebar.types";
import { Home, Settings, BarChart } from "lucide-react";

export const Layout = () => {
	const [sidebarOpen, setSidebarOpen] = useState(true);

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
		<React.Fragment>
			<DashboardLayout
				isSidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen((p) => !p)}
				sidebarItems={sidebarItems}
				header={
					<>
						<h3 className="font-semibold">Dashboard</h3>
						<span className="text-base sm:text-xl font-bold tracking-wide logo-font">
							TATA HITACHI
						</span>
					</>
				}
			>
				<div className="bg-white p-6 rounded-xl shadow">Main content</div>
			</DashboardLayout>
		</React.Fragment>
	);
};
