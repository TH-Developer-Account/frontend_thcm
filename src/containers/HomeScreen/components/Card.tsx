import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface ActionCardProps {
	icon: ReactNode;
	title: string;
	description: string;
	subText: string;
	path: string;
	isPrimary?: boolean;
}

function ActionCard({
	icon,
	title,
	description,
	subText,
	path,
	isPrimary = false,
}: ActionCardProps) {
	const navigate = useNavigate();
	return (
		<div
			onClick={() => navigate(path)}
			className={`
				group
				cursor-pointer
				rounded-2xl
				transition-all
				duration-200
				ease-in-out
				border
				${
					isPrimary
						? "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 shadow-md"
						: "bg-gray-50 border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]"
				}
			`}
		>
			<div>
				<div
					className={`
						
						rounded-xl p-3
						transition-colors duration-200
						${
							isPrimary
								? "bg-orange-200 text-orange-700"
								: " text-orange-500 group-hover:bg-orange-100 group-hover:text-orange-600"
						}
					`}
				>
					<div className="flex items-center justify-center">{icon}</div>

					<h3 className="text-lg font-semibold text-gray-800">{title}</h3>

					{description && (
						<p className="text-sm text-gray-600 mt-1">{description}</p>
					)}

					{subText && (
						<p className="text-xs text-orange-600 mt-2 font-medium">
							{subText}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

export default ActionCard;
