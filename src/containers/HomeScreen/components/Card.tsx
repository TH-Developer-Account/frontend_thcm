import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
interface ActionCardProps {
	icon: ReactNode;
	title: string;
	description: string;
	path: string;
	appId: string;
	isActive?: boolean;
	disabled?: boolean;
}

function ActionCard({
	icon,
	title,
	description,
	path,
	appId,
	isActive = false,
	disabled = false,
}: ActionCardProps) {
	const navigate = useNavigate();

	const handleNavigate = () => {
		if (disabled) return;
		localStorage.setItem("appId", appId);
		navigate(path);
	};

	return (
		<button
			type="button"
			aria-label={`Open ${title}`}
			disabled={disabled}
			onClick={handleNavigate}
			className={`action-card${isActive ? " action-card-active" : ""}`}
		>
			{isActive ? <span className="action-card-badge">Active</span> : null}

			<span aria-hidden="true" className="action-card-icon">
				{icon}
			</span>

			<span className="action-card-copy">
				<span className="action-card-title">{title}</span>
				<span className="action-card-description">{description}</span>
			</span>

			<span aria-hidden="true" className="action-card-arrow">
				<ArrowRight />
			</span>
		</button>
	);
}

export default ActionCard;
