import React, { useState } from "react";
import { Card } from "../../../components/common/Card";
import type { Profile } from "./profile.types";

type UserprofileSidebarProps = {
	form?: Profile | null;
	children?: React.ReactNode;
};
const UserProfileSidebar: React.FC<UserprofileSidebarProps> = ({
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
				className="lg:col-span-1 animate-slide-up"
				style={{ animationDelay: "0.05s" }}
			>
				<Card className="p-2 sticky top-6">
					<nav className="flex flex-col gap-1">{children}</nav>
				</Card>
				{form.name && (
					<div className="mt-4 p-2 bg-white rounded-lg border border-zinc-800">
						<div className="flex items-center gap-2">
							<div
								className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
								style={{
									background: `${form.color}20`,
									border: `1px solid ${form.color}40`,
									color: form.color,
								}}
							>
								{form.name.charAt(0)}
							</div>
							<div className="text-left">
								<p className="text-xs font-semibold text-zinc-200 truncate max-w-[120px]">
									{form.name}
								</p>
								<p className="text-xs text-zinc-500 text-capitalize">
									{form.role || "No role"}
								</p>
							</div>
						</div>
					</div>
				)}
			</div>
		</React.Fragment>
	);
};

export default UserProfileSidebar;
