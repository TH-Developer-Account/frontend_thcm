import type {
	ManagementAvatarGroupProps,
	ManagementIdentityCellProps,
	ManagementValueCellProps,
} from "./ManagementTable/ManagementTable.types";

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const getInitials = (value: string): string =>
	value
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part.charAt(0))
		.join("")
		.toUpperCase();

export function ManagementIdentityCell({
	title,
	subtitle,
	imageUrl,
	initials,
	alt = "",
	meta,
	className,
}: ManagementIdentityCellProps) {
	const fallback =
		initials || (typeof title === "string" ? getInitials(title) : "--");

	return (
		<div className={joinClassNames("management-identity-cell", className)}>
			<div className="management-identity-avatar" aria-hidden={!alt}>
				{imageUrl ? (
					<img src={imageUrl} alt={alt} loading="lazy" />
				) : (
					<span>{fallback}</span>
				)}
			</div>

			<div className="management-identity-copy">
				<div className="management-identity-title">{title}</div>
				{subtitle ? (
					<div className="management-identity-subtitle">{subtitle}</div>
				) : null}
				{meta ? <div className="management-identity-meta">{meta}</div> : null}
			</div>
		</div>
	);
}

export function ManagementAvatarGroup({
	items,
	max = 4,
	size = "sm",
	className,
}: ManagementAvatarGroupProps) {
	const visibleItems = items.slice(0, Math.max(0, max));
	const overflowCount = Math.max(0, items.length - visibleItems.length);

	return (
		<div
			className={joinClassNames(
				"management-avatar-group",
				`management-avatar-group-${size}`,
				className,
			)}
			aria-label={`${items.length} members`}
		>
			{visibleItems.map((item) => (
				<div
					key={item.id}
					className="management-avatar-group-item"
					title={item.name}
				>
					{item.imageUrl ? (
						<img src={item.imageUrl} alt={item.name} loading="lazy" />
					) : (
						<span>{item.initials || getInitials(item.name)}</span>
					)}
				</div>
			))}

			{overflowCount > 0 ? (
				<div
					className="management-avatar-group-item management-avatar-group-overflow"
					title={`${overflowCount} more`}
				>
					+{overflowCount}
				</div>
			) : null}
		</div>
	);
}

export function ManagementValueCell({
	primary,
	secondary,
	className,
}: ManagementValueCellProps) {
	return (
		<div className={joinClassNames("management-value-cell", className)}>
			<div className="management-value-primary">{primary}</div>
			{secondary ? (
				<div className="management-value-secondary">{secondary}</div>
			) : null}
		</div>
	);
}
