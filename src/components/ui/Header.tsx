// components/layout/Header.tsx
import { NavLink, useLocation } from "react-router-dom";
import UserProfile from "../ui/UserProfile";
import { ThemeToggle } from "../common/ThemeToggle";
import { useAuth } from "../../context/Auth/useAuth";
import { useGuestAuth } from "../../context/Auth/useGuestAuth";

function StaffHeaderActions() {
	const { logout, user } = useAuth();
	return (
		<div className="app-header-actions">
			<ThemeToggle />
			<UserProfile onLogOut={logout} user={user} />
		</div>
	);
}

function GuestHeaderActions() {
	const { guest, logout } = useGuestAuth();
	// "guest present" — no profile chip until /guest/me rehydration resolves it
	return (
		<div className="app-header-actions">
			<UserProfile onLogOut={logout} user={guest} />
		</div>
	);
}

function Header() {
	const { pathname } = useLocation();
	const isGuestRoute = pathname.startsWith("/guest");

	return (
		<div className="home-header-content">
			<NavLink
				to={isGuestRoute ? "/guest/vendor-onboarding" : "/"}
				className="home-brand"
				aria-label="Go to home"
			>
				<img src="/lo.jpg" alt="logo" />
			</NavLink>

			{isGuestRoute ? <GuestHeaderActions /> : <StaffHeaderActions />}
		</div>
	);
}

export default Header;
