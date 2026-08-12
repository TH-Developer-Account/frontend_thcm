import { Children, useId, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";

import Button from "./Button";

type SectionHeaderProps = {
	title: string;
	children?: ReactNode;
	action?: ReactNode;

	/**
	 * standard:
	 *   Simple section heading, equivalent to FormHeader.
	 *
	 * accordion:
	 *   Bordered collapsible section.
	 */
	variant?: "standard" | "accordion";

	/**
	 * Makes the section collapsible.
	 *
	 * Defaults to true for accordion and false for standard.
	 */
	collapsible?: boolean;

	defaultOpen?: boolean;

	Icon?: LucideIcon;
	iconColor?: string;

	/**
	 * Displayed when a collapsible section has no content.
	 */
	emptyMessage?: ReactNode;

	className?: string;
	headerClassName?: string;
	contentClassName?: string;
};

const hasRenderableContent = (children: ReactNode): boolean => {
	return Children.toArray(children).some((child) => {
		if (child === null || child === undefined || typeof child === "boolean") {
			return false;
		}

		if (typeof child === "string") {
			return child.trim().length > 0;
		}

		return true;
	});
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const SectionHeader = ({
	title,
	children,
	action,
	variant = "standard",
	collapsible = variant === "accordion",
	defaultOpen = true,
	Icon,
	iconColor = "var(--color-brand)",
	emptyMessage = "No information available.",
	className,
	headerClassName,
	contentClassName,
}: SectionHeaderProps) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	const contentId = useId();
	const hasContent = hasRenderableContent(children);

	const isAccordion = variant === "accordion";

	const toggleSection = () => {
		if (!collapsible) {
			return;
		}

		setIsOpen((previous) => !previous);
	};

	const headerContent = (
		<>
			{Icon ? (
				<Icon
					color={iconColor}
					size={15}
					strokeWidth={2.2}
					className="section-header-icon"
					aria-hidden="true"
				/>
			) : null}

			<span className="section-header-title-wrap">
				<span className="section-header-label">{title}</span>
			</span>
		</>
	);

	if (!isAccordion) {
		return (
			<section
				className={joinClassNames(
					"section-header",
					"section-header-standard",
					collapsible && "section-header-collapsible",
					className,
				)}
			>
				<div
					className={joinClassNames(
						"section-header-standard-row",
						headerClassName,
					)}
				>
					{collapsible ? (
						<Button
							type="button"
							onClick={toggleSection}
							appearance="transparent"
							variant="transparent"
							className="section-header-standard-trigger"
							aria-expanded={isOpen}
							aria-controls={contentId}
							aria-label={`${isOpen ? "Collapse" : "Expand"} ${title}`}
							Icon={isOpen ? ChevronDown : ChevronUp}
							iconPosition="right"
							size="sm"
							iconColor="var(--color-icon-brand)"
						>
							{headerContent}
						</Button>
					) : (
						<div className="section-header-standard-title">{headerContent}</div>
					)}

					{action ? (
						<div className="section-header-action">{action}</div>
					) : null}
				</div>

				{collapsible ? (
					<div
						id={contentId}
						className={joinClassNames(
							"section-header-standard-content",
							contentClassName,
						)}
						hidden={!isOpen}
					>
						{hasContent ? (
							children
						) : (
							<div className="section-header-empty" role="status">
								{emptyMessage}
							</div>
						)}
					</div>
				) : null}
			</section>
		);
	}

	return (
		<section
			className={joinClassNames(
				"section-header",
				"section-header-accordion",
				className,
			)}
		>
			<div
				className={joinClassNames(
					"section-header-accordion-header",
					headerClassName,
				)}
			>
				{collapsible ? (
					<Button
						type="button"
						onClick={toggleSection}
						appearance="transparent"
						variant="transparent"
						className="section-header-accordion-trigger"
						aria-expanded={isOpen}
						aria-controls={contentId}
						aria-label={`${isOpen ? "Collapse" : "Expand"} ${title}`}
						Icon={isOpen ? ChevronDown : ChevronUp}
						iconPosition="right"
						text={`${isOpen ? "Collapse" : "Expand"}`}
						size="sm"
						iconColor="var(--color-icon-brand)"
					>
						{headerContent}
					</Button>
				) : (
					<div className="section-header-accordion-title">{headerContent}</div>
				)}

				{action ? <div className="section-header-action">{action}</div> : null}
			</div>

			<div
				id={contentId}
				className={joinClassNames(
					"section-header-accordion-content",
					contentClassName,
				)}
				hidden={collapsible && !isOpen}
			>
				{hasContent ? (
					children
				) : (
					<div className="section-header-empty" role="status">
						{emptyMessage}
					</div>
				)}
			</div>
		</section>
	);
};

export default SectionHeader;
