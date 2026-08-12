import { useCallback, useState, useSyncExternalStore } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { DashboardLayout } from "./DashboardLayout";
import { guestSidebar } from "../modules/guest/guestVendorOnboarding/GuestSidebar";
import Header from "../components/ui/Header";

const MOBILE_SIDEBAR_QUERY = "(max-width: 767px)";

type SidebarState = {
	isOpen: boolean;
	openedAtPathname: string | null;
};

const subscribeToMobileViewport = (onStoreChange: () => void) => {
	const mediaQuery = window.matchMedia(MOBILE_SIDEBAR_QUERY);
	mediaQuery.addEventListener("change", onStoreChange);
	return () => mediaQuery.removeEventListener("change", onStoreChange);
};

const getMobileViewportSnapshot = () =>
	window.matchMedia(MOBILE_SIDEBAR_QUERY).matches;

const getMobileViewportServerSnapshot = () => false;

export default function GuestLayoutWrapper() {
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

	const handleToggleSidebar = useCallback(() => {
		setSidebarState((previous) => ({
			isOpen: !previous.isOpen,
			openedAtPathname: location.pathname,
		}));
	}, [location.pathname]);

	const handleCloseSidebar = useCallback(() => {
		setSidebarState((previous) =>
			previous.isOpen ? { isOpen: false, openedAtPathname: null } : previous,
		);
	}, []);

	const isSidebarOpen =
		sidebarState.isOpen &&
		(!isMobileViewport || sidebarState.openedAtPathname === location.pathname);

	return (
		<DashboardLayout
			isSidebarOpen={isSidebarOpen}
			onToggleSidebar={handleToggleSidebar}
			onCloseSidebar={handleCloseSidebar}
			sidebarItems={guestSidebar}
			header={<Header />}
		>
			<Outlet />
		</DashboardLayout>
	);
}
