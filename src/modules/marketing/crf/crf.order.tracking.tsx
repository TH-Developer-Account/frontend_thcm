// crf/crf.order.tracking.tsx
// Tracking for a placed CRF order: status timeline, courier, delivery
// window, items, addresses, and the debit note if one was raised.

import {
	CircleAlert,
	CircleCheck,
	Copy,
	ExternalLink,
	FastForward,
	FileText,
	MapPin,
	RefreshCcw,
	RotateCcw,
	Truck,
	UserRound,
} from "lucide-react";
import React from "react";

import Button from "../../../components/common/Button";
import { DebitNoteDocument, DebitNoteDownloadButton, useDebitNotePdf } from "./crf.debit-note";
import { CRF_ORDER_STATUS_LABEL, getTrackingSteps } from "./crf.order.logic";
import { OrderItemList, OrderTotals, formatDateTime, formatDeliveryWindow } from "./crf.order.summary";
import type { CrfOrderRecord } from "./crf.order.types";

type CrfOrderTrackingProps = {
	record: CrfOrderRecord;
	refreshing: boolean;
	onRefresh: () => void;
	/** Mock only. */
	dev?: { onAdvance: () => void; onReset: () => void };
};

const STATUS_TONE: Record<CrfOrderRecord["status"], string> = {
	ORDER_CREATED: "info",
	PARTIALLY_FULFILLED: "warning",
	SHIPPED: "info",
	DELIVERED: "success",
	DELIVERY_FAILED: "danger",
	CANCELLED: "danger",
};

