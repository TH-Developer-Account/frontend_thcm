import { NavLink } from "react-router-dom";
import UserProfile from "../../components/ui/UserProfile";

function Header() {
	return (
		<>
			<div className="logo header-logo md:w-[150px] w-[120px]">
				<NavLink to={"/"}>
					<img src="/lo.jpg" alt="logo" />
				</NavLink>
			</div>
			<UserProfile />
		</>
	);
}

export default Header;
