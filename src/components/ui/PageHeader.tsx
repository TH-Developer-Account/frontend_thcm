import type { NavigateButtonProps } from "../common/common.types";
import NavigateButton from "../common/NavigateButton";

type PageHeaderSectionProps = {
	headerText?: string;
	subtitleText?: string;
	className?: string;
	children?: React.ReactNode;
	metaText?: string | null;
	badgeProps?: NavigateButtonProps;
};

export const PageHeader = ({
	headerText,
	subtitleText,
	className = "",
	children,
	metaText,
	badgeProps,
}: PageHeaderSectionProps) => {
	return (
		<div className={className}>
			<div className="page-header-section">
				{badgeProps && (
					<NavigateButton
						{...badgeProps}
						className={`page-header-badge ${badgeProps.className ?? ""}`}
					/>
				)}

				<h2 className="page-title-section">{headerText}</h2>

				{subtitleText && <p className="page-subtitle">{subtitleText}</p>}

				{metaText && <p className="page-subtitle">{metaText}</p>}
			</div>

			<div className="page-header-children-section">{children}</div>
		</div>
	);
};