export default function CrfOrderTracking({ record, refreshing, onRefresh, dev }: CrfOrderTrackingProps) {
	const { shopOrder, payload } = record;
	const steps = getTrackingSteps(shopOrder);
	const pdf = useDebitNotePdf(record.debitNote);
	const [showNote, setShowNote] = React.useState(false);

	// The note must be visible for the PDF capture → open it, then capture.
	const downloadNote = () => {
		setShowNote(true);
		requestAnimationFrame(() => requestAnimationFrame(() => void pdf.download()));
	};

	const copyTracking = () => {
		if (shopOrder.trackingNumber) void navigator.clipboard?.writeText(shopOrder.trackingNumber);
	};

	const shipping = payload.shippingAddress;

	return (
		<div className="crf-track">
			{/* ------------------------------ Header ------------------------------ */}
			<header className="crf-track-header">
				<div>
					<p className="crf-order-panel-description">Store order</p>
					<h3 className="crf-track-title">
						#{shopOrder.id}
						<span className={`crf-track-status crf-track-status--${STATUS_TONE[record.status]}`}>
							{CRF_ORDER_STATUS_LABEL[record.status]}
						</span>
					</h3>
					<p className="crf-order-panel-description">
						Placed {formatDateTime(record.placedAt)} by {record.placedBy.name} · Shopify ID {shopOrder.shopifyOrderId}
					</p>
				</div>
				<div className="crf-track-actions">
					{dev ? (
						<>
							<Button type="button" text="Next status (mock)" Icon={FastForward} size="sm" appearance="standard" variant="outline" onClick={dev.onAdvance} />
							<Button type="button" text="Reset order (mock)" Icon={RotateCcw} size="sm" appearance="standard" variant="outline" onClick={dev.onReset} />
						</>
					) : null}
					<Button
						type="button"
						text={refreshing ? "Refreshing…" : "Refresh"}
						Icon={RefreshCcw}
						size="sm"
						appearance="standard"
						variant="outline"
						disabled={refreshing}
						onClick={onRefresh}
					/>
				</div>
			</header>

			{/* ----------------------------- Timeline ----------------------------- */}
			<ol className="crf-track-steps" aria-label="Order progress">
				{steps.map((step) => (
					<li key={step.key} className={`crf-track-step crf-track-step--${step.state}`} aria-current={step.state === "current" ? "step" : undefined}>
						<span className="crf-track-dot" aria-hidden="true">
							{step.state === "done" ? <CircleCheck /> : step.state === "error" ? <CircleAlert /> : null}
						</span>
						<span className="crf-track-step-label">{step.label}</span>
						{step.hint ? <span className="crf-track-step-hint">{step.hint}</span> : null}
					</li>
				))}
			</ol>

			{/* ------------------------------ Cards ------------------------------- */}
			<div className="crf-track-grid">
				<section className="crf-track-card">
					<h4 className="crf-track-card-title">
						<Truck aria-hidden="true" /> Shipment
					</h4>
					{shopOrder.trackingNumber ? (
						<dl className="crf-track-dl">
							<div>
								<dt>Courier</dt>
								<dd>{shopOrder.carrier ?? "--"}</dd>
							</div>
							<div>
								<dt>Tracking no.</dt>
								<dd className="crf-track-awb">
									{shopOrder.trackingNumber}
									<button type="button" className="crf-link-button crf-link-button--neutral" onClick={copyTracking} aria-label="Copy tracking number">
										<Copy aria-hidden="true" />
									</button>
								</dd>
							</div>
							{shopOrder.trackingUrl ? (
								<div>
									<dt>Track</dt>
									<dd>
										<a href={shopOrder.trackingUrl} target="_blank" rel="noreferrer" className="crf-track-link">
											Courier site <ExternalLink aria-hidden="true" />
										</a>
									</dd>
								</div>
							) : null}
						</dl>
					) : (
						<p className="crf-order-panel-description">Not shipped yet — courier details appear once the store dispatches.</p>
					)}
					<dl className="crf-track-dl">
						<div>
							<dt>{shopOrder.deliveryStatus === "delivered" ? "Delivered" : "Expected"}</dt>
							<dd>
								{shopOrder.deliveryStatus === "delivered"
									? formatDateTime(shopOrder.closedAt ?? shopOrder.updatedAt)
									: formatDeliveryWindow(payload.deliveryEstimate.fromDate, payload.deliveryEstimate.toDate)}
							</dd>
						</div>
						<div>
							<dt>Last update</dt>
							<dd>{formatDateTime(shopOrder.updatedAt)}</dd>
						</div>
					</dl>
				</section>

				<section className="crf-track-card">
					<h4 className="crf-track-card-title">
						<MapPin aria-hidden="true" /> Deliver to
					</h4>
					<address className="crf-track-address">
						<strong>
							{payload.recipient.name}
						</strong>
						{shipping.company ? <span>{shipping.company}</span> : null}
						<span>{shipping.address1}</span>
						{shipping.address2 ? <span>{shipping.address2}</span> : null}
						<span>
							{shipping.city}, {shipping.province} {shipping.zip}
						</span>
					</address>
					<p className="crf-track-contact">
						<UserRound aria-hidden="true" /> {payload.recipient.phone}
						{payload.recipient.email ? ` · ${payload.recipient.email}` : ""}
					</p>
					{payload.recipient.deliveryInstructions ? (
						<p className="crf-order-panel-description">“{payload.recipient.deliveryInstructions}”</p>
					) : null}
				</section>

				<section className="crf-track-card crf-track-card--wide">
					<h4 className="crf-track-card-title">Items</h4>
					<OrderItemList lines={payload.lines} />
					<OrderTotals totals={payload.totals} />
					{payload.shortfall.type === "REPLACED" ? (
						<p className="crf-order-summary-note">
							Some approved items were short at order time and were replaced with other souvenirs.
						</p>
					) : null}
				</section>
			</div>

			{/* ---------------------------- Debit note ---------------------------- */}
			{record.debitNote ? (
				<section className="crf-track-card crf-track-card--wide">
					<div className="crf-track-card-row">
						<h4 className="crf-track-card-title">
							<FileText aria-hidden="true" /> Debit note {record.debitNote.number}
						</h4>
						<div className="crf-track-actions">
							<Button
								type="button"
								text={showNote ? "Hide" : "View"}
								size="sm"
								appearance="standard"
								variant="outline"
								onClick={() => setShowNote((v) => !v)}
							/>
							<DebitNoteDownloadButton downloading={pdf.downloading} onClick={downloadNote} />
						</div>
					</div>
					<div className="crf-dn-frame" hidden={!showNote}>
						<DebitNoteDocument ref={pdf.ref} note={record.debitNote} />
					</div>
				</section>
			) : null}
		</div>
	);
}
