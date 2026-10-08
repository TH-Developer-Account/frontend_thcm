// crf/crf.debit-note.tsx
// Invoice-style debit note for a stock shortfall, with PDF download.
//
//   ┌ DEBIT NOTE ───────────────────────── DN-… · 07 Oct 2026 ┐
//   │ From: Tata Hitachi …          To: THCM Store fulfilment │
//   │ CRF / EPC ref · Event · Raised by · Reason              │
//   │ # Item  Approved  Available  Short  Rate  Taxable GST … │
//   │                              Taxable / GST / Total debit│
//   │ Amount in words                                         │
//   └ System-generated · Authorised signatory ────────────────┘
//
// Printed on white regardless of theme — it's a document.

import React from "react";
import { Download } from "lucide-react";

import Button from "../../../components/common/Button";
import { downloadElementAsPdf } from "./crf.pdf";
import { formatDateTime, formatLongDate } from "./crf.order.summary";
import type { DebitNote } from "./crf.order.types";
import { SHOP_PRICES_INCLUDE_GST } from "./crf.shop.mapper";
import { formatCrfAmount, formatCrfQuantity } from "./crf.schema";

/* ========================================================================== */
/*                                  Document                                  */
/* ========================================================================== */

export const DebitNoteDocument = React.forwardRef<HTMLDivElement, { note: DebitNote }>(
	({ note }, ref) => (
		<div ref={ref} className="crf-dn" aria-label={`Debit note ${note.number}`}>
			<header className="crf-dn-header">
				<div>
					<p className="crf-dn-kicker">Debit note</p>
					<h2 className="crf-dn-number">{note.number}</h2>
				</div>
				<dl className="crf-dn-meta">
					<div>
						<dt>Date</dt>
						<dd>{formatLongDate(note.issuedAt)}</dd>
					</div>
					<div>
						<dt>EPC</dt>
						<dd>{note.proposalNumber || "--"}</dd>
					</div>
				</dl>
			</header>

			<div className="crf-dn-parties">
				{[
					{ label: "From", party: note.from },
					{ label: "To", party: note.to },
				].map(({ label, party }) => (
					<section key={label} className="crf-dn-party">
						<p className="crf-dn-label">{label}</p>
						<p className="crf-dn-party-name">{party.name}</p>
						{party.lines.map((line) => (
							<p key={line}>{line}</p>
						))}
						<p>GSTIN: {party.gstin || "—"}</p>
					</section>
				))}
			</div>

			<dl className="crf-dn-refs">
				<div>
					<dt>Event</dt>
					<dd>{note.eventName || "--"}</dd>
				</div>
				<div>
					<dt>CRF reference</dt>
					<dd>{note.crfId || "--"}</dd>
				</div>
				<div>
					<dt>Raised by</dt>
					<dd>
						{note.raisedBy.name}
						{note.raisedBy.email ? ` · ${note.raisedBy.email}` : ""}
					</dd>
				</div>
				<div className="crf-dn-refs-wide">
					<dt>Reason</dt>
					<dd>{note.reason}</dd>
				</div>
			</dl>

			<table className="crf-dn-table">
				<thead>
					<tr>
						<th scope="col">#</th>
						<th scope="col">Item</th>
						<th scope="col" className="num">Approved</th>
						<th scope="col" className="num">Supplied</th>
						<th scope="col" className="num">Short</th>
						<th scope="col" className="num">Rate</th>
						<th scope="col" className="num">Taxable</th>
						<th scope="col" className="num">GST</th>
						<th scope="col" className="num">Amount</th>
					</tr>
				</thead>
				<tbody>
					{note.lines.map((line, index) => (
						<tr key={line.sku}>
							<td>{index + 1}</td>
							<td>
								<span className="crf-dn-item">{line.title}</span>
								<span className="crf-dn-item-meta">
									{[line.variantTitle, `SKU ${line.sku}`].filter(Boolean).join(" · ")}
								</span>
							</td>
							<td className="num">{formatCrfQuantity(line.approvedQty)}</td>
							<td className="num">{formatCrfQuantity(line.availableQty)}</td>
							<td className="num crf-dn-short">{formatCrfQuantity(line.shortQty)}</td>
							<td className="num">{formatCrfAmount(line.unitPrice)}</td>
							<td className="num">{formatCrfAmount(line.pricing.taxable)}</td>
							<td className="num">
								{formatCrfAmount(line.pricing.gst)}
								<span className="crf-dn-item-meta">{line.gstRate !== null ? `${line.gstRate}%` : "—"}</span>
							</td>
							<td className="num">{formatCrfAmount(line.pricing.total)}</td>
						</tr>
					))}
				</tbody>
			</table>

			<div className="crf-dn-summary crf-dn-avoid-break">
				<p className="crf-dn-words">
					<span className="crf-dn-label">Amount in words</span>
					{note.amountInWords}
				</p>
				<dl className="crf-dn-totals">
					<div>
						<dt>Taxable value</dt>
						<dd>{formatCrfAmount(note.totals.taxable)}</dd>
					</div>
					<div>
						<dt>GST{SHOP_PRICES_INCLUDE_GST ? " (included in rate)" : ""}</dt>
						<dd>{formatCrfAmount(note.totals.gst)}</dd>
					</div>
					<div className="crf-dn-grand">
						<dt>Total debit</dt>
						<dd>{formatCrfAmount(note.totals.total)}</dd>
					</div>
				</dl>
			</div>

			<footer className="crf-dn-footer crf-dn-avoid-break">
				<p>
					System-generated from MAP on {formatDateTime(note.issuedAt)}. The final number is assigned when the
					note is recorded.
				</p>
				<p className="crf-dn-sign">Authorised signatory</p>
			</footer>
		</div>
	),
);

DebitNoteDocument.displayName = "DebitNoteDocument";

/* ========================================================================== */
/*                               Download hook                                */
/* ========================================================================== */

export function useDebitNotePdf(note: DebitNote | null) {
	const ref = React.useRef<HTMLDivElement>(null);
	const [downloading, setDownloading] = React.useState(false);

	const download = React.useCallback(async () => {
		if (!ref.current || !note || downloading) return;
		setDownloading(true);
		try {
			await downloadElementAsPdf(ref.current, note.number);
		} catch (error) {
			console.error("Debit note PDF failed:", error);
		} finally {
			setDownloading(false);
		}
	}, [downloading, note]);

	return { ref, download, downloading };
}

export const DebitNoteDownloadButton = ({
	downloading,
	onClick,
	size = "sm",
}: {
	downloading: boolean;
	onClick: () => void;
	size?: "sm" | "md";
}) => (
	<Button
		type="button"
		text={downloading ? "Generating PDF…" : "Download PDF"}
		Icon={Download}
		size={size}
		appearance="standard"
		variant="outline"
		loading={downloading}
		onClick={onClick}
	/>
);
