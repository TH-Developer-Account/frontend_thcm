// crf/core/CrfStatusPill.tsx
// Small status pill ("● Approved — ready to order") for the CRF card title.
// Used by the EPC view's "CRF Details" card (ActivityFormView); styles live in
// ./crfView.css (`crf-details-status*`).

import { CRF_STATUS_LABEL } from "../order/logic";
import type { CrfStatus } from "./types";
import "./crfView.css";

type StatusTone = "success" | "neutral" | "warning" | "danger";

const STATUS_TONE: Record<CrfStatus, StatusTone> = {
	OPEN: "neutral",
	APPROVED: "success",
	ORDERED: "success",
	CLOSED: "neutral",
	STOCK_SHORTFALL: "warning",
	STOCK_CHECK_FAILED: "danger",
	ORDER_FAILED: "danger",
};

export type CrfStatusPillProps = {
	status?: CrfStatus | null;
};

export default function CrfStatusPill({ status }: CrfStatusPillProps) {
	if (!status) return null;

	return (
		<span
			className={`crf-details-status crf-details-status--${STATUS_TONE[status] ?? "neutral"}`}
		>
			{CRF_STATUS_LABEL[status] ?? status}
		</span>
	);
}
