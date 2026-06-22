import { Outlet, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";

import { useSidebarPermissions } from "../hooks/useSidebarPermission";
import { DashboardLayout } from "./DashboardLayout";
import Header from "../components/ui/Header";
import { marketingSidebar } from "../modules/marketing/marketing.sidebar";
import { adminSidebar } from "../modules/admin/admin.sidebar";

export default function MainContentWrapper() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const location = useLocation();

	const sidebarItems = useMemo(() => {
		const path = location.pathname;

		if (path.startsWith("/marketing")) return marketingSidebar;
		if (path.startsWith("/admin")) return adminSidebar;

		return [];
	}, [location.pathname]);

	const filteredSidebar = useSidebarPermissions(sidebarItems);

	const handleToggleSidebar = () => {
		setSidebarOpen((previous) => !previous);
	};

	return (
		<DashboardLayout
			isSidebarOpen={sidebarOpen}
			onToggleSidebar={handleToggleSidebar}
			sidebarItems={filteredSidebar}
			header={<Header />}
		>
			<Outlet />
		</DashboardLayout>
	);
}
