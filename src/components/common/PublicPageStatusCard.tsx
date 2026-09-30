import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ShieldCheck } from "lucide-react";

import Card from "./Card";

/**
 * Shared "in-between" state for the public, unauthenticated flows
 * (Vendor Onboarding, Medical Claim): validating a link, a link that's
 * expired/invalid, or a confirmation after a successful submission.
 *
 * Renders inside the existing `Card` + `PublicPagesLayout` shell so it
 * picks up the design system's surface, border and shadow tokens as-is —
 * this component only owns the icon/copy/notice/action layout and the
 * `public-page-status-*` classes in layout.css.
 */

export type PublicPageStatusVariant = "loading" | "success" | "warning" | "error";

export type PublicPageStatusNotice = {
	title: string;
	description: string;
	Icon?: LucideIcon;
};

export type PublicPageStatusAction = {
	label: string;
	to: string;
	Icon?: LucideIcon;
};

export type PublicPageStatusCardProps = {
	variant: PublicPageStatusVariant;
	/** Leading icon in the circular badge at the top of the card. */
	Icon: LucideIcon;
	title: string;
	description: ReactNode;
	/** Optional highlighted callout, e.g. "Check your email". */
	notice?: PublicPageStatusNotice;
	/** Optional plain-text helper block, e.g. contact-support copy on an expired link. */
	help?: ReactNode;
	/** Optional small print under the notice, e.g. "This secure session will close automatically." */
	securityNote?: string;
	/** Optional primary action link, e.g. "Log in to Tata Hitachi". */
	action?: PublicPageStatusAction;
	/** ARIA live-region role for the whole card. Use "alert" for error/expired states. */
	role?: "status" | "alert";
	ariaLive?: "polite" | "assertive" | "off";
	ariaBusy?: boolean;
	className?: string;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

export default function PublicPageStatusCard({
	variant,
	Icon,
	title,
	description,
	notice,
	help,
	securityNote,
	action,
	role = "status",
	ariaLive = "polite",
	ariaBusy = false,
	className = "",
}: PublicPageStatusCardProps) {
	const NoticeIcon = notice?.Icon;
	const ActionIcon = action?.Icon ?? ArrowRight;

	return (
		<Card
			padding="spacious"
			className={joinClassNames("public-page-status-card", className)}
		>
			<div
				className="public-page-status-content"
				role={role}
				aria-live={role === "status" ? ariaLive : undefined}
				aria-busy={ariaBusy || undefined}
			>
				<div
					className={joinClassNames(
						"public-page-status-icon",
						`public-page-status-icon--${variant}`,
					)}
				>
					<Icon
						aria-hidden="true"
						className={variant === "loading" ? "public-page-status-spin" : undefined}
					/>
				</div>

				<div className="public-page-status-copy">
					<h1 className="public-page-status-title">{title}</h1>
					<p className="public-page-status-description">{description}</p>
				</div>

				{notice ? (
					<div className="public-page-status-notice">
						{NoticeIcon ? (
							<NoticeIcon
								className="public-page-status-notice-icon"
								aria-hidden="true"
							/>
						) : null}

						<div>
							<p className="public-page-status-notice-title">{notice.title}</p>
							<p className="public-page-status-notice-description">
								{notice.description}
							</p>
						</div>
					</div>
				) : null}

				{help ? <div className="public-page-status-help">{help}</div> : null}

				{securityNote ? (
					<div className="public-page-status-security">
						<ShieldCheck aria-hidden="true" />
						<span>{securityNote}</span>
					</div>
				) : null}

				{action ? (
					<Link to={action.to} className="public-page-status-link">
						{action.label}
						<ActionIcon aria-hidden="true" />
					</Link>
				) : null}
			</div>
		</Card>
	);
}
