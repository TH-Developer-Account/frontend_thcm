import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

type CardEmptyProps = {
	title?: string;
	description?: string;
	Icon?: LucideIcon;
	iconPosition?: "left" | "right";
	iconSize?: number;
	iconColor?: CSSProperties["color"];
};

export const CardEmpty = ({
	title,
	description,
	Icon,
	iconSize,
	iconColor,
}: CardEmptyProps) => {
	const iconStyle = iconColor ? { color: iconColor } : undefined;
	return (
		<div className="empty-block">
			{Icon ? (
				<Icon
					aria-hidden="true"
					className="button-leading-icon"
					size={iconSize}
					style={iconStyle}
				/>
			) : null}
			<div className="empty-block-copy">
				<p>{title}</p>
				<span>{description}</span>
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
