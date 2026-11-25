import type { LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

type CardEmptyProps = {
	title?: string;
	description?: string;
	Icon?: LucideIcon;
	iconPosition?: "left" | "right";
	iconSize?: number;
	iconColor?: CSSProperties["color"];
	/** Optional next step, e.g. an "Add comment" or "Upload" button. */
	action?: ReactNode;
};

export const CardEmpty = ({
	title,
	description,
	Icon,
	iconSize,
	iconColor,
	action,
}: CardEmptyProps) => {
	const iconStyle = iconColor ? { color: iconColor } : undefined;
	return (
		<div className="empty-block">
			{Icon ? (
				<span className="empty-block-icon">
					<Icon aria-hidden="true" size={iconSize} style={iconStyle} />
				</span>
			) : null}
			<div className="empty-block-copy">
				{title ? <p>{title}</p> : null}
				{description ? <span>{description}</span> : null}
				{action ? <div className="empty-block-action">{action}</div> : null}
			</div>
		</div>
	);
};

export const CardSkeleton = () => {
	return (
		<div
			className="block-loading"
			aria-label="Loading comments"
			aria-live="polite"
		>
			<div />
			<div />
			<div />
		</div>
	);
};
