import { styles } from "../styles.constant";
import type { AlertCardProps } from "./common.types";

export function Alert({
	variant,
	title,
	description,
	primaryAction,
	secondaryAction,
}: AlertCardProps) {
	const { icon, iconBg } = styles[variant];

	return (
		<div className="alert-card">
			{/* Icon */}
			<div className={`alert-icon-wrapper ${iconBg}`}>
				<span className="alert-icon">{icon}</span>
			</div>

			{/* Content */}
			<h3 className="alert-title">{title}</h3>

			<p className="alert-description">{description}</p>

			{/* Actions */}
			<div className="alert-actions">
				<button onClick={primaryAction.onClick} className="alert-btn-primary">
					{primaryAction.label}
				</button>

				{secondaryAction && (
					<button
						onClick={secondaryAction.onClick}
						className="alert-btn-secondary"
					>
						{secondaryAction.label}
					</button>
				)}
			</div>
		</div>
	);
}
