import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

type PageHeaderSectionProps = {
	headerText: string;
	subtitleText?: string;
	className?: string;
	children?: React.ReactNode;
	iconSize?: string;
	Icon?: LucideIcon;
	path?: string;
	badgeText?: string;
	metaText?: string | null;
};

export const PageHeader = ({
	headerText,
	subtitleText,
	className,
	iconSize,
	badgeText,
	children,
	Icon,
	path,
	metaText,
}: PageHeaderSectionProps) => {
	const navigate = useNavigate();
	const handlePathClick = () => {
		if (path) navigate(path);
	};
	return (
		<div className={className}>
			<div className="page-header-section">
				<div
					className="page-header-badge cursor-pointer"
					onClick={handlePathClick}
				>
					{Icon && <Icon size={iconSize ? iconSize : 16} />} {badgeText}
				</div>
				<h2 className="page-title-section">{headerText}</h2>
				<p className="page-subtitle">{subtitleText}</p>
				<p className="page-subtitle">{metaText}</p>
			</div>
			<div className="page-header-children-section">{children}</div>
		</div>
	);
};
