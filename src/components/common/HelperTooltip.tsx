import { Info } from "lucide-react";

type HelperTooltipProps = {
	label?: string;
	text?: string;
};

export default function HelperTooltip({
	label = "field",
	text,
}: HelperTooltipProps) {
	if (!text) return null;

	return (
		<span className="form-helper-tooltip-wrap ">
			<button
				type="button"
				className="form-helper-btn"
				aria-label={`Help for ${label}`}
			>
				<Info size={11} strokeWidth={2.4} />
			</button>

			<span className="form-helper-tooltip " role="tooltip">
				{text}
			</span>
		</span>
	);
}
