import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import Button from "../../../../../components/common/Button";

type SectionProps = {
	title: string;
	children: ReactNode;
	action?: ReactNode;
	className?: string;
	defaultOpen?: boolean;
};

const Section = ({
	title,
	children,
	action,
	className = "",
	defaultOpen = true,
}: SectionProps) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<div className={`mb-4 epf-section ${className}`}>
			<div className="epf-section-header">
				<Button
					type="button"
					onClick={() => setIsOpen((prev) => !prev)}
					className="flex items-center gap-2 p-0"
				>
					<ChevronDown
						className={`dropdown-icon-style transition-transform ${
							isOpen ? "rotate-0" : "-rotate-90"
						}`}
					/>

					<div className="epf-section-title-wrap">
						<span className="epf-section-label">{title}</span>
					</div>
				</Button>

				{action && <div className="epf-section-action">{action}</div>}
			</div>

			{isOpen && children}
		</div>
	);
};

export default Section;
