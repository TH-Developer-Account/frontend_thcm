// crf/crf.order.shortfall.tsx
// Short shipment at order time — the store has less than was approved.
//
//   ShortfallPanel    what's short + the two ways forward
//   ReplaceItems      (a) Order something else: souvenir listing again,
//                         cart = what's available, kept within the approved value
//   DebitNoteStep     (b) Debit note for the shortfall → confirm → order
//                         the available quantities

import React from "react";
import {
	ArrowLeft,
	FileText,
	PackageSearch,
	Repeat2,
	ShoppingBag,
	TriangleAlert,
	Truck,
} from "lucide-react";

import Button from "../../../components/common/Button";
import { DebitNoteDocument, DebitNoteDownloadButton, useDebitNotePdf } from "./crf.debit-note";
import { CrfImage } from "./crf.media";
import { getOrderLinesTotals } from "./crf.order.logic";
import { OrderItemList, OrderTotals, formatDateTime } from "./crf.order.summary";
import { formatCrfAmount, formatCrfQuantity } from "./crf.schema";
import SouvenirCatalog from "./crf.souvenirs";
import type { CrfOrderController } from "./useCrfOrder";

const SHORT_STATUS_LABEL: Record<string, string> = {
	PARTIAL: "Partly available",
	OUT_OF_STOCK: "Out of stock",
	INACTIVE: "No longer sold",
	UNKNOWN_SKU: "Not in store",
	AVAILABLE: "Available",
};

/* ========================================================================== */
/*                                Shortfall                                   */
/* ========================================================================== */

export function ShortfallPanel({ order }: { order: CrfOrderController }) {
	const outcome = order.outcome;
	if (!outcome) return null;

	const availableCount = outcome.lines.filter((line) => {
		const short = outcome.shortLines.find((s) => s.key === line.key);
		return short ? short.availableQty > 0 : true;
	}).length;

	return (
		<div className="crf-order-shortfall">
			<div className="crf-order-alert" role="alert">
				<TriangleAlert aria-hidden="true" />
				<div>
					<p className="crf-order-alert-title">
						Stock has run short since approval — {outcome.shortLines.length}{" "}
						{outcome.shortLines.length === 1 ? "item" : "items"} can't be fully supplied
					</p>
					<p className="crf-order-alert-meta">
						Checked live with the store at {formatDateTime(outcome.checkedAt)}. Nothing has been ordered yet.
					</p>
				</div>
			</div>

			<div className="crf-order-table-wrap">
				<table className="crf-order-table">
					<thead>
						<tr>
							<th scope="col">Item</th>
							<th scope="col" className="num">Requested</th>
							<th scope="col" className="num">Available</th>
							<th scope="col" className="num">Short</th>
							<th scope="col" className="num">Short value</th>
						</tr>
					</thead>
					<tbody>
						{outcome.shortLines.map((line) => (
							<tr key={line.key}>
								<td>
									<div className="crf-order-table-item">
										<CrfImage src={line.imageUrl} alt="" category="SOUVENIR" className="crf-order-item-thumb" />
										<div>
											<span className="crf-order-item-title">{line.title}</span>
											<span className="crf-order-item-meta">
												{[line.variantTitle, `SKU ${line.sku}`].filter(Boolean).join(" · ")}
											</span>
											<span className={`crf-stock crf-stock--${line.availableQty > 0 ? "low" : "out_of_stock"}`}>
												{SHORT_STATUS_LABEL[line.status] ?? line.status}
											</span>
										</div>
									</div>
								</td>
								<td className="num">{formatCrfQuantity(line.approvedQty)}</td>
								<td className="num">{formatCrfQuantity(line.availableQty)}</td>
								<td className="num crf-order-short">{formatCrfQuantity(line.shortQty)}</td>
								<td className="num">{formatCrfAmount(line.shortPricing.total)}</td>
							</tr>
						))}
					</tbody>
					<tfoot>
						<tr>
							<th scope="row" colSpan={4}>
								Shortfall value
							</th>
							<td className="num">{formatCrfAmount(outcome.shortfallTotals.total)}</td>
						</tr>
					</tfoot>
				</table>
			</div>

			<h3 className="crf-order-panel-title">How do you want to continue?</h3>
			<div className="crf-order-options">
				<button type="button" className="crf-order-option" onClick={order.chooseReplace} disabled={order.busy}>
					<Repeat2 aria-hidden="true" />
					<span className="crf-order-option-title">Order something else</span>
					<span className="crf-order-option-text">
						Keep what's available and choose other souvenirs, worth up to{" "}
						{formatCrfAmount(outcome.shortfallTotals.total)}, within the approved value.
					</span>
				</button>

				<button type="button" className="crf-order-option" onClick={order.chooseDebitNote} disabled={order.busy}>
					<FileText aria-hidden="true" />
					<span className="crf-order-option-title">Generate debit note</span>
					<span className="crf-order-option-text">
						{availableCount > 0
							? `Order the ${availableCount} available ${availableCount === 1 ? "item" : "items"} and raise a debit note from the dealer to THCM for ${formatCrfAmount(outcome.shortfallTotals.total)}.`
							: `Raise a debit note from the dealer to THCM for ${formatCrfAmount(outcome.shortfallTotals.total)}. Nothing approved is in stock, so you'll need to order something else to place an order.`}
					</span>
				</button>
			</div>

			<div className="crf-order-footer">
				<Button
					type="button"
					text="Edit delivery details"
					Icon={ArrowLeft}
					size="sm"
					appearance="standard"
					variant="outline"
					onClick={order.backToForm}
				/>
			</div>
		</div>
	);
}

