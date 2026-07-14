import type { MouseEventHandler } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type {
	PageNavigationButtonProps,
	PageNavigationProps,
} from "./pageNavigation.types";

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const PageNavigationButton = ({
	text,
	Icon,
	iconSize = 16,
	iconPosition = "left",
	to,
	direction,
	delta,
	onClick,
	className,
	ariaLabel,
	disabled = false,
}: PageNavigationButtonProps) => {
	const navigate = useNavigate();

	const isHistoryNavigation =
		typeof delta === "number" ||
		Boolean(to) ||
		direction === "back" ||
		direction === "forward";

	const ResolvedIcon =
		isHistoryNavigation && direction === "forward"
			? ArrowRight
			: isHistoryNavigation
				? ArrowLeft
				: Icon;

	const accessibleLabel =
		ariaLabel ?? text ?? (direction === "forward" ? "Go forward" : "Go back");

	const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
		if (disabled) return;

		if (onClick) {
			onClick(event);
			return;
		}

		if (typeof delta === "number") {
			navigate(delta);
			return;
		}

		if (to) {
			navigate(to);
			return;
		}

		if (direction === "forward") {
			navigate(1);
			return;
		}

		if (direction === "back") {
			navigate(-1);
		}
	};

	return (
		<button
			type="button"
			disabled={disabled}
			aria-label={accessibleLabel}
			className={joinClassNames(
				"page-navigation",
				"page-navigation-button",
				className,
			)}
			onClick={handleClick}
		>
			{iconPosition === "left" && ResolvedIcon ? (
				<ResolvedIcon
					className="page-navigation-button-icon"
					size={iconSize}
					strokeWidth={1.8}
					aria-hidden="true"
				/>
			) : null}

			{text ? (
				<span className="page-navigation-button-label">{text}</span>
			) : null}

			{iconPosition === "right" && ResolvedIcon ? (
				<ResolvedIcon
					className="page-navigation-button-icon"
					size={iconSize}
					strokeWidth={1.8}
					aria-hidden="true"
				/>
			) : null}
		</button>
	);
};

export default function PageNavigation(props: PageNavigationProps) {
	if (props.variant === "button") {
		return <PageNavigationButton {...props} />;
	}

	const {
		title,
		breadcrumbs,
		separator = "•",
		className,
		ariaLabel = "Breadcrumb",
	} = props;

	return (
		<div
			className={joinClassNames(
				"page-navigation",
				"page-navigation-breadcrumbs-layout",
				className,
			)}
		>
			{title ? <h2 className="page-navigation-title">{title}</h2> : null}

			<nav className="page-navigation-breadcrumbs" aria-label={ariaLabel}>
				<ol className="page-navigation-breadcrumb-list">
					{breadcrumbs.map((item, index) => {
						const isLast = index === breadcrumbs.length - 1;
						const key = `${item.href ?? "current"}-${item.label}-${index}`;

						return (
							<li key={key} className="page-navigation-breadcrumb-item">
								{item.href && !isLast ? (
									<Link
										to={item.href}
										className="page-navigation-breadcrumb-link"
									>
										{item.label}
									</Link>
								) : (
									<span
										className={joinClassNames(
											"page-navigation-breadcrumb-text",
											isLast && "page-navigation-breadcrumb-current",
										)}
										aria-current={isLast ? "page" : undefined}
									>
										{item.label}
									</span>
								)}

								{!isLast ? (
									<span
										className="page-navigation-breadcrumb-separator"
										aria-hidden="true"
									>
										{separator}
									</span>
								) : null}
							</li>
						);
					})}
				</ol>
			</nav>
		</div>
	);
}
