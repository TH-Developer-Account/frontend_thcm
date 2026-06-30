import type { AvatarProps } from "./common.types";

const sizeClasses = {
	xs: "avatar-xs",
	sm: "avatar-sm",
	md: "avatar-md",
	lg: "avatar-lg",
} as const;

const joinClassNames = (...values: Array<string | undefined | false>) =>
	values.filter(Boolean).join(" ");

export default function Avatar({
	firstName,
	lastName = "",
	imageUrl,
	size = "md",
	className = "",
	isTooltip = false,
}: AvatarProps) {
	const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
	const fullName = `${firstName} ${lastName}`.trim() || "User";

	return (
		<span className="avatar-wrapper">
			<span
				tabIndex={isTooltip ? 0 : undefined}
				className={joinClassNames("avatar", sizeClasses[size], className)}
				aria-label={fullName}
			>
				{imageUrl ? (
					<img src={imageUrl} alt={fullName} className="avatar-image" />
				) : (
					<span aria-hidden="true">{initials || "U"}</span>
				)}
			</span>
			{isTooltip ? <span className="avatar-tooltip">{fullName}</span> : null}
		</span>
	);
}
