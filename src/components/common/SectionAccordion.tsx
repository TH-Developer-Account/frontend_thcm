import { useId, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import Button from "./Button";

type SectionProps = {
	title: string;
	children: ReactNode;
	action?: ReactNode;
	className?: string;
	defaultOpen?: boolean;
};

const SectionAccordion = ({
	title,
	children,
	action,
	className = "",
	defaultOpen = true,
}: SectionProps) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const contentId = useId();

	const toggleSection = () => {
		setIsOpen((previous) => !previous);
	};

	return (
		<section className={`epf-section ${className}`}>
			<div className="epf-section-header">
				<Button
					type="button"
					onClick={toggleSection}
					appearance="transparent"
					variant="transparent"
					className="epf-section-trigger"
					aria-expanded={isOpen}
					aria-controls={contentId}
					aria-label={`${isOpen ? "Collapse" : "Expand"} ${title}`}
					Icon={isOpen ? ChevronDown : ChevronUp}
					iconPosition="right"
					size="sm"
					iconColor="var(--color-icon-brand)"
				>
					<span className="epf-section-title-wrap">
						<span className="epf-section-label">{title}</span>
					</span>
				</Button>

				{action ? <div className="epf-section-action">{action}</div> : null}
			</div>

			<div id={contentId} className="epf-section-content" hidden={!isOpen}>
				{children}
			</div>
		</section>
	);
};

export default SectionAccordion;
