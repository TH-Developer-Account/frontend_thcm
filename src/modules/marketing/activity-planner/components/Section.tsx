import type { ReactNode } from "react";

type SectionProps = {
	title: string;
	children: ReactNode;
	action?: ReactNode;
	className?: string;
};

const Section = ({ title, children, action, className = "" }: SectionProps) => {
	return (
		<div className={`mb-4 epf-section ${className}`}>
			<div className="epf-section-header">
				<div className="epf-section-title-wrap">
					<span className="epf-section-label">{title}</span>
				</div>

				{action && <div className="epf-section-action">{action}</div>}
			</div>

			{children}
		</div>
	);
};

export default Section;
