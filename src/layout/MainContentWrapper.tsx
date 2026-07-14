import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Header from "../components/ui/Header";
import { useSidebarPermissions } from "../hooks/useSidebarPermission";
import { adminSidebar } from "../modules/admin/admin.sidebar";
import { marketingSidebar } from "../modules/marketing/marketing.sidebar";
import { DashboardLayout } from "./DashboardLayout";
import { vendorSidebar } from "../modules/vendorOnboarding/vendor.sidebar";

const MOBILE_SIDEBAR_QUERY = "(max-width: 767px)";

type SidebarState = {
	isOpen: boolean;
	openedAtPathname: string | null;
};

const subscribeToMobileViewport = (onStoreChange: () => void) => {
	const mediaQuery = window.matchMedia(MOBILE_SIDEBAR_QUERY);

	mediaQuery.addEventListener("change", onStoreChange);

	return () => {
		mediaQuery.removeEventListener("change", onStoreChange);
	};
};

const getMobileViewportSnapshot = () =>
	window.matchMedia(MOBILE_SIDEBAR_QUERY).matches;

const getMobileViewportServerSnapshot = () => false;

export default function MainContentWrapper() {
	const location = useLocation();

	const [sidebarState, setSidebarState] = useState<SidebarState>({
		isOpen: false,
		openedAtPathname: null,
	});

	const isMobileViewport = useSyncExternalStore(
		subscribeToMobileViewport,
		getMobileViewportSnapshot,
		getMobileViewportServerSnapshot,
	);

	const sidebarItems = useMemo(() => {
		const path = location.pathname;

		if (path.startsWith("/marketing")) {
			return marketingSidebar;
		}

		if (path.startsWith("/admin")) {
			return adminSidebar;
		}
		if (path.startsWith("/vendor")) {
			return vendorSidebar;
		}

		return [];
	}, [location.pathname]);

	const filteredSidebar = useSidebarPermissions(sidebarItems);

	const handleToggleSidebar = useCallback(() => {
		setSidebarState((previous) => ({
			isOpen: !previous.isOpen,
			openedAtPathname: location.pathname,
		}));
	}, [location.pathname]);

	const handleCloseSidebar = useCallback(() => {
		setSidebarState((previous) => {
			if (!previous.isOpen) {
				return previous;
			}

			return {
				isOpen: false,
				openedAtPathname: null,
			};
		});
	}, []);

	const isSidebarOpen =
		sidebarState.isOpen &&
		(!isMobileViewport || sidebarState.openedAtPathname === location.pathname);

	return (
		<DashboardLayout
			isSidebarOpen={isSidebarOpen}
			onToggleSidebar={handleToggleSidebar}
			onCloseSidebar={handleCloseSidebar}
			sidebarItems={filteredSidebar}
			header={<Header />}
		>
			<Outlet />
		</DashboardLayout>
	);
}
