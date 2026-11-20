// components/CppSection.tsx — titled block inside the parent tab card.
// Tabs and the view page render their content inside ONE parent Card, so tabs
// no longer wrap themselves in a card. Sub-sections use this for their heading.
import type { ReactNode } from "react";

type CppSectionProps = {
	title?: ReactNode;
	subtitle?: ReactNode;
	className?: string;
	children: ReactNode;
};

const CppSection = ({
	title,
	subtitle,
	className = "",
	children,
}: CppSectionProps) => (
	<section className={`flex flex-col gap-3 ${className}`.trim()}>
		{title || subtitle ? (
			<header className="flex flex-col gap-0.5">
				{title ? (
					<h3 className="text-sm font-semibold text-slate-900">{title}</h3>
				) : null}
				{subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
			</header>
		) : null}
		{children}
	</section>
);

export default CppSection;
