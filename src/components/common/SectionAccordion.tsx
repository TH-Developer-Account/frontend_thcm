import { Children, useId, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import Button from "./Button";

type SectionAccordionProps = {
	title: string;
	children?: ReactNode;
	action?: ReactNode;
	className?: string;
	defaultOpen?: boolean;
	emptyMessage?: ReactNode;
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

const SectionAccordion = ({
	title,
	children,
	action,
	className = "",
	defaultOpen = true,
	emptyMessage = "No information available.",
}: SectionAccordionProps) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	const contentId = useId();
	const hasContent = hasRenderableContent(children);

	const toggleSection = () => {
		setIsOpen((previous) => !previous);
	};

	return (
		<section
			className={["section-accordion", className].filter(Boolean).join(" ")}
		>
			<div className="section-accordion-header">
				<Button
					type="button"
					onClick={toggleSection}
					appearance="transparent"
					variant="transparent"
					className="section-accordion-trigger"
					aria-expanded={isOpen}
					aria-controls={contentId}
					aria-label={`${isOpen ? "Collapse" : "Expand"} ${title}`}
					Icon={isOpen ? ChevronDown : ChevronUp}
					iconPosition="right"
					size="sm"
					iconColor="var(--color-icon-brand)"
				>
					<span className="section-accordion-title-wrap">
						<span className="section-accordion-label">{title}</span>
					</span>
				</Button>

				{action ? (
					<div className="section-accordion-action">{action}</div>
				) : null}
			</div>

			<div
				id={contentId}
				className="section-accordion-content"
				hidden={!isOpen}
			>
				{hasContent ? (
					children
				) : (
					<div className="section-accordion-empty" role="status">
						{emptyMessage}
					</div>
				)}
			</div>
		</section>
	);
};

export default SectionAccordion;