/* ========================================================================== */
/*                         (a) Order something else                           */
/* ========================================================================== */

export function ReplaceItems({ order }: { order: CrfOrderController }) {
	const [search, setSearch] = React.useState("");
	const remaining = order.approvedTotals.total - order.cartTotals.total;

	return (
		<div className="crf-order-replace">
			<div className="crf-order-budget" aria-live="polite">
				<div>
					<span className="crf-order-budget-label">Approved souvenir value</span>
					<span className="crf-order-budget-value">{formatCrfAmount(order.approvedTotals.total)}</span>
				</div>
				<div>
					<span className="crf-order-budget-label">In this order</span>
					<span className="crf-order-budget-value">{formatCrfAmount(order.cartTotals.total)}</span>
				</div>
				<div className={order.overBudget ? "crf-order-budget--over" : "crf-order-budget--ok"}>
					<span className="crf-order-budget-label">{order.overBudget ? "Over by" : "Remaining"}</span>
					<span className="crf-order-budget-value">{formatCrfAmount(Math.abs(remaining))}</span>
				</div>
			</div>

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

				<aside className="crf-order-aside" aria-label="Order summary">
					<div className="crf-order-summary">
						<h3 className="crf-order-panel-title">
							<ShoppingBag aria-hidden="true" /> New order
						</h3>
						{order.cartLines.length ? (
							<OrderItemList lines={order.cartLines} />
						) : (
							<p className="crf-order-summary-note">No items yet — add souvenirs from the list.</p>
						)}
						<OrderTotals totals={getOrderLinesTotals(order.cartLines)} />
						{order.overBudget ? (
							<p className="crf-order-summary-note crf-order-summary-note--warn" role="alert">
								The order is over the approved value. Reduce quantities or remove items — going over needs a
								new approval.
							</p>
						) : null}

						<Button
							type="button"
							text={order.checkingStock ? "Checking stock…" : order.placing ? "Placing order…" : "Check stock & place order"}
							Icon={Truck}
							size="md"
							appearance="standard"
							variant="brand"
							disabled={order.busy || order.cartLines.length === 0 || order.overBudget}
							onClick={() => void order.submitReplacement()}
						/>
						<Button
							type="button"
							text="Back"
							Icon={ArrowLeft}
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={order.backToShortfall}
						/>
					</div>
				</aside>
			</div>
		</div>
	);
}

/* ========================================================================== */
/*                              (b) Debit note                                */
/* ========================================================================== */

export function DebitNoteStep({ order }: { order: CrfOrderController }) {
	const note = order.debitNote;
	const pdf = useDebitNotePdf(note);
	if (!note) return null;

	const remainingTotals = getOrderLinesTotals(order.debitNoteLines);

	return (
		<div className="crf-order-debit">
			<div className="crf-order-alert crf-order-alert--info">
				<FileText aria-hidden="true" />
				<div>
					<p className="crf-order-alert-title">
						Debit note from {note.from.name} to THCM: {formatCrfAmount(note.totals.total)}
					</p>
					<p className="crf-order-alert-meta">
						Review and download it. On confirm, the order is placed for the available quantities and the debit
						note is attached to this CRF.
					</p>
				</div>
			</div>

			<div className="crf-order-layout">
				<div className="crf-order-main">
					<div className="crf-dn-frame">
						<DebitNoteDocument ref={pdf.ref} note={note} />
					</div>
				</div>

				<aside className="crf-order-aside" aria-label="What will be ordered">
					<div className="crf-order-summary">
						<h3 className="crf-order-panel-title">
							<Truck aria-hidden="true" /> Will be ordered
						</h3>
						{order.debitNoteLines.length ? (
							<>
								<OrderItemList lines={order.debitNoteLines} />
								<OrderTotals totals={remainingTotals} />
							</>
						) : (
							<p className="crf-order-summary-note crf-order-summary-note--warn">
								Nothing approved is in stock. Go back and choose “Order something else”.
							</p>
						)}

						<Button
							type="button"
							text={order.checkingStock ? "Checking stock…" : order.placing ? "Placing order…" : "Confirm & place order"}
							Icon={Truck}
							size="md"
							appearance="standard"
							variant="brand"
							disabled={order.busy || order.debitNoteLines.length === 0}
							onClick={() => void order.confirmDebitNote()}
						/>
						<DebitNoteDownloadButton downloading={pdf.downloading} onClick={() => void pdf.download()} />
						<Button
							type="button"
							text="Back"
							Icon={ArrowLeft}
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={order.backToShortfall}
						/>
					</div>
				</aside>
			</div>
		</div>
	);
}
