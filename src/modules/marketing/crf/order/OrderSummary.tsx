// crf/order/OrderSummary.tsx
// Shared bits for the CRF order screens: the souvenir-line summary (thumb,
// qty, pricing) and totals. Trimmed from the earlier version — the delivery-
// window / date formatting it used to carry only served the invented PIN
// delivery-estimate and courier-tracking UI, neither of which exists now.

import { getLinePricing, SHOP_PRICES_INCLUDE_GST, type LinePricing } from "../shop/mapper";
import type { CrfLineItem } from "../core/types";
import { CrfImage } from "../core/Media";
import { formatCrfAmount, formatCrfQuantity, getCrfLineKey } from "../core/schema";

/* ========================================================================== */
/*                                 Totals rows                                */
/* ========================================================================== */

export const OrderTotals = ({ totals, label = "Total" }: { totals: LinePricing; label?: string }) => (
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

export const OrderItemList = ({ lines }: { lines: CrfLineItem[] }) => (
	<ul className="crf-order-items">
		{lines.map((line) => {
			const pricing = getLinePricing(line);
			return (
				<li key={getCrfLineKey(line)} className="crf-order-item">
					<CrfImage src={line.imageUrl} alt="" category="SOUVENIR" className="crf-order-item-thumb" />
					<div className="crf-order-item-body">
						<span className="crf-order-item-title">{line.label}</span>
						<span className="crf-order-item-meta">
							{[line.variantTitle, line.sku && `SKU ${line.sku}`].filter(Boolean).join(" · ")}
						</span>
						<span className="crf-order-item-meta">
							{formatCrfAmount(line.rate)} × {formatCrfQuantity(line.quantity)}
							{line.gstRate !== null && line.gstRate !== undefined ? ` · GST ${line.gstRate}%` : ""}
						</span>
					</div>
					<div className="crf-order-item-aside">
						<span className="crf-order-item-total">{formatCrfAmount(pricing.total)}</span>
					</div>
				</li>
			);
		})}
	</ul>
);
