type SectionProps = {
	title: string;
	children: React.ReactNode;
	action?: React.ReactNode;
};

const Section = ({ title, children, action }: SectionProps) => {
	return (
		<div className="mb-4 epf-section">
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
