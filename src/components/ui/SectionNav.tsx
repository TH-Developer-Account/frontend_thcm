// SectionNav — vertical "on this page" navigation for long view / detail
// pages (submitted requests, vendor profiles, business partners).
//
// It is not a stepper: a submitted request is not an unfinished form, so
// sections show counts and optional status marks, not progress.
// Desktop: a sticky vertical list. Below 768px: a horizontally scrolling row.
//
//   <SectionNav
//     ariaLabel="Request sections"
//     title="Request details"
//     items={[
//       { value: "basic", label: "Basic details" },
//       { value: "attachments", label: "Attachments", count: 4 },
//       { value: "financial", label: "Financial impact", status: "warning" },
//     ]}
//     active={tab}
//     onChange={setTab}
//     sticky
//   />
import type { ComponentType, SVGProps } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

export type SectionNavStatus = "complete" | "warning" | "invalid";

export type SectionNavItem<T extends string> = {
	value: T;
	label: string;
	/** Item count, e.g. attachments or comments. 0 is shown. */
	count?: number;
	/** Mark from real data only (e.g. a section with missing information). */
	status?: SectionNavStatus;
	Icon?: ComponentType<SVGProps<SVGSVGElement>>;
	disabled?: boolean;
};

type SectionNavProps<T extends string> = {
	items: readonly SectionNavItem<T>[];
	active: T;
	onChange: (value: T) => void;
	ariaLabel: string;
	title?: string;
	/** Sticks below the app header while the page scrolls (desktop). */
	sticky?: boolean;
	className?: string;
};

const STATUS_META: Record<
	SectionNavStatus,
	{ Icon: ComponentType<SVGProps<SVGSVGElement>>; text: string }
> = {
	complete: { Icon: CheckCircle2, text: "complete" },
	warning: { Icon: AlertTriangle, text: "needs review" },
	invalid: { Icon: AlertCircle, text: "has errors" },
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

export function SectionNav<T extends string>({
	items,
	active,
	onChange,
	ariaLabel,
	title,
	sticky = false,
	className,
}: SectionNavProps<T>) {
	return (
		<nav
			className={joinClassNames(
				"section-nav",
				sticky && "section-nav-sticky",
				className,
			)}
			aria-label={ariaLabel}
		>
			{title ? <p className="section-nav-title">{title}</p> : null}

			<ul className="section-nav-list">
				{items.map((item) => {
					const isActive = item.value === active;
					const status = item.status ? STATUS_META[item.status] : null;

					return (
						<li key={item.value}>
							<button
								type="button"
								className={joinClassNames(
									"section-nav-item",
									isActive && "is-active",
									item.status && `is-${item.status}`,
								)}
								aria-current={isActive ? "true" : undefined}
								disabled={item.disabled}
								onClick={() => onChange(item.value)}
							>
								{item.Icon ? (
									<item.Icon className="section-nav-icon" aria-hidden="true" />
								) : null}

								<span className="section-nav-label">{item.label}</span>

								{typeof item.count === "number" ? (
									<span className="section-nav-count">
										{item.count}
										<span className="sr-only"> items</span>
									</span>
								) : null}

								{status ? (
									<span className="section-nav-status">
										<status.Icon aria-hidden="true" />
										<span className="sr-only">, {status.text}</span>
									</span>
								) : null}
							</button>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}

export default SectionNav;
