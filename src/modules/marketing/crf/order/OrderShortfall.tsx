// crf/order/OrderShortfall.tsx
// STOCK_SHORTFALL: some approved souvenir lines came back OUT_OF_STOCK when
// the backend last evaluated stock (post-approval, or after a swap).
//
// This is now the FIRST thing the owner sees in that status — the delivery
// PIN / shipping fields stay hidden until they've picked a way forward:
//
//   ShortfallPanel        the alert + two options:
//                           1. "Order something else" → ReplaceItems (swap
//                              cart). Saving it updates the CRF; once
//                              everything is in stock the CRF is APPROVED and
//                              the shipping fields open. If it is still short
//                              this alert shows again.
//                           2. "Continue with a debit note" → a LOCAL choice
//                              only (nothing is saved here). The shipping
//                              fields open, and "Save & place order" sends
//                              acceptPartial: true — the backend computes the
//                              debit note amount.
//   DebitNoteChoiceBanner shown above the shipping fields after option 2,
//                         with a "Change" link back to the two options.
//   ReplaceItems          swap cart — the exact same souvenir catalog/validation
//                         used by the main CRF form, capped at the CRF's
//                         shortfallAmount (the frozen value of the CURRENT
//                         out-of-stock lines — see useCrfOrder.ts and
//                         core/types.ts's CrfDetail doc comment for why this
//                         is NOT souvenirTotalAtApproval)

import {
	ArrowLeft,
	FileText,
	PackageSearch,
	Repeat2,
	ShoppingBag,
	TriangleAlert,
	Truck,
} from "lucide-react";
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

	// Swapping needs the backend's canSwapSouvenirLines flag (owner,
	// STOCK_SHORTFALL) — never re-derived on the client.
	const canSwap = order.permissions?.canSwapSouvenirLines ?? false;

	return (
		<div className="crf-order-shortfall">
			<div className="crf-order-alert" role="alert">
				<TriangleAlert aria-hidden="true" />
				<div>
					<p className="crf-order-alert-title">
						Stock has run short — {order.shortLines.length}{" "}
						{order.shortLines.length === 1 ? "item" : "items"} can't be supplied
					</p>
					<p className="crf-order-alert-meta">
						Nothing has been ordered yet. Choose how to continue before adding
						the delivery details.
					</p>
				</div>
			</div>

			<OrderItemList lines={order.shortLines} />
			<OrderTotals totals={order.shortTotals} label="Shortfall value" />

			<h3 className="crf-order-panel-title">How do you want to continue?</h3>
			<div className="crf-order-options">
				<button
					type="button"
					className="crf-order-option"
					onClick={order.startReplace}
					disabled={order.swapping || !canSwap}
				>
					<Repeat2 aria-hidden="true" />
					<span className="crf-order-option-title">Order something else</span>
					<span className="crf-order-option-text">
						Keep what's available and choose other souvenirs, within the
						shortfall budget. You'll add the delivery details after saving.
					</span>
				</button>

				<button
					type="button"
					className="crf-order-option"
					onClick={order.acceptShortfall}
				>
					<FileText aria-hidden="true" />
					<span className="crf-order-option-title">
						Continue with a debit note
					</span>
					<span className="crf-order-option-text">
						Order the {order.inStockLines.length} available{" "}
						{order.inStockLines.length === 1 ? "item" : "items"} only. A debit
						note for the shortfall ({formatCrfAmount(order.shortTotals.total)}{" "}
						estimated) is raised automatically when the order is placed.
					</span>
				</button>
			</div>
		</div>
	);
}

/**
 * Reminder shown above the delivery/shipping fields once the user has chosen
 * the debit-note route. "Change" returns to the two options (the choice was
 * never saved, so there is nothing to undo on the server).
 */
export function DebitNoteChoiceBanner({
	order,
}: {
	order: CrfOrderController;
}) {
	if (!order.partialAccepted) return null;

	return (
		<div className="crf-order-alert" role="status">
			<FileText aria-hidden="true" />
			<div>
				<p className="crf-order-alert-title">
					Continuing with a debit note for{" "}
					{formatCrfAmount(order.shortTotals.total)}
				</p>
				<p className="crf-order-alert-meta">
					{order.inStockLines.length === 0
						? "None of the items are in stock, so nothing is shipped."
						: `Only the ${order.inStockLines.length} available ${
								order.inStockLines.length === 1 ? "item" : "items"
							} will be ordered.`}{" "}
					<button
						type="button"
						className="crf-order-link"
						onClick={order.changeShortfallChoice}
					>
						Change
					</button>
				</p>
			</div>
		</div>
	);
}

/* ========================================================================== */
/*                         Order something else                               */
/* ========================================================================== */

export function ReplaceItems({ order }: { order: CrfOrderController }) {
	const [search, setSearch] = React.useState("");
	const budget = order.shortfallBudget;
	const remaining = budget !== null ? budget - order.cartNewSpend : null;

	return (
		<div className="crf-order-replace">
			{budget !== null ? (
				<div className="crf-order-budget" aria-live="polite">
					<div>
						<span className="crf-order-budget-label">Shortfall budget</span>
						<span className="crf-order-budget-value">
							{formatCrfAmount(budget)}
						</span>
					</div>
					<div>
						<span className="crf-order-budget-label">New spend</span>
						<span className="crf-order-budget-value">
							{formatCrfAmount(order.cartNewSpend)}
						</span>
					</div>
					<div
						className={
							order.overBudget
								? "crf-order-budget--over"
								: "crf-order-budget--ok"
						}
					>
						<span className="crf-order-budget-label">
							{order.overBudget ? "Over by" : "Remaining"}
						</span>
						<span className="crf-order-budget-value">
							{formatCrfAmount(Math.abs(remaining ?? 0))}
						</span>
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
						disableAdd={order.overBudget}
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
							<p className="crf-order-summary-note">
								No items yet — add souvenirs from the list.
							</p>
						)}
						<OrderTotals totals={order.cartTotals} />
						{order.overBudget ? (
							<p
								className="crf-order-summary-note crf-order-summary-note--warn"
								role="alert"
							>
								The new items added are over the shortfall budget. Reduce
								quantities or remove items.
							</p>
						) : null}

						{/* Saves the updated CRF (PUT /crf/:id/souvenirs). The shipping
                fields only open afterwards, once the CRF is back in a state
                the section can order from. */}
						<Button
							type="button"
							text={order.swapping ? "Saving…" : "Save updated CRF"}
							Icon={Truck}
							size="md"
							appearance="standard"
							variant="brand"
							disabled={
								order.swapping || order.cart.length === 0 || order.overBudget
							}
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
