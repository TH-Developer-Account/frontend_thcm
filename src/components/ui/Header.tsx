import UserProfile from "../../components/ui/UserProfile";

function Header() {
	return (
		<>
			{/* <span className="text-base sm:text-xl font-bold tracking-wide logo-font">
				TATA HITACHI
			</span> */}
			<div className="logo md:w-[150px] w-[120px]">
				<img src="/r.png" alt="logo" />
			</div>
			<UserProfile />
		</>
	);
}

export default Header;
