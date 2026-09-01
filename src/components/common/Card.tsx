import {
	useId,
	useState,
	type ElementType,
	type HTMLAttributes,
	type ReactNode,
} from "react";
import {
	ChevronDown,
	ChevronsDown,
	ChevronsUp,
	type LucideIcon,
} from "lucide-react";

export type CardVariant = "default" | "subtle" | "outlined" | "flat";
export type CardPadding = "none" | "compact" | "default" | "spacious";
export type CardLayout = "default" | "listing";

export type CardSection = {
	/** Must be unique within the card. */
	id: string;
	title: ReactNode;
	subtitle?: ReactNode;
	Icon?: LucideIcon;
	iconColor?: string;
	actions?: ReactNode;
	children: ReactNode;
	defaultExpanded?: boolean;
	className?: string;
	headerClassName?: string;
	bodyClassName?: string;
};

export type CardProps = Omit<
	HTMLAttributes<HTMLElement>,
	"title" | "children"
> & {
	title?: ReactNode;
	subtitle?: ReactNode;
	actions?: ReactNode;
	size?: "default" | "small" | "medium" | "large";
	secondaryHeader?: ReactNode;
	children?: ReactNode;
	footer?: ReactNode;

	variant?: CardVariant;
	padding?: CardPadding;
	layout?: CardLayout;
	as?: ElementType;
	titleAs?: "h2" | "h3" | "h4" | "h5" | "h6";

	headerClassName?: string;
	secondaryHeaderClassName?: string;
	bodyClassName?: string;
	footerClassName?: string;

	loading?: boolean;
	disabled?: boolean;

	/** Renders compact, independently collapsible form sections. */
	sections?: readonly CardSection[];
	sectionTitleAs?: "h3" | "h4" | "h5" | "h6";

	/** Makes the entire card collapsible. */
	accordion?: boolean;
	defaultExpanded?: boolean;
	expanded?: boolean;
	onExpandedChange?: (expanded: boolean) => void;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

export default function Card({
	title,
	subtitle,
	actions,
	secondaryHeader,
	children,
	size = "default",
	footer,
	variant = "default",
	padding = "default",
	layout = "default",
	as: Component = "section",
	titleAs: TitleComponent = "h3",
	sectionTitleAs: SectionTitleComponent = "h4",
	className = "",
	headerClassName = "",
	secondaryHeaderClassName = "",
	bodyClassName = "",
	footerClassName = "",
	loading = false,
	disabled = false,
	sections = [],
	accordion = false,
	defaultExpanded = true,
	expanded,
	onExpandedChange,
	"aria-busy": ariaBusy,
	"aria-disabled": ariaDisabled,
	...props
}: CardProps) {
	const contentId = useId();
	const hasSections = sections.length > 0;

	const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

	const [expandedSections, setExpandedSections] = useState<
		Record<string, boolean>
	>(() =>
		Object.fromEntries(
			sections.map((section) => [section.id, section.defaultExpanded ?? true]),
		),
	);

	const isControlled = expanded !== undefined;

	const isExpanded = accordion
		? isControlled
			? expanded
			: internalExpanded
		: true;

	const isSectionExpanded = (section: CardSection): boolean =>
		expandedSections[section.id] ?? section.defaultExpanded ?? true;

	const allSectionsExpanded = hasSections && sections.every(isSectionExpanded);

	const hasHeader = Boolean(
		title || subtitle || actions || accordion || hasSections,
	);

	const hasSecondaryHeader = Boolean(secondaryHeader);
	const hasFooter = Boolean(footer);
	const toggleDisabled = disabled || loading;

	const handleToggle = () => {
		if (!accordion || toggleDisabled) return;

		const nextExpanded = !isExpanded;

		if (!isControlled) {
			setInternalExpanded(nextExpanded);
		}

		onExpandedChange?.(nextExpanded);
	};

	const handleSectionToggle = (section: CardSection) => {
		if (toggleDisabled) return;

		setExpandedSections((current) => ({
			...current,
			[section.id]: !isSectionExpanded(section),
		}));
	};

	const handleToggleAllSections = () => {
		if (toggleDisabled) return;

		const nextExpanded = !allSectionsExpanded;

		setExpandedSections((current) => ({
			...current,
			...Object.fromEntries(
				sections.map((section) => [section.id, nextExpanded]),
			),
		}));
	};

	return (
		<Component
			className={joinClassNames(
				"ui-card",
				`ui-card-${size}`,
				`ui-card-${variant}`,
				`ui-card-layout-${layout}`,
				accordion && "ui-card-accordion",
				accordion && isExpanded && "ui-card-accordion-expanded",
				hasSections && "ui-card-with-sections",
				disabled && "ui-card-disabled",
				loading && "ui-card-loading",
				className,
			)}
			aria-busy={ariaBusy ?? loading}
			aria-disabled={ariaDisabled ?? disabled}
			{...props}
		>
			{hasHeader ? (
				<header className={joinClassNames("ui-card-header", headerClassName)}>
					{accordion ? (
						<button
							type="button"
							className="ui-card-accordion-trigger"
							aria-expanded={isExpanded}
							aria-controls={contentId}
							disabled={toggleDisabled}
							onClick={handleToggle}
						>
							<span className="ui-card-header-copy">
								{title ? (
									<TitleComponent className="ui-card-title">
										{title}
									</TitleComponent>
								) : null}

								{subtitle ? (
									<span className="ui-card-subtitle">{subtitle}</span>
								) : null}
							</span>

							<ChevronDown
								className="ui-card-accordion-icon"
								size={18}
								aria-hidden="true"
							/>
						</button>
					) : title || subtitle ? (
						<div className="ui-card-header-copy">
							{title ? (
								<TitleComponent className="ui-card-title">
									{title}
								</TitleComponent>
							) : null}

							{subtitle ? (
								<div className="ui-card-subtitle">{subtitle}</div>
							) : null}
						</div>
					) : null}

					{actions || hasSections ? (
						<div className="ui-card-actions">
							{actions}

							{hasSections ? (
								<button
									type="button"
									className="ui-card-sections-toggle-all"
									disabled={toggleDisabled}
									onClick={handleToggleAllSections}
								>
									{allSectionsExpanded ? (
										<ChevronsUp size={15} aria-hidden="true" />
									) : (
										<ChevronsDown size={15} aria-hidden="true" />
									)}

									<span>
										{allSectionsExpanded ? "Collapse all" : "Expand all"}
									</span>
								</button>
							) : null}
						</div>
					) : null}
				</header>
			) : null}

			<div id={contentId} hidden={!isExpanded}>
				{hasSecondaryHeader ? (
					<div
						className={joinClassNames(
							"ui-card-secondary-header",
							secondaryHeaderClassName,
						)}
					>
						{secondaryHeader}
					</div>
				) : null}

				<div
					className={joinClassNames(
						"ui-card-body",
						`ui-card-body-${padding}`,
						bodyClassName,
					)}
				>
					{loading ? (
						<div
							className="ui-card-loading-state"
							role="status"
							aria-live="polite"
						>
							<span className="ui-card-loading-indicator" aria-hidden="true" />
							<span>Loading content…</span>
						</div>
					) : hasSections ? (
						<div className="ui-card-sections">
							{sections.map((section, index) => {
								const sectionExpanded = isSectionExpanded(section);

								const sectionContentId = `${contentId}-section-${index}`;
								const SectionIcon = section.Icon;

								return (
									<section
										key={section.id}
										className={joinClassNames(
											"ui-card-section",
											sectionExpanded && "ui-card-section-expanded",
											section.className,
										)}
									>
										<header
											className={joinClassNames(
												"ui-card-section-header",
												section.headerClassName,
											)}
										>
											<button
												type="button"
												className="ui-card-section-trigger"
												aria-expanded={sectionExpanded}
												aria-controls={sectionContentId}
												disabled={toggleDisabled}
												onClick={() => handleSectionToggle(section)}
											>
												<span className="ui-card-section-accent" />

												{SectionIcon ? (
													<SectionIcon
														size={15}
														strokeWidth={2.2}
														color={section.iconColor ?? "var(--color-brand)"}
														className="ui-card-section-leading-icon"
														aria-hidden="true"
													/>
												) : null}

												<span className="ui-card-section-heading">
													<SectionTitleComponent className="ui-card-section-title">
														{section.title}
													</SectionTitleComponent>

													{section.subtitle ? (
														<span className="ui-card-section-subtitle">
															{section.subtitle}
														</span>
													) : null}
												</span>

												<ChevronDown
													className="ui-card-section-chevron"
													size={17}
													aria-hidden="true"
												/>
											</button>

											{section.actions ? (
												<div className="ui-card-section-actions">
													{section.actions}
												</div>
											) : null}
										</header>

										<div
											id={sectionContentId}
											className={joinClassNames(
												"ui-card-section-body",
												section.bodyClassName,
											)}
											hidden={!sectionExpanded}
										>
											{section.children}
										</div>
									</section>
								);
							})}
						</div>
					) : (
						children
					)}
				</div>

				{hasFooter ? (
					<footer className={joinClassNames("ui-card-footer", footerClassName)}>
						{footer}
					</footer>
				) : null}
			</div>
		</Component>
	);
}
