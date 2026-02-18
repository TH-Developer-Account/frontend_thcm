import { Outlet, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { DashboardLayout } from "./DashboardLayout";
import Header from "../components/ui/Header";
import { marketingSidebar } from "../modules/marketing/marketing.sidebar";
import { adminSidebar } from "../modules/admin/admin.sidebar";
import { PageHeader } from "../components/ui/PageHeader";

export default function MainContentWrapper() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const location = useLocation();
	const sidebarItems = useMemo(() => {
		const path = location.pathname;

		if (path.startsWith("/marketing")) return marketingSidebar;
		// if (path.startsWith("/dealer")) return dealerSidebar;
		if (path.startsWith("/admin")) return adminSidebar;
		// if (path.startsWith("/key-account")) return keyAccountSidebar;
		// if (path.startsWith("/customer-master")) return customerMasterSidebar;

		return [];
	}, [location.pathname]);
	return (
		<DashboardLayout
			isSidebarOpen={sidebarOpen}
			onToggleSidebar={() => setSidebarOpen((p) => !p)}
			sidebarItems={sidebarItems}
			header={<Header />}
		>
			{" "}
			<PageHeader
				title="List"
				breadcrumbs={[
					{ label: "Dashboard", href: "/admin/dashboard" },
					{ label: "User", href: "/admin/users" },
					{ label: "List", href: "/admin/users" },
				]}
			/>
			<Outlet />
		</DashboardLayout>
	);
}
