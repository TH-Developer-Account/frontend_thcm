import type { LucideIcon } from "lucide-react";

type PageHeaderSectionProps = {
	headerText: string;
	subtitleText?: string;
	className?: string;
	iconSize?: string;
	Icon?: LucideIcon;
	badgeText?: string;
};

export const PageHeader = ({
	headerText,
	subtitleText,
	className,
	iconSize,
	badgeText,
	Icon,
}: PageHeaderSectionProps) => {
	return (
		<div className={className}>
			<div className="page-header-section">
				<div className="page-header-badge">
					{Icon && <Icon size={iconSize ? iconSize : 16} />} {badgeText}
				</div>
				<h2 className="page-title-section ">{headerText}</h2>
				<p className="page-subtitle">{subtitleText}</p>
			</div>
		</div>
	);
};
