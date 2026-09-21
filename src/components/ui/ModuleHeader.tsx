// components/ui/ModuleHeader.tsx

// import { ChevronRight } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import logo from "../../assets/thcm-logo/th-brand-logo.png";
import UserProfile from "./UserProfile";
import { useAuth } from "../../context/Auth/useAuth";
import { useGuestAuth } from "../../context/Auth/useGuestAuth";
// import { usePageBreadcrumbs } from "../../routes/usePageBreadcrumbs";
// import PageNavigation from "./PageNavigation/PageNavigation";

function StaffModuleActions() {
	const { logout, user } = useAuth();
	return (
		<div className="app-header-actions">
			<UserProfile onLogOut={logout} user={user} />
		</div>
	);
}

function GuestModuleActions() {
	const { guest, logout } = useGuestAuth();
	return (
		<div className="app-header-actions">
			<UserProfile onLogOut={logout} user={guest} />
		</div>
	);
}

function ModuleHeader() {
	const { pathname } = useLocation();
	const isGuestRoute = pathname.startsWith("/guest");
	// const breadcrumbs = usePageBreadcrumbs();

	return (
		<div className="home-header-content">
			<div className="flex min-w-0 items-center gap-3">
				<NavLink
					to={isGuestRoute ? "/guest/medi-claim/create" : "/"}
					aria-label="Go to home"
					className="inline-flex shrink-0 items-center"
				>
					<img src={logo} alt="Tata Hitachi" className="h-10 object-contain" />
				</NavLink>

				{/* {breadcrumbs.length > 0 ? (
					<PageNavigation
						variant="breadcrumbs"
						breadcrumbs={breadcrumbs}
						separator={<ChevronRight size={14} aria-hidden="true" />}
					/>
				) : null} */}
			</div>

			{isGuestRoute ? <GuestModuleActions /> : <StaffModuleActions />}
		</div>
	);
}

export default ModuleHeader;
