// crf/order/CrfOrderSection.tsx
// CRF order section of the EPC view ("CRF Order" tab) — dispatches purely
// on the CRF's own `status` and `permissions` (crf.types.ts).
//
//   OPEN                      → notice: ordering opens after approval
//   APPROVED                  → dispatch details → Save & place order
//   STOCK_SHORTFALL           → 1) ShortfallPanel FIRST (alert + two options):
//                                  a) swap souvenir lines → "Save updated CRF"
//                                  b) continue with a debit note (local choice)
//                               2) then dispatch details → Save & place order
//   STOCK_CHECK_FAILED        → notice + Retry stock check (owner/admin only)
//   ORDER_FAILED              → notice + dispatch details → Save & retry order
//   ORDERED (crf.order set)   → order summary → Cancel
//   CLOSED, no order          → notice: no store order was placed
//
// SIMULATE DELIVERY ESTIMATE (test checkbox, top of the ordering flow)
//   unchecked (default) → the normal flow: recipient + shipping address form
//                         (PIN code is just a field in the address panel) and
//                         "Save & place order" is enabled straight away.
//   checked             → the two-step flow, driven by the MOCK estimate in
//                         order/api.ts (DELIVERY_ESTIMATE_USE_MOCK):
//                           step 1  delivery PIN → "Check delivery" → Continue
//                           step 2  recipient + address (pre-filled from the
//                                   PIN) with the estimated delivery date
//                         "Save & place order" stays disabled until step 2.
//                         The estimate is never sent to the backend.
//
// Footer buttons: only "Save & place order" (or "Save & retry order" after a
// failed attempt). The separate "Save dispatch details" button is commented
// out below — the combined button saves the dispatch details first and then
// places the order, so a standalone save was redundant.
//
// STOCK_CHECK_FAILED is handled as its own early branch, before the
// canEditDispatchDetails gate below: unlike ORDER_FAILED, a stock-check
// failure has nothing to do with dispatch details, so canEditDispatchDetails
// is false in this status (see crfAccess.helper.ts) and would otherwise
// bounce the owner to the generic "Waiting for the order" notice.
//
// Takes a bare `crfId`, NOT the EPC payload's embedded `crf` summary.
// GET /epc/:id's embedded crf (epcFullInfoSelect, shared/utils/contants.ts)
// only carries { id, epcId, status, items } — no permissions, no order, no
// souvenirTotalAtApproval, because those are computed by crf.service.ts's
// getCrfDetail specifically for GET /crf/:crfId, which the EPC endpoint
// never calls. This section needs permissions/order, so it fetches its own
// CRF detail (useCrfDetailQuery) instead of trusting the caller's summary.

