import { Outlet } from "react-router-dom";
import { useState } from "react";
import { DashboardLayout } from "./DashboardLayout";
import Header from "../components/ui/Header";
import { sidebarItems } from "./SidebarItems";

export default function MainContentWrapper() {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<DashboardLayout
			isSidebarOpen={sidebarOpen}
			onToggleSidebar={() => setSidebarOpen((p) => !p)}
			sidebarItems={sidebarItems}
			header={<Header />}
		>
			<Outlet />
		</DashboardLayout>
	);
}
