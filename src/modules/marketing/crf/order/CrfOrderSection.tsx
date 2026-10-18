// crf/order/CrfOrderSection.tsx
// CRF order section of the EPC view ("CRF Order" tab) — dispatches purely
// on the CRF's own `status` and `permissions` (crf.types.ts).
//
//   OPEN                      → notice: ordering opens after approval
//   APPROVED                  → delivery PIN → dispatch details → Place order
//   STOCK_SHORTFALL           → delivery PIN → dispatch details → ShortfallPanel
//   STOCK_CHECK_FAILED        → notice + Retry stock check (owner/admin only)
//   ORDER_FAILED              → notice + delivery PIN → dispatch details → Retry order
//   ORDERED (crf.order set)   → order summary → Cancel
//   CLOSED, no order          → notice: no store order was placed
//
// The ordering flow has two steps (useDeliveryCheck): 1) the delivery PIN
// code, which fetches a delivery estimate; 2) recipient + shipping address.
// The "Souvenirs to order" summary sits beside both and only offers the
// save / place-order buttons once the second step is reached.
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
	PackageX,
	RefreshCcw,
	Truck,
} from "lucide-react";
import type { ReactNode } from "react";

import Button from "../../../../components/common/Button";
import { useCrfDetailQuery } from "../core/api";
import CrfOrderForm from "./OrderForm";
import { formatDeliveryDate } from "./OrderDeliveryCheck";
import { ReplaceItems, ShortfallPanel } from "./OrderShortfall";
import CrfOrderTracking from "./OrderTracking";
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

export default function CrfOrderSection({
	crfId,
	onRefresh,
}: CrfOrderSectionProps) {
	const detailQuery = useCrfDetailQuery(crfId);
	const crf = detailQuery.data ?? null;

	// Every order-step mutation (dispatch details, swap, place/retry/cancel,
	// stock-check retry) needs THIS query refetched — it's the one place
	// permissions/order/status live — not just the caller's onRefresh,
	// which only re-syncs the EPC-level payload (CrfSection's read-only
	// summary, tab labels, etc.).
	const refresh = async () => {
		await detailQuery.refetch();
		await onRefresh();
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
				Once the EPC is approved, the proposer enters the delivery PIN code and
				dispatch details here and the CRF souvenirs are ordered from the store.
			</Notice>
		);
	}

	if (crf.status === "ORDERED" && crf.order) {
		return (
			<CrfOrderTracking
				order={crf.order}
				canCancel={crf.permissions.canCancelOrder}
				onCancel={(reason) => void order.submitCancel(reason)}
				cancelling={order.cancelling}
			/>
		);
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

	/* ------------------------------ Ordering flow --------------------------- */

	const inDetailsStep = delivery.step === "details";
	const etaLabel = formatDeliveryDate(delivery.estimate?.estimatedDeliveryDate);

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
							Check the delivery PIN and dispatch details below (an invalid
							address is a common cause), then retry.
						</p>
					</div>
				</div>
			) : null}

			{order.step === "replace" ? (
				<ReplaceItems order={order} />
			) : (
				<div className="crf-order-layout">
					<div className="crf-order-main">
						<CrfOrderForm order={order} delivery={delivery} />
						{order.step === "shortfall" ? (
							<ShortfallPanel order={order} />
						) : null}
					</div>

					<aside className="crf-order-aside" aria-label="Souvenirs to order">
						<div className="crf-order-summary">
							<h3 className="crf-order-panel-title">Souvenirs to order</h3>
							<OrderItemList lines={order.inStockLines} />
							<OrderTotals totals={order.souvenirTotals} />

							{inDetailsStep && etaLabel ? (
								<p className="crf-order-summary-eta">
									<CalendarClock aria-hidden="true" />
									Estimated delivery by {etaLabel}
								</p>
							) : null}

							{inDetailsStep ? (
								<div className="crf-order-summary-actions">
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

									{crf.status === "APPROVED" ? (
										<Button
											type="button"
											text={
												order.placing ? "Placing order…" : "Save & place order"
											}
											Icon={Truck}
											size="md"
											appearance="standard"
											variant="brand"
											disabled={order.placing || order.savingDispatchDetails}
											onClick={async () => {
												if (await order.submitDispatchDetails())
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
											disabled={order.retrying || order.savingDispatchDetails}
											onClick={async () => {
												if (await order.submitDispatchDetails())
													await order.submitRetry();
											}}
										/>
									) : null}
								</div>
							) : (
								<p className="crf-order-summary-note">
									Enter the delivery PIN code first — then add the recipient and
									address to place the order.
								</p>
							)}
						</div>
					</aside>
				</div>
			)}
		</div>
	);
}
