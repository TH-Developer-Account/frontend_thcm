import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { HomeActionBadge } from "../constant";

interface ActionCardProps {
	icon: ReactNode;
	decorIcon?: ReactNode;
	title: string;
	description: string;
	path: string;
	appId: string;
	badge?: HomeActionBadge;
	isActive?: boolean;
	disabled?: boolean;
}

function ActionCard({
	icon,
	decorIcon,
	title,
	description,
	path,
	appId,
	badge,
	isActive = false,
	disabled = false,
}: ActionCardProps) {
	const navigate = useNavigate();

	const handleNavigate = () => {
		if (disabled) return;
		localStorage.setItem("appId", appId);
		navigate(path);
	};

	const BadgeIcon = badge?.icon;

	return (
		<article
			className={[
				"home-module-card",
				isActive ? "home-module-card-active" : "",
			]
				.filter(Boolean)
				.join(" ")}
		>
			<span aria-hidden="true" className="home-module-icon">
				{icon}
			</span>

			<div className="home-module-heading">
				<h2 className="home-module-title">{title}</h2>

				{badge && BadgeIcon ? (
					<span className="home-module-badge">
						<BadgeIcon aria-hidden="true" />
						{badge.label}
					</span>
				) : null}
			</div>

			<p className="home-module-description">{description}</p>

			{/* The button's ::after covers the card, so the whole card is
			    clickable while keyboard users get one Tab stop per module. */}
			<button
				type="button"
				className="home-module-cta"
				disabled={disabled}
				onClick={handleNavigate}
			>
				Open Module
				<span className="sr-only">: {title}</span>
				<ArrowRight aria-hidden="true" />
			</button>

			{decorIcon ? (
				<span aria-hidden="true" className="home-module-decor">
					{decorIcon}
				</span>
			) : null}
		</article>
	);
}

export default ActionCard;
