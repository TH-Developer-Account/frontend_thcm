import React, { useState } from "react";
import type { Profile } from "./profile.types";

type UserProfileNavbarProps = {
	form?: Profile | null;
	children?: React.ReactNode;
};

const UserProfileNavbar: React.FC<UserProfileNavbarProps> = ({
	form: existingForm,
	children,
}) => {
	const [form] = useState<Profile>(
		existingForm || {
			id: "",
			name: "",
			description: "",
			role: "viewer",
			status: "active",
			color: "#f97316",
			assignedUsers: [],
			permissions: {},
			createdAt: "",
			updatedAt: "",
		},
	);

	return (
		<React.Fragment>
			<div
				className="w-full animate-slide-up"
				style={{ animationDelay: "0.05s" }}
			>
				<div className="flex items-center gap-4 border-b border-zinc-800 px-2 ">
					{/* Profile pill — shown only when form has a name */}
					{form.name && (
						<div className="flex items-center gap-2 py-2 pr-4 border-r border-zinc-800 shrink-0">
							<div
								className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
								style={{
									background: `${form.color}20`,
									border: `1px solid ${form.color}40`,
									color: form.color,
								}}
							>
								{form.name.charAt(0)}
							</div>
							<div className="text-left hidden sm:block">
								<p className="text-xs font-semibold text-zinc-200 truncate max-w-[100px]">
									{form.name}
								</p>
								<p className="text-xs text-zinc-500 capitalize">
									{form.role || "No role"}
								</p>
							</div>
						</div>
					)}

					{/* Tab buttons */}
					<nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
						{children}
					</nav>
				</div>
			</div>
		</React.Fragment>
	);
};

export default UserProfileNavbar;
