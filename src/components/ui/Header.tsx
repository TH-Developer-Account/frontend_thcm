import { NavLink } from "react-router-dom";
import UserProfile from "../../components/ui/UserProfile";
import { ThemeToggle } from "../common/ThemeToggle";

function Header() {
	return (
		<div className="home-header-content">
			<NavLink to="/" className="home-brand" aria-label="Go to home">
				<img src="/lo.jpg" alt="logo" />
				{/* <span>Tata</span>
				<strong>Hitachi</strong>
				<em aria-hidden="true">—</em>
				<small>Internal Platform</small> */}
			</NavLink>

			<div className="app-header-actions">
				<ThemeToggle />
				<UserProfile />
			</div>
		</div>
	);
}

export default Header;
