// crf/order/OrderTracking.tsx
// Placed-order view: status, the Shopify order id, the lines and amounts the
// backend actually stored (ApiCrfOrder), and a Cancel action.
//
// Replaces the earlier courier/timeline tracking UI (carrier, tracking
// number, delivery status, "Placed → Packed → Shipped → Out for delivery →
// Delivered") — none of that is in the real contract. ApiCrfOrder is just
// { id, crfId, shopifyOrderId, totalPrice, debitNoteAmount, status, lines }
// with status only ever "ORDERED" | "CANCELLED". There is nothing here to
// build a timeline from.

import { CircleCheck, FileText, PackageCheck, XCircle } from "lucide-react";
import React from "react";

import Button from "../../../../components/common/Button";
import { formatCrfAmount, formatCrfQuantity } from "../core/schema";
import type { ApiCrfOrder } from "../core/types";

export default function CrfOrderTracking({
	order,
	canCancel,
	onCancel,
	cancelling,
}: {
	order: ApiCrfOrder;
	canCancel: boolean;
	onCancel: (reason?: string) => void;
	cancelling: boolean;
}) {
	const [reason, setReason] = React.useState("");

	return (
		<div className="crf-track">
			<header className="crf-track-header">
				<div>
					<p className="crf-order-panel-description">Store order</p>
					<h3 className="crf-track-title">
						Shopify order {order.shopifyOrderId}
						<span
							className={`crf-track-status crf-track-status--${order.status === "ORDERED" ? "success" : "danger"}`}
						>
							{order.status === "ORDERED" ? <CircleCheck aria-hidden="true" /> : <XCircle aria-hidden="true" />}
							{order.status === "ORDERED" ? "Ordered" : "Cancelled"}
						</span>
					</h3>
				</div>
			</header>

			<section className="crf-track-card crf-track-card--wide">
				<h4 className="crf-track-card-title">
					<PackageCheck aria-hidden="true" /> Items
				</h4>
				<div className="crf-order-table-wrap">
					<table className="crf-order-table">
						<thead>
							<tr>
								<th scope="col">Item</th>
								<th scope="col" className="num">
									Qty
								</th>
								<th scope="col" className="num">
									Unit price
								</th>
								<th scope="col" className="num">
									Line total
								</th>
							</tr>
						</thead>
						<tbody>
							{order.lines.map((line) => (
								<tr key={line.sku}>
									<td>
										<span className="crf-order-item-title">{line.title}</span>
										<span className="crf-order-item-meta">SKU {line.sku}</span>
									</td>
									<td className="num">{formatCrfQuantity(line.quantity)}</td>
									<td className="num">{formatCrfAmount(line.unitPrice)}</td>
									<td className="num">{formatCrfAmount(line.lineTotal)}</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr>
								<th scope="row" colSpan={3}>
									Order total
								</th>
								<td className="num">{formatCrfAmount(order.totalPrice)}</td>
							</tr>
							{order.debitNoteAmount != null ? (
								<tr>
									<th scope="row" colSpan={3}>
										<FileText aria-hidden="true" /> Debit note (shortfall)
									</th>
									<td className="num">{formatCrfAmount(order.debitNoteAmount)}</td>
								</tr>
							) : null}
						</tfoot>
					</table>
				</div>
			</section>

			{canCancel ? (
				<div className="crf-order-panel">
					<div className="form-field">
						<div className="form-label-row">
							<label htmlFor="crf-order-cancel-reason" className="form-label">
								Cancellation reason (optional)
							</label>
						</div>
						<textarea
							id="crf-order-cancel-reason"
							className="form-input crf-order-textarea"
							rows={2}
							value={reason}
							onChange={(event) => setReason(event.target.value)}
						/>
					</div>
					<Button
						type="button"
						text={cancelling ? "Cancelling…" : "Cancel order"}
						Icon={XCircle}
						size="sm"
						appearance="standard"
						variant="outline"
						disabled={cancelling}
						onClick={() => onCancel(reason.trim() || undefined)}
					/>
				</div>
			) : null}
		</div>
	);
}
