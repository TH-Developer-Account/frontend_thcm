const Section = ({ title, children }: any) => (
	/* ─── section wrapper ─────────────────────────────────────────────────────── */

	<div className="mb-8">
		<div className="epf-section-header">
			<span className="epf-section-label">{title}</span>
		</div>
		{children}
	</div>
);

export default Section;
