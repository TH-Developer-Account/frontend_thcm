// crf/order/OrderShortfall.tsx
// STOCK_SHORTFALL: some approved souvenir lines came back OUT_OF_STOCK when
// the backend last evaluated stock (post-approval, or after a swap). Two
// ways forward, both real backend calls:
//
//   ShortfallPanel   shows what's short + "order something else" / "place
//                    anyway" (acceptPartial: true — the backend computes
//                    and returns the debit note amount, there's no document
//                    to preview beforehand)
//   ReplaceItems     swap cart — the exact same souvenir catalog/validation
//                    used by the main CRF form, capped at the CRF's
//                    souvenirTotalAtApproval
//
// Replaces the earlier version's formal "generate debit note" document step
// (crf.debit-note.tsx) — the backend never returns a document, only a
// plain debitNoteAmount number once the order is placed.

import { ArrowLeft, PackageSearch, Repeat2, ShoppingBag, TriangleAlert, Truck } from "lucide-react";
import React from "react";

import Button from "../../../../components/common/Button";
import { OrderItemList, OrderTotals } from "./OrderSummary";
import { formatCrfAmount } from "../core/schema";
import SouvenirCatalog from "../shop/SouvenirCatalog";
import type { CrfOrderController } from "./useCrfOrder";

/* ========================================================================== */
/*                                Shortfall                                   */
/* ========================================================================== */

export function ShortfallPanel({ order }: { order: CrfOrderController }) {
	if (order.shortLines.length === 0) return null;

	return (
		<div className="crf-order-shortfall">
			<div className="crf-order-alert" role="alert">
				<TriangleAlert aria-hidden="true" />
				<div>
					<p className="crf-order-alert-title">
						Stock has run short — {order.shortLines.length}{" "}
						{order.shortLines.length === 1 ? "item" : "items"} can't be supplied
					</p>
					<p className="crf-order-alert-meta">Nothing has been ordered yet.</p>
				</div>
			</div>

			<OrderItemList lines={order.shortLines} />
			<OrderTotals totals={order.shortTotals} label="Shortfall value" />

			<h3 className="crf-order-panel-title">How do you want to continue?</h3>
			<div className="crf-order-options">
				<button type="button" className="crf-order-option" onClick={order.startReplace} disabled={order.swapping}>
					<Repeat2 aria-hidden="true" />
					<span className="crf-order-option-title">Order something else</span>
					<span className="crf-order-option-text">
						Keep what's available and choose other souvenirs, within the approved value.
					</span>
				</button>

				<button
					type="button"
					className="crf-order-option"
					onClick={() => void order.submitPlaceOrder(true)}
					disabled={order.placing}
				>
					<Truck aria-hidden="true" />
					<span className="crf-order-option-title">
						{order.placing ? "Placing order…" : "Place order with a debit note"}
					</span>
					<span className="crf-order-option-text">
						Order the {order.inStockLines.length} available {order.inStockLines.length === 1 ? "item" : "items"} now.
						A debit note for the shortfall ({formatCrfAmount(order.shortTotals.total)} estimated) is raised
						automatically.
					</span>
				</button>
			</div>
		</div>
	);
}

/* ========================================================================== */
/*                         Order something else                               */
/* ========================================================================== */

export function ReplaceItems({ order }: { order: CrfOrderController }) {
	const [search, setSearch] = React.useState("");
	const cap = order.crf?.souvenirTotalAtApproval ?? null;
	const remaining = cap !== null ? cap - order.cartTotals.total : null;

	return (
		<div className="crf-order-replace">
			{cap !== null ? (
				<div className="crf-order-budget" aria-live="polite">
					<div>
						<span className="crf-order-budget-label">Approved souvenir value</span>
						<span className="crf-order-budget-value">{formatCrfAmount(cap)}</span>
					</div>
					<div>
						<span className="crf-order-budget-label">In this order</span>
						<span className="crf-order-budget-value">{formatCrfAmount(order.cartTotals.total)}</span>
					</div>
					<div className={order.overBudget ? "crf-order-budget--over" : "crf-order-budget--ok"}>
						<span className="crf-order-budget-label">{order.overBudget ? "Over by" : "Remaining"}</span>
						<span className="crf-order-budget-value">{formatCrfAmount(Math.abs(remaining ?? 0))}</span>
					</div>
				</div>
			) : null}

			<div className="crf-order-layout">
				<div className="crf-order-main">
					<div className="crf-order-search">
						<PackageSearch aria-hidden="true" />
						<input
							type="search"
							className="form-input"
							placeholder="Search souvenirs"
							aria-label="Search souvenirs"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
					</div>
					<SouvenirCatalog
						items={order.cart}
						onChange={order.setCart}
						errors={order.cartErrors}
						readOnly={false}
						search={search}
					/>
				</div>

				<aside className="crf-order-aside" aria-label="New order">
					<div className="crf-order-summary">
						<h3 className="crf-order-panel-title">
							<ShoppingBag aria-hidden="true" /> New order
						</h3>
						{order.cart.length ? (
							<OrderItemList lines={order.cart} />
						) : (
							<p className="crf-order-summary-note">No items yet — add souvenirs from the list.</p>
						)}
						<OrderTotals totals={order.cartTotals} />
						{order.overBudget ? (
							<p className="crf-order-summary-note crf-order-summary-note--warn" role="alert">
								The order is over the approved value. Reduce quantities or remove items.
							</p>
						) : null}

						<Button
							type="button"
							text={order.swapping ? "Saving…" : "Save & check stock"}
							Icon={Truck}
							size="md"
							appearance="standard"
							variant="brand"
							disabled={order.swapping || order.cart.length === 0 || order.overBudget}
							onClick={() => void order.submitReplace()}
						/>
						<Button
							type="button"
							text="Back"
							Icon={ArrowLeft}
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={order.cancelReplace}
						/>
					</div>
				</aside>
			</div>
		</div>
	);
}
