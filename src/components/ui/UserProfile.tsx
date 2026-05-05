import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Avatar from "../../components/common/Avatar";
import { useAuth } from "../../context/Auth/useAuth";
import { LogOut } from "lucide-react";

const UserProfile = () => {
	const { logout, user } = useAuth();
	return (
		<div className="relative">
			<div className="flex items-center gap-1 sm:gap-1 ">
				<Menu as="div" className="relative inline-block">
					<MenuButton className="inline-flex w-full text-gray-900 justify-center gap-x-1 rounded-md items-center text-sm font-semibold ">
						{user?.first_name + `, ` + user?.last_name}
						<Avatar
							firstName={user?.first_name || "User"}
							lastName={user?.last_name || ""}
							imageUrl={""}
							size="md"
							isTooltip={false}
						/>
					</MenuButton>

					<MenuItems
						transition
						className="z-50 brand absolute shadow-[0px_3px_12px_0px_rgba(0,0,0,0.2)] top-9 right-0 mt-2 w-35 text-black origin-top-right divide-y divide-white/10 rounded-md bg-white outline-1 -outline-offset-1 outline-white/10 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
					>
						<div className="py-1 text-left">
							<MenuItem>
								<a
									href="#"
									className="brand block px-4 py-2 text-sm text-gray-900 data-focus:outline-hidden"
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
		</div>
	);
};

export default UserProfile;