import {
	CalendarClock,
	CircleAlert,
	Clock3,
	FileText,
	MapPin,
	PackageX,
	RefreshCcw,
	Truck,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import Button from "../../../../components/common/Button";
import { useCrfDetailQuery } from "../core/api";
import CrfOrderForm from "./OrderForm";
import OrderDeliveryCheck, {
	formatDeliveryDate,
	formatEstimatePlace,
} from "./OrderDeliveryCheck";
import {
	DebitNoteChoiceBanner,
	ReplaceItems,
	ShortfallPanel,
} from "./OrderShortfall";
import CrfView from "../core/CrfView";
import { formatCrfAmount, formatCrfQuantity } from "../core/schema";
import type { ApiCrfOrder, CrfDetail } from "../core/types";
import { mapOrderToLineItems } from "./logic";
import { OrderItemList, OrderTotals } from "./OrderSummary";
import { useCrfOrder } from "./useCrfOrder";
import { useDeliveryCheck } from "./useDeliveryCheck";
import "../core/styles.css";
import "./styles.css";

export type CrfOrderSectionProps = {
	/** The EPC's CRF id (e.g. epcData.crf?.id ?? null) — not the EPC payload's CRF summary itself. */
	crfId: string | null;
	onRefresh: () => void | Promise<void>;
};

const Notice = ({
	Icon,
	title,
	children,
}: {
	Icon: typeof Truck;
	title: string;
	children?: ReactNode;
}) => (
	<div className="crf-order-notice">
		<Icon aria-hidden="true" />
		<p className="crf-order-notice-title">{title}</p>
		{children ? <p className="crf-order-notice-text">{children}</p> : null}
	</div>
);

/* ========================================================================== */
/*                     Placed order (ORDERED) — CrfView card                   */
/* ========================================================================== */

const formatPlacedDate = (value?: string | null) => {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? null
		: date.toLocaleDateString("en-IN", {
				day: "numeric",
				month: "short",
				year: "numeric",
			});
};

/**
 * The store order as a <CrfView /> card: souvenir lines only, the Shopify
 * order id in the header, delivery details between the lines and the footer,
 * and order-level figures (placed on, debit note, order total) in the footer.
 * No cancel button here — `order.submitCancel` / `permissions.canCancelOrder`
 * are still wired in useCrfOrder; pass a <Button> through CrfView's `actions`
 * prop to bring it back.
 */
function PlacedOrder({ crf, order }: { crf: CrfDetail; order: ApiCrfOrder }) {
	const lines = mapOrderToLineItems(order, crf.items);
	const totalQty = order.lines.reduce(
		(sum, line) => sum + (Number(line.quantity) || 0),
		0,
	);
	// Printed materials / artworks are never part of the store order.
	const hasNonStoreLines = crf.items.some(
		(item) => item.category !== "SOUVENIR",
	);

	const place = [crf.addressCity, crf.addressDistrict, crf.addressState]
		.filter(Boolean)
		.join(", ");
	const address = [
		crf.addressCompany,
		crf.addressLine1,
		crf.addressLine2,
		crf.addressLandmark ? `Landmark: ${crf.addressLandmark}` : null,
		[place, crf.addressPincode].filter(Boolean).join(" - "),
		crf.addressCountry,
	]
		.filter(Boolean)
		.join(", ");

	const rows: { label: string; value?: string | null; wide?: boolean }[] = [
		{ label: "Recipient", value: crf.recipientName },
		{ label: "Phone", value: crf.recipientPhone },
		{ label: "Email", value: crf.recipientEmail },
		{ label: "Organisation", value: crf.recipientOrganisation },
		{ label: "Required by", value: formatPlacedDate(crf.requiredByDate) },
		{ label: "GSTIN", value: crf.addressGstin },
		{ label: "Shipping address", value: address, wide: true },
		{
			label: "Delivery instructions",
			value: crf.deliveryInstructions,
			wide: true,
		},
	].filter((row) => Boolean(row.value));

	const details =
		rows.length > 0 || hasNonStoreLines ? (
			<>
				{rows.length > 0 ? (
					<div className="crf-details-section">
						<div className="crf-details-section-head">
							<span className="crf-details-section-label">
								Delivery details
							</span>
						</div>
						<div className="crf-details-panel">
							<dl className="crf-order-details">
								{rows.map((row) => (
									<div
										key={row.label}
										className={row.wide ? "crf-order-details-wide" : undefined}
									>
										<dt>{row.label}</dt>
										<dd>{row.value}</dd>
									</div>
								))}
							</dl>
						</div>
					</div>
				) : null}

				{hasNonStoreLines ? (
					<p className="crf-details-note">
						Printed materials and artworks on this CRF aren't part of the store
						order — they are handled by the marketing team.
					</p>
				) : null}
			</>
		) : null;

	return (
		<CrfView
			items={lines}
			status="ORDERED"
			title="Store order"
			hideEmptySections
			headerNote={`Shopify order ${order.shopifyOrderId}`}
			details={details}
			stats={[
				{ label: "Items", value: order.lines.length },
				{ label: "Total qty", value: formatCrfQuantity(totalQty) },
				{ label: "Placed on", value: formatPlacedDate(order.placedAt) ?? "--" },
				{
					label: "Debit note (shortfall)",
					value:
						order.debitNoteAmount != null
							? formatCrfAmount(order.debitNoteAmount)
							: "--",
				},
			]}
			totalLabel="Order total"
			totalValue={Number(order.totalPrice) || 0}
		/>
	);
}

export default function CrfOrderSection({
	crfId,
	onRefresh,
}: CrfOrderSectionProps) {
	const detailQuery = useCrfDetailQuery(crfId);
	const crf = detailQuery.data ?? null;

	// Test switch: off = current flow, on = PIN check first (mock estimate).
	// Declared with the other hooks, above every early return.
	const [simulate, setSimulate] = useState(false);

	// Every order-step mutation (dispatch details, swap, place/retry/cancel,
	// stock-check retry) needs THIS query refetched — it's the one place
	// permissions/order/status live — not just the caller's onRefresh,
	// which only re-syncs the EPC-level payload (CrfSection's read-only
	// summary, tab labels, etc.).
	//
	// ONE refresh per user action: the two refetches run together (not one
	// after the other), and useCrfOrder calls this once per action — the
	// combined "Save & place order" saves with { refresh: false } and lets the
	// order call refresh.
	const refresh = async () => {
		await Promise.all([detailQuery.refetch(), onRefresh()]);
	};

	const order = useCrfOrder(crf, refresh);
	const delivery = useDeliveryCheck({
		crfId,
		values: order.values,
		setField: order.setField,
	});

	if (!crfId) {
		return (
			<Notice Icon={FileText} title="No CRF on this EPC">
				Add a CRF with souvenirs to order them from the store.
			</Notice>
		);
	}

	if (detailQuery.isLoading) {
		return <Notice Icon={Clock3} title="Loading order details…" />;
	}

	if (detailQuery.isError || !crf) {
		return (
			<div className="crf-order-alert" role="alert">
				<CircleAlert aria-hidden="true" />
				<div>
					<p className="crf-order-alert-title">
						Couldn't load the CRF order details
					</p>
					<p className="crf-order-alert-meta">Please try again.</p>
					<Button
						type="button"
						text="Retry"
						Icon={RefreshCcw}
						size="sm"
						appearance="standard"
						variant="outline"
						onClick={() => void detailQuery.refetch()}
					/>
				</div>
			</div>
		);
	}

	if (crf.status === "OPEN") {
		return (
			<Notice Icon={Clock3} title="Ordering opens after approval">
				Once the EPC is approved, the proposer enters the dispatch details here
				and the CRF souvenirs are ordered from the store.
			</Notice>
		);
	}

	if (crf.status === "ORDERED" && crf.order) {
		// Same card as the CRF view, fed with the placed order's lines.
		return <PlacedOrder crf={crf} order={crf.order} />;
	}

	if (crf.status === "CLOSED") {
		return (
			<Notice Icon={PackageX} title="No store order was placed">
				This CRF was closed without an order — usually because it had no
				souvenir lines to order.
			</Notice>
		);
	}

	if (crf.status === "STOCK_CHECK_FAILED") {
		return (
			<div className="crf-order-alert" role="alert">
				<CircleAlert aria-hidden="true" />
				<div>
					<p className="crf-order-alert-title">Couldn't check souvenir stock</p>
					<p className="crf-order-alert-meta">
						The souvenir store couldn't be reached after approval, so stock
						wasn't confirmed. This CRF is otherwise approved — retry once the
						store is back up.
					</p>
					{crf.permissions.canRetryStockCheck ? (
						<Button
							type="button"
							text={
								order.retryingStockCheck ? "Retrying…" : "Retry stock check"
							}
							Icon={Truck}
							size="sm"
							appearance="standard"
							variant="brand"
							disabled={order.retryingStockCheck}
							onClick={() => void order.submitRetryStockCheck()}
						/>
					) : null}
				</div>
			</div>
		);
	}

	if (order.souvenirLines.length === 0) {
		return (
			<Notice Icon={PackageX} title="Nothing to order from the store">
				This CRF has no souvenirs from the store. Printed materials and artworks
				are handled separately.
			</Notice>
		);
	}

	if (!crf.permissions.canEditDispatchDetails) {
		return (
			<Notice Icon={Truck} title="Waiting for the order">
				The CRF's owner will enter the dispatch details and place the store
				order.
			</Notice>
		);
	}

	/* --------------------------- Shortfall (first) --------------------------- */

	// STOCK_SHORTFALL: the alert + the two options come BEFORE any delivery /
	// shipping field. The shipping flow below only renders once the user has
	// swapped the lines (CRF back to APPROVED) or chosen the debit-note route
	// (order.step flips from "shortfall" to "dispatch").
	if (order.step === "shortfall") {
		return (
			<div className="crf-order">
				<ShortfallPanel order={order} />
			</div>
		);
	}

	if (order.step === "replace") {
		return (
			<div className="crf-order">
				<ReplaceItems order={order} />
			</div>
		);
	}

	/* ------------------------------ Ordering flow --------------------------- */

	// Simulation OFF → always "details" (the current flow, button enabled).
	// Simulation ON  → "pin" until a serviceable PIN is confirmed, then "details".
	const inPinStep = simulate && delivery.step === "pin";
	const inDetailsStep = !inPinStep;

	const pendingDebit = Number(
		(crf as { pendingDebitAmount?: number | string | null })
			.pendingDebitAmount ?? 0,
	);
	const etaLabel = simulate
		? formatDeliveryDate(delivery.estimate?.estimatedDeliveryDate)
		: null;
	const place = delivery.estimate ? formatEstimatePlace(delivery.estimate) : "";

	const toggleSimulate = (checked: boolean) => {
		setSimulate(checked);
		// Switching it on (or off) always restarts at the PIN step.
		delivery.change();
	};

	return (
		<div className="crf-order">
			{crf.status === "ORDER_FAILED" ? (
				<div className="crf-order-alert" role="alert">
					<CircleAlert aria-hidden="true" />
					<div>
						<p className="crf-order-alert-title">
							The last order attempt failed
						</p>
						<p className="crf-order-alert-meta">
							Check the dispatch details below (an invalid address is a common
							cause), then retry.
						</p>
					</div>
				</div>
			) : null}

			{/* Only present after "Continue with a debit note" was chosen. */}
			<DebitNoteChoiceBanner order={order} />

			{/* A swap that ends fully in stock moves the CRF back to APPROVED and
			    banks any UNSPENT shortfall budget as CRF.pendingDebitAmount,
			    which is added to the debit note when the order is placed. Show
			    it so the owner isn't surprised. NOTE: reads an optional field —
			    it only appears once GET /crf/:crfId returns pendingDebitAmount
			    (not in CrfDetail today). */}
			{pendingDebit > 0 ? (
				<div className="crf-order-alert" role="status">
					<FileText aria-hidden="true" />
					<div>
						<p className="crf-order-alert-title">
							A debit note of ₹{pendingDebit.toLocaleString("en-IN")} will be
							raised
						</p>
						<p className="crf-order-alert-meta">
							The replacement souvenirs cost less than the items that ran short.
							The unspent balance is added to the debit note when you place the
							order.
						</p>
					</div>
				</div>
			) : null}

			{/* TEST ONLY — remove once the delivery-estimate endpoint is live. */}
			<section className="crf-order-panel crf-order-sim">
				<label className="crf-order-sim-toggle">
					<input
						type="checkbox"
						checked={simulate}
						onChange={(event) => toggleSimulate(event.target.checked)}
					/>
					<span>
						Simulate delivery estimate
						<small>
							Test mode: check the delivery PIN code first (mock data), then
							fill in the recipient and address.
						</small>
					</span>
				</label>
			</section>

			<div className="crf-order-layout">
				<div className="crf-order-main">
					{inPinStep ? (
						<OrderDeliveryCheck order={order} delivery={delivery} />
					) : (
						<>
							{simulate ? (
								<div className="crf-order-delivering">
									<MapPin aria-hidden="true" />
									<p className="crf-order-delivering-text">
										Delivering to {delivery.pin}
										{place ? ` · ${place}` : ""}
										{etaLabel ? ` · by ${etaLabel}` : ""}
									</p>
									<button
										type="button"
										className="crf-order-link"
										onClick={delivery.change}
									>
										Change
									</button>
								</div>
							) : null}

							<CrfOrderForm
								order={order}
								estimate={simulate ? delivery.estimate : null}
							/>
						</>
					)}
				</div>

				<aside className="crf-order-aside" aria-label="Souvenirs to order">
					<div className="crf-order-summary">
						<h3 className="crf-order-panel-title">Souvenirs to order</h3>
						<OrderItemList lines={order.inStockLines} />
						<OrderTotals totals={order.souvenirTotals} />

						{simulate && inDetailsStep && etaLabel ? (
							<p className="crf-order-summary-eta">
								<CalendarClock aria-hidden="true" />
								Estimated delivery by {etaLabel}
							</p>
						) : null}

						{inPinStep ? (
							<p className="crf-order-summary-note">
								Enter the delivery PIN code first — then add the recipient and
								address to place the order.
							</p>
						) : null}

						<div className="crf-order-summary-actions">
							{/*
								 * Standalone "Save dispatch details" button — commented out on
								 * purpose. "Save & place order" below already saves the
								 * dispatch details first (submitDispatchDetails) and only then
								 * places the order. Restore this if a save-without-ordering
								 * action is needed again.
								 *
								<Button
									type="button"
									text={
										order.savingDispatchDetails
											? "Saving…"
											: "Save dispatch details"
									}
									size="sm"
									appearance="standard"
									variant="outline"
									disabled={order.savingDispatchDetails}
									onClick={() => void order.submitDispatchDetails()}
								/>
								*/}

							{/* APPROVED, or STOCK_SHORTFALL after a swap/debit-note choice.
							    In the debit-note case submitPlaceOrder() sends
							    acceptPartial: true on its own (order.partialAccepted).
							    Disabled only while the simulated PIN step is open. */}
							{crf.status === "APPROVED" || crf.status === "STOCK_SHORTFALL" ? (
								<Button
									type="button"
									text={order.placing ? "Placing order…" : "Save & place order"}
									Icon={Truck}
									size="md"
									appearance="standard"
									variant="brand"
									disabled={
										inPinStep ||
										order.placing ||
										order.savingDispatchDetails ||
										!crf.permissions.canPlaceOrder
									}
									onClick={async () => {
										if (await order.submitDispatchDetails({ refresh: false }))
											await order.submitPlaceOrder();
									}}
								/>
							) : null}

							{crf.status === "ORDER_FAILED" ? (
								<Button
									type="button"
									text={order.retrying ? "Retrying…" : "Save & retry order"}
									Icon={Truck}
									size="md"
									appearance="standard"
									variant="brand"
									disabled={
										inPinStep || order.retrying || order.savingDispatchDetails
									}
									onClick={async () => {
										if (await order.submitDispatchDetails({ refresh: false }))
											await order.submitRetry();
									}}
								/>
							) : null}
						</div>
					</div>
				</aside>
			</div>
		</div>
	);
}
