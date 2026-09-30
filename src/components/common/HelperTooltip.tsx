import { Info } from "lucide-react";

type HelperTooltipProps = {
	label?: string;
	text?: string;
	/**
	 * id of the input this tooltip describes. When provided, the tooltip
	 * text is wired into the input's own aria-describedby (by FormInput),
	 * so the info reaches assistive tech without this button needing to
	 * be its own Tab stop — see the notes on `tabIndex` below.
	 */
	descriptionId?: string;
};

export default function HelperTooltip({
	label = "field",
	text,
	descriptionId,
}: HelperTooltipProps) {
	if (!text) return null;

	return (
		<span className="form-helper-tooltip-wrap ">
			{/*
			 * Decorative/hover-only: the same text is exposed via the
			 * input's aria-describedby (see FormInput), so this button no
			 * longer needs to be a separate Tab stop between the field and
			 * whatever comes next — that was inserting an extra keyboard
			 * stop per field that didn't correspond to an actual control.
			 * Mouse/trackpad users still get it on hover via CSS; the
			 * `:focus-within` hover-reveal in input.css is now unreachable
			 * by keyboard, which is an accepted trade-off since the same
			 * content is already announced through the input itself.
			 */}
			<button
				type="button"
				className="form-helper-btn"
				aria-label={`Help for ${label}`}
				aria-hidden="true"
				tabIndex={-1}
			>
				<Info size={16} strokeWidth={2.5} />
			</button>

			<span id={descriptionId} className="form-helper-tooltip " role="tooltip">
				{text}
			</span>
		</span>
	);
}
