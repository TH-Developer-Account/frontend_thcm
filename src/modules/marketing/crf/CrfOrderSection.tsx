// crf/CrfOrderSection.tsx
// CRF order section of the EPC view ("CRF Order" / "Tracking" tab).
//
//   EPC not approved yet        → notice: ordering opens after approval
//   EPC APPROVED, no order      → order form (proposer) / waiting notice (others)
//        └ shortfall           → order something else | debit note
//   order placed (any status)   → tracking
//   EPC past APPROVED, no order → notice: no store order was placed

import { useQueryClient } from "@tanstack/react-query";
import { CircleAlert, Clock3, FileText, PackageX, Truck } from "lucide-react";
import type { ReactNode } from "react";

import Button from "../../../components/common/Button";
import { crfOrderDevApi, crfOrderKeys } from "./crf.order.api";
import { DebitNoteStep, ReplaceItems, ShortfallPanel } from "./crf.order.shortfall";
import CrfOrderForm from "./crf.order.form";
import CrfOrderTracking from "./crf.order.tracking";
import type { CrfOrderContext } from "./crf.order.types";
import { useCrfOrder, type CrfOrderStep } from "./useCrfOrder";
import "./crf.css";
import "./crf.order.css";

export type CrfOrderSectionProps = {
	context: CrfOrderContext;
	/** Only the proposer places the order. */
	canPlaceOrder: boolean;
};

const Notice = ({
	Icon,
	title,
	children,
	action,
}: {
	Icon: typeof Truck;
	title: string;
	children?: ReactNode;
	action?: ReactNode;
}) => (
	<div className="crf-order-notice">
		<Icon aria-hidden="true" />
		<p className="crf-order-notice-title">{title}</p>
		{children ? <p className="crf-order-notice-text">{children}</p> : null}
		{action}
	</div>
);

const StepHeader = ({ step }: { step: CrfOrderStep }) => {
	const current = step === "form" ? 0 : step === "shortfall" ? 1 : 2;
	const labels = [
		"Delivery details",
		"Stock check",
		step === "debit-note" ? "Debit note" : step === "replace" ? "Order something else" : "Resolve shortfall",
		"Order placed",
	];
	return (
		<ol className="crf-order-steps" aria-label="Order steps">
			{labels.map((label, index) => (
				<li
					key={label}
					className={[
						"crf-order-step",
						index < current && "crf-order-step--done",
						index === current && "crf-order-step--current",
					]
						.filter(Boolean)
						.join(" ")}
					aria-current={index === current ? "step" : undefined}
				>
					<span className="crf-order-step-index">{index + 1}</span>
					{label}
				</li>
			))}
		</ol>
	);
};
export default function CrfOrderSection({ context, canPlaceOrder }: CrfOrderSectionProps) {
	const queryClient = useQueryClient();
	const order = useCrfOrder(context, canPlaceOrder);
	const crfId = context.crf?.id;

	/* ------------------------------ No CRF -------------------------------- */

	if (!crfId) {
		return (
			<Notice Icon={FileText} title="No CRF on this EPC">
				Add a CRF with souvenirs to order them from the store.
			</Notice>
		);
	}

	/* ------------------------------ Loading ------------------------------- */

	if (order.orderQuery.isLoading) {
		return (
			<p className="crf-order-loading" role="status">
				Loading order…
			</p>
		);
	}

	if (order.orderQuery.isError) {
		return (
			<Notice
				Icon={CircleAlert}
				title="Couldn't load the order"
				action={
					<Button
						type="button"
						text="Retry"
						size="sm"
						appearance="standard"
						variant="outline"
						onClick={() => void order.orderQuery.refetch()}
					/>
				}
			/>
		);
	}

	/* ----------------------------- Tracking ------------------------------- */

	if (order.order) {
		return (
			<CrfOrderTracking
				record={order.order}
				refreshing={order.orderQuery.isFetching}
				onRefresh={() => void order.orderQuery.refetch()}
				dev={
					order.isMock
						? {
								onAdvance: async () => {
									const next = await crfOrderDevApi.advance(crfId);
									if (next) queryClient.setQueryData(crfOrderKeys.order(crfId), next);
								},
								onReset: () => {
									crfOrderDevApi.reset(crfId);
									queryClient.setQueryData(crfOrderKeys.order(crfId), null);
								},
							}
						: undefined
				}
			/>
		);
	}

	/* --------------------------- Not orderable ---------------------------- */

	if (order.phase === "BEFORE_APPROVAL") {
		return (
			<Notice Icon={Clock3} title="Ordering opens after approval">
				Once the EPC is approved, the proposer enters the delivery details here and the CRF souvenirs are ordered
				from the store. Tracking appears here after that.
			</Notice>
		);
	}

	if (order.phase === "CLOSED") {
		return (
			<Notice Icon={PackageX} title="No store order was placed">
				Store orders can be placed only while the EPC is approved, before the event is conducted.
			</Notice>
		);
	}

	if (order.approvedLines.length === 0) {
		return (
			<Notice Icon={PackageX} title="Nothing to order from the store">
				This CRF has no souvenirs from the store. Printed materials and artworks are handled separately.
			</Notice>
		);
	}

	if (!order.canPlaceOrder) {
		return (
			<Notice Icon={Truck} title="Waiting for the order">
				The proposer will enter the delivery details and place the store order. Tracking will show here.
			</Notice>
		);
	}

	/* ------------------------------ Ordering ------------------------------ */

	return (
		<div className="crf-order">
			<StepHeader step={order.step} />
			{order.step === "form" ? <CrfOrderForm order={order} /> : null}
			{order.step === "shortfall" ? <ShortfallPanel order={order} /> : null}
			{order.step === "replace" ? <ReplaceItems order={order} /> : null}
			{order.step === "debit-note" ? <DebitNoteStep order={order} /> : null}
		</div>
	);
}
