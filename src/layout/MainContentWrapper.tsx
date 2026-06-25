import { Outlet, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { useSidebarPermissions } from "../hooks/useSidebarPermission";
import { DashboardLayout } from "./DashboardLayout";
import Header from "../components/ui/Header";
import { marketingSidebar } from "../modules/marketing/marketing.sidebar";
import { adminSidebar } from "../modules/admin/admin.sidebar";
//role specifinc sidebar
// import { useAuth } from "../context/Auth/useAuth";
// import type { SidebarItem } from "./layout.types";

export default function MainContentWrapper() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  //role specifinc sidebar
  // const { user } = useAuth();

  const sidebarItems = useMemo(() => {
    const path = location.pathname;

    if (path.startsWith("/marketing")) return marketingSidebar;
    // if (path.startsWith("/dealer")) return dealerSidebar;
    if (path.startsWith("/admin")) return adminSidebar;
    // if (path.startsWith("/key-account")) return keyAccountSidebar;
    // if (path.startsWith("/customer-master")) return customerMasterSidebar;

    return [];
  }, [location.pathname]);

  //role specifinc sidebar
  // use this when user role define roles
  // const sidebarItems = useMemo(() => {
  // 	const path = location.pathname;

  // 	let baseSidebar: SidebarItem[] = [];

  // 	if (path.startsWith("/marketing")) baseSidebar = marketingSidebar;
  // 	if (path.startsWith("/admin")) baseSidebar = adminSidebar;

  // 	if (!user?.role) return [];

  // 	return baseSidebar.filter(
  // 		(item) => !item.roles || item.roles.includes(user.role as string),
  // 	);
  // }, [location.pathname, user]);

  const filteredSidebar = useSidebarPermissions(sidebarItems);

  return (
    <DashboardLayout
      isSidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen((p) => !p)}
      sidebarItems={filteredSidebar}
      header={<Header />}
    >
      {" "}
      <Outlet />
    </DashboardLayout>
  );
}
