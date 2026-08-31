import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

import Avatar from "../../components/common/Avatar";
import { useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import type { User } from "../../context/Auth/AuthContext";
import type { Guest } from "../../context/Auth/GuestAuthContext";

export interface UserProfileProps {
	onLogOut: () => void;
	user?: User | Guest | null;
}
const UserProfile = ({ user, onLogOut }: UserProfileProps) => {
	const navigate = useNavigate();
	const { pathname } = useLocation();

	const isGuest = pathname.startsWith("/guest/");

	const firstName = isGuest ? "Guest" : user?.first_name?.trim() || "User";
	const lastName = isGuest ? "User" : user?.last_name?.trim() || "";

	const displayName = lastName ? `${firstName} ${lastName}` : firstName;
	const handleNavigate = () => {
		navigate("marketing/profile");
	};

	return (
		<div className="flex gap-1 items-center justify-end">
			<NotificationBell />
			<Menu as="div" className="user-menu">
				<MenuButton className="user-menu-trigger">
					<span className="user-menu-name">{displayName}</span>

					<Avatar
						firstName={firstName}
						lastName={lastName}
						imageUrl=""
						size="md"
						isTooltip={false}
					/>

					<ChevronDown
						aria-hidden="true"
						className="user-menu-chevron"
						size={16}
						strokeWidth={1.75}
					/>
				</MenuButton>

				<MenuItems anchor="bottom end" transition className="user-menu-panel">
					<div className="user-menu-summary">
						<Avatar
							firstName={firstName}
							lastName={lastName}
							imageUrl=""
							size="md"
							isTooltip={false}
						/>

						<div className="user-menu-summary-copy">
							<span className="user-menu-summary-name">{displayName}</span>

							<span className="user-menu-summary-label">Signed-in user</span>
						</div>
					</div>

					<div className="user-menu-items">
						{!isGuest && user && (
							<MenuItem>
								{({ focus }) => (
									<button
										type="button"
										onClick={handleNavigate}
										className={[
											"user-menu-item",
											focus ? "user-menu-item-focus" : "",
										]
											.filter(Boolean)
											.join(" ")}
									>
										<UserRound
											aria-hidden="true"
											size={17}
											strokeWidth={1.75}
										/>

										<span>User profile</span>
									</button>
								)}
							</MenuItem>
						)}
						<MenuItem>
							{({ focus }) => (
								<button
									type="button"
									onClick={onLogOut}
									className={[
										"user-menu-item",
										"user-menu-item-danger",
										focus ? "user-menu-item-focus" : "",
									]
										.filter(Boolean)
										.join(" ")}
								>
									<LogOut aria-hidden="true" size={17} strokeWidth={1.75} />

									<span>Sign out</span>
								</button>
							)}
						</MenuItem>
					</div>
				</MenuItems>
			</Menu>
		</div>
	);
};

export default UserProfile;
