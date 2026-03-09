import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/components.css";
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
			className={`action-card ${
				isPrimary ? "action-card-primary" : "action-card-default"
			}`}
		>
			<div
				className={`action-card-body ${
					isPrimary ? "action-card-body-primary" : "action-card-body-default"
				}`}
			>
				<div className="action-card-icon">{icon}</div>

				<h3 className="action-card-title">{title}</h3>

				{description && (
					<p className="action-card-description">{description}</p>
				)}

				{subText && <p className="action-card-subtext">{subText}</p>}
			</div>
		</div>
	);
}

export default ActionCard;
