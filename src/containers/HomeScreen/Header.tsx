import UserProfile from "../../components/common/UserProfile";

function Header() {
	return (
		<header className="header px-4 sm:px-6 py-2 flex items-center justify-between text-white">
			<span className="text-base sm:text-xl font-bold tracking-wide logo-font">
				TATA HITACHI
			</span>
			{/* <div className="logos flex justify-center items-center  bg-white p-1">
				<img src="/lo.jpg" alt="logo" className="text-center w-[120px]" />
			</div> */}
			<UserProfile />
		</header>
	);
}

export default Header;
