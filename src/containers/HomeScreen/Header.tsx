import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
// import Avatar from "../../components/common/Avatar";
import { useAuth } from "../../context/useAuth";
import { LogOut } from "lucide-react";

function Header() {
	const { logout, user } = useAuth();
	console.log(user, "<--- User");
	return (
		<header className="header px-4 sm:px-6 py-2 flex items-center justify-between text-white">
			<span className="text-base sm:text-xl font-bold tracking-wide logo-font">
				TATA HITACHI
			</span>
			{/* <div className="logos flex justify-center items-center  bg-white p-1">
				<img src="/lo.jpg" alt="logo" className="text-center w-[120px]" />
			</div> */}

			<div className="relative">
				<div className="flex items-center gap-1 sm:gap-1 ">
					<Menu as="div" className="relative inline-block">
						<MenuButton className="inline-flex w-full justify-center gap-x-1 rounded-md  px-2 py-2 items-center text-sm font-semibold text-white ">
							{user?.first_name + `, ` + user?.last_name}
							{/* <Avatar
								firstName={user?.first_name || "User"}
								lastName={user?.last_name || ""}
								imageUrl={""}
								size="md"
							/> */}
							<ChevronDownIcon
								aria-hidden="true"
								className="-mr-1 size-5 font-bold bg-white text-orange-600 user-profile-button"
							/>
						</MenuButton>

						<MenuItems
							transition
							className="absolute shadow-[0px_3px_12px_0px_rgba(0,0,0,0.2)] top-10 right-0 z-10 mt-2 w-35 text-black origin-top-right divide-y divide-white/10 rounded-md bg-white outline-1 -outline-offset-1 outline-white/10 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
						>
							<div className="py-1 text-left">
								<MenuItem>
									<a
										href="#"
										className="block px-4 py-2 text-sm text-gray-900 data-focus:outline-hidden"
									>
										User Profile
									</a>
								</MenuItem>
								<MenuItem>
									<button
										onClick={logout}
										className="block inline-flex justify-between px-4 py-2 text-sm text-gray-900 data-focus:outline-hidden cursor-pointer"
									>
										Sign Out
										<LogOut
											size={5}
											className="ml-1 size-5 font-bold bg-white text-orange-600 user-profile-button"
										/>
									</button>
								</MenuItem>
							</div>
						</MenuItems>
					</Menu>
				</div>
				{/* 
        {open && (
          <div className="absolute right-0 mt-2 w-40 bg-white text-gray-700 rounded-md shadow-lg text-sm z-50">
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
              User Info
            </button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
              Sign Out
            </button>
          </div>
        )} */}
			</div>
		</header>
	);
}

export default Header;
