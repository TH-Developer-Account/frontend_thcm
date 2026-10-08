// crf/crf.order.summary.tsx
// Shared bits for the CRF order screens: the item summary (thumb, qty,
// pricing) and date helpers.

import type { ReactNode } from "react";

import { CrfImage } from "./crf.media";
import { getOrderLinePricing } from "./crf.order.logic";
import type { CrfOrderLine } from "./crf.order.types";
import type { LinePricing } from "./crf.shop.mapper";
import { SHOP_PRICES_INCLUDE_GST } from "./crf.shop.mapper";
import { formatCrfAmount, formatCrfQuantity } from "./crf.schema";

/* ========================================================================== */
/*                                   Dates                                    */
/* ========================================================================== */

const toDate = (value?: string | null) => {
	if (!value) return null;
	const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
	return Number.isNaN(date.getTime()) ? null : date;
};

/** "Tue, 13 Oct" */
export const formatShortDate = (value?: string | null) =>
	toDate(value)?.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) ?? "--";

/** "13 Oct 2026" */
export const formatLongDate = (value?: string | null) =>
	toDate(value)?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) ?? "--";

/** "13 Oct 2026, 4:05 pm" */
export const formatDateTime = (value?: string | null) =>
	toDate(value)?.toLocaleString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}) ?? "--";

export const formatDeliveryWindow = (from?: string | null, to?: string | null) =>
	!from ? "--" : from === to || !to ? formatShortDate(from) : `${formatShortDate(from)} – ${formatShortDate(to)}`;

/* ========================================================================== */
/*                                 Totals rows                                */
/* ========================================================================== */

export const OrderTotals = ({ totals, label = "Order total" }: { totals: LinePricing; label?: string }) => (
	<dl className="crf-order-totals">
		{totals.discount > 0 ? (
			<>
				<div>
					<dt>MRP</dt>
					<dd>{formatCrfAmount(totals.mrpAmount)}</dd>
				</div>
				<div className="crf-order-totals-discount">
					<dt>Discount</dt>
					<dd>− {formatCrfAmount(totals.discount)}</dd>
				</div>
			</>
		) : null}
		<div>
			<dt>Taxable value</dt>
			<dd>{formatCrfAmount(totals.taxable)}</dd>
		</div>
		<div>
			<dt>GST{SHOP_PRICES_INCLUDE_GST ? " (included)" : ""}</dt>
			<dd>{formatCrfAmount(totals.gst)}</dd>
		</div>
		<div className="crf-order-totals-grand">
			<dt>{label}</dt>
			<dd>{formatCrfAmount(totals.total)}</dd>
		</div>
	</dl>
);

/* ========================================================================== */
/*                                 Item list                                  */
/* ========================================================================== */

type OrderItemListProps = {
	lines: CrfOrderLine[];
	/** Extra content on the right of each row (e.g. a stock badge). */
	renderAside?: (line: CrfOrderLine) => ReactNode;
};

export const OrderItemList = ({ lines, renderAside }: OrderItemListProps) => (
	<ul className="crf-order-items">
		{lines.map((line) => {
			const pricing = getOrderLinePricing(line);
			return (
				<li key={line.key} className="crf-order-item">
					<CrfImage src={line.imageUrl} alt="" category="SOUVENIR" className="crf-order-item-thumb" />
					<div className="crf-order-item-body">
						<span className="crf-order-item-title">
							{line.title}
							{line.isReplacement ? <span className="crf-badge crf-badge--new">Replacement</span> : null}
						</span>
						<span className="crf-order-item-meta">
							{[line.variantTitle, `SKU ${line.sku}`].filter(Boolean).join(" · ")}
						</span>
						<span className="crf-order-item-meta">
							{formatCrfAmount(line.unitPrice)} × {formatCrfQuantity(line.quantity)}
							{line.gstRate !== null ? ` · GST ${line.gstRate}%` : ""}
						</span>
					</div>
					<div className="crf-order-item-aside">
						<span className="crf-order-item-total">{formatCrfAmount(pricing.total)}</span>
						{renderAside?.(line)}
					</div>
				</li>
			);
		})}
	</ul>
);
