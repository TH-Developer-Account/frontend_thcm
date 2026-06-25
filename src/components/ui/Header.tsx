import { NavLink } from "react-router-dom";
import UserProfile from "../../components/ui/UserProfile";

function Header() {
	return (
		<>
			<div className="header-logo">
				<NavLink to={"/"}>
					<img src="/lo.jpg" alt="logo" />
				</NavLink>
			</div>
			<UserProfile />
		</>
	);
}

export default Header;
