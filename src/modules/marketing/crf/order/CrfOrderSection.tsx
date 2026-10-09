// crf/order/CrfOrderSection.tsx
// CRF order section of the EPC view ("CRF Order" tab) — dispatches purely
// on the CRF's own `status` and `permissions` (crf.types.ts), both read
// straight off GET /crf/:crfId. No EPC-status phase derivation, no order
// polling: the order (when one exists) already comes back on the same CRF
// detail response.
//
//   OPEN                      → notice: ordering opens after approval
//   APPROVED                  → dispatch details → Place order
//   STOCK_SHORTFALL           → dispatch details → ShortfallPanel
//   ORDER_FAILED              → notice + dispatch details → Retry order
//   ORDERED (crf.order set)   → order summary → Cancel
//   CLOSED, no order          → notice: no store order was placed

import { CircleAlert, Clock3, FileText, PackageX, Truck } from "lucide-react";
import type { ReactNode } from "react";

import Button from "../../../../components/common/Button";
import CrfOrderForm from "./OrderForm";
import { ReplaceItems, ShortfallPanel } from "./OrderShortfall";
import CrfOrderTracking from "./OrderTracking";
import { OrderItemList, OrderTotals } from "./OrderSummary";
import type { CrfDetail } from "../core/types";
import { useCrfOrder } from "./useCrfOrder";
import "../core/styles.css";
import "./styles.css";

export type CrfOrderSectionProps = {
	crf: CrfDetail | null;
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

export default function CrfOrderSection({ crf, onRefresh }: CrfOrderSectionProps) {
	const order = useCrfOrder(crf, onRefresh);

	if (!crf) {
		return (
			<Notice Icon={FileText} title="No CRF on this EPC">
				Add a CRF with souvenirs to order them from the store.
			</Notice>
		);
	}

	if (crf.status === "OPEN") {
		return (
			<Notice Icon={Clock3} title="Ordering opens after approval">
				Once the EPC is approved, the proposer enters the dispatch details here and the CRF souvenirs are
				ordered from the store.
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
				This CRF was closed without an order — usually because it had no souvenir lines to order.
			</Notice>
		);
	}

	if (order.souvenirLines.length === 0) {
		return (
			<Notice Icon={PackageX} title="Nothing to order from the store">
				This CRF has no souvenirs from the store. Printed materials and artworks are handled separately.
			</Notice>
		);
	}

	if (!crf.permissions.canEditDispatchDetails) {
		return (
			<Notice Icon={Truck} title="Waiting for the order">
				The CRF's owner will enter the dispatch details and place the store order.
			</Notice>
		);
	}

	/* ------------------------------ Ordering flow --------------------------- */

	return (
		<div className="crf-order">
			{crf.status === "ORDER_FAILED" ? (
				<div className="crf-order-alert" role="alert">
					<CircleAlert aria-hidden="true" />
					<div>
						<p className="crf-order-alert-title">The last order attempt failed</p>
						<p className="crf-order-alert-meta">
							Check the dispatch details below (an invalid address is a common cause), then retry.
						</p>
					</div>
				</div>
			) : null}

			{order.step === "replace" ? (
				<ReplaceItems order={order} />
			) : (
				<div className="crf-order-layout">
					<div className="crf-order-main">
						<CrfOrderForm order={order} />
						{order.step === "shortfall" ? <ShortfallPanel order={order} /> : null}
					</div>

					<aside className="crf-order-aside" aria-label="Souvenirs to order">
						<div className="crf-order-summary">
							<h3 className="crf-order-panel-title">Souvenirs to order</h3>
							<OrderItemList lines={order.inStockLines} />
							<OrderTotals totals={order.souvenirTotals} />

							<Button
								type="button"
								text={order.savingDispatchDetails ? "Saving…" : "Save dispatch details"}
								size="sm"
								appearance="standard"
								variant="outline"
								disabled={order.savingDispatchDetails}
								onClick={() => void order.submitDispatchDetails()}
							/>

							{crf.status === "APPROVED" ? (
								<Button
									type="button"
									text={order.placing ? "Placing order…" : "Save & place order"}
									Icon={Truck}
									size="md"
									appearance="standard"
									variant="brand"
									disabled={order.placing || order.savingDispatchDetails}
									onClick={async () => {
										if (await order.submitDispatchDetails()) await order.submitPlaceOrder();
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
										if (await order.submitDispatchDetails()) await order.submitRetry();
									}}
								/>
							) : null}
						</div>
					</aside>
				</div>
			)}
		</div>
	);
}
