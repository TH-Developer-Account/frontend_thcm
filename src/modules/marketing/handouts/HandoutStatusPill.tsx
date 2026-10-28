// handouts/HandoutStatusPill.tsx
// Status pill ("Approved, awaiting delivery"). Same idea as CrfStatusPill:
// label + tone maps live in handouts.constants.ts, styles in handouts.css.

import {
	HANDOUT_STATUS_LABEL,
	HANDOUT_STATUS_TONE,
} from "./handouts.constants";
import type { HandoutStatus } from "./handouts.types";

export default function HandoutStatusPill({
	status,
}: {
	status?: HandoutStatus | null;
}) {
	if (!status) return null;

	return (
		<span
			className={`handout-pill handout-pill--${HANDOUT_STATUS_TONE[status] ?? "neutral"}`}
		>
			{HANDOUT_STATUS_LABEL[status] ?? status}
		</span>
	);
}
