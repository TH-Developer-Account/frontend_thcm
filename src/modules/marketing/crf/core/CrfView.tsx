// crf/core/CrfView.tsx
// Read-only CRF view for the EPC "CRF" tab and the wizard's CRF step.
// Design: "CRF Details, option A" — one card, collapsible sections.
//
//   CRF Details  [ ● Approved — ready to order ]            [ Go to CRF Order → ]
//   ───────────────────────────────────────────────────────────────────────────
//                                                        Collapse all · Expand all
//   ›  Printed Materials                                                None added
//   ⌄  Souvenirs                                                          2 items
//        Item                                   Rate      Qty        Total
//        [img] Fridge Magnet…  SKU BS01153     ₹99.00    × 4      ₹396.00
//   ›  Artworks                                                         None added
//   ───────────────────────────────────────────────────────────────────────────
//   Items   Total qty   Taxable value   GST (included)            CRF grand total
//
// Lines come from the already-mapped (and, for souvenirs, backfilled)
// CrfLineItems, so the thumbnail / variant / price of a souvenir are the saved
// snapshot or the live catalog values — same data the order summary shows.
//
// The same card also renders a PLACED STORE ORDER (CrfOrderSection, status
// ORDERED). That mode is driven purely by the optional props below — with none
// of them passed, the card is exactly the CRF view above:
//   hideEmptySections  only sections that have lines (store orders are souvenirs only)
//   headerNote         small text in the header, e.g. "Shopify order #1234"
//   actions            extra header buttons (e.g. a Cancel order button)
//   details            node between the sections and the footer (delivery details)
//   stats              replaces the footer figures (Items / Total qty / GST …)
//   totalLabel/Value   replaces the "CRF grand total" figure
// Styles: ./crfView.css (all classes are prefixed `crf-details-`).

import React from "react";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";

import Button from "../../../../components/common/Button";

import { getLinePricing, sumPricing } from "../shop/mapper";
import { CrfImage } from "./Media";
import CrfStatusPill from "./CRFStatusPill";
import {
	formatArtworkSize,
	formatCrfAmount,
	formatCrfQuantity,
	getCrfLineKey,
} from "./schema";
import {
	CRF_CATEGORIES,
	type CrfCategory,
	type CrfLineItem,
	type CrfStatus,
} from "./types";

export type CrfViewStat = { label: string; value: React.ReactNode };

export type CrfViewProps = {
	items: CrfLineItem[];
	/** CRF status — shown as a pill next to the title when given. */
	status?: CrfStatus | null;
	/** Card title. Pass `null` when the surrounding card already has one. */
	title?: string | null;
	/** Shows the "Go to CRF Order" button in the header when given. */
	onGoToOrder?: () => void;

	/* ---- Placed-order mode (all optional) ---- */
	/** Skip the "None added" rows — only categories that have lines are listed. */
	hideEmptySections?: boolean;
	/** Small text in the header (e.g. the store order id). */
	headerNote?: React.ReactNode;
	/** Extra header actions, rendered after "Go to CRF Order". */
	actions?: React.ReactNode;
	/** Content between the sections and the footer (e.g. delivery details). */
	details?: React.ReactNode;
	/** Replaces the footer figures (default: Items, Total qty, Taxable, GST). */
	stats?: CrfViewStat[];
	/** Replaces the grand-total label (default "CRF grand total"). */
	totalLabel?: string;
	/** Replaces the grand-total amount (default: sum of the lines). */
	totalValue?: number;
};

/* ========================================================================== */
/*                                   Helpers                                  */
/* ========================================================================== */

const toNumber = (value: unknown) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

/** A line's money amount: its own total, else rate × quantity. */
const getLineAmount = (item: CrfLineItem) =>
	toNumber(item.total ?? toNumber(item.rate) * toNumber(item.quantity));

/** Description is only worth a line when there is one ("--" = none saved). */
const getDescription = (item: CrfLineItem) => {
	const text = (item.description ?? "").trim();
	return text && text !== "--" ? text : null;
};

/** Shopify's placeholder title for single-variant products — not worth showing. */
const DEFAULT_VARIANT_TITLE = "default title";

/** Variant (souvenir) or resolution (artwork). */
const getDetail = (item: CrfLineItem) => {
	if (item.category === "ARTWORK") {
		return formatArtworkSize(item.width, item.height, item.unit);
	}
	const variant = (item.variantTitle ?? "").trim();
	return variant && variant.toLowerCase() !== DEFAULT_VARIANT_TITLE
		? variant
		: null;
};

const CODE_LABEL: Record<string, string> = {
	SOUVENIR: "SKU",
};

/** "SKU BS01153" for souvenirs, "Part no. 1234" for everything else. */
const getCodeText = (item: CrfLineItem) => {
	const code = item.sku || item.partNumber;
	if (!code) return null;
	return `${CODE_LABEL[item.category ?? ""] ?? "Part no."} ${code}`;
};

const itemCountLabel = (count: number) =>
	count === 0 ? "None added" : `${count} ${count === 1 ? "item" : "items"}`;

/* ========================================================================== */
/*                                  Component                                 */
/* ========================================================================== */

export default function CrfView({
	items,
	status,
	title = "CRF Details",
	onGoToOrder,
	hideEmptySections = false,
	headerNote,
	actions,
	details,
	stats,
	totalLabel = "CRF grand total",
	totalValue,
}: CrfViewProps) {
	const baseId = React.useId();

	const linesByCategory = React.useMemo(() => {
		const map = new Map<string, CrfLineItem[]>();
		for (const item of items) {
			if (!item.category) continue;
			const lines = map.get(item.category);
			if (lines) lines.push(item);
			else map.set(item.category, [item]);
		}
		return map;
	}, [items]);

	// Sections start open; only the ones the user closed are tracked, so a
	// section that gains lines later (e.g. after a refetch) is open too.
	const [collapsed, setCollapsed] = React.useState<ReadonlySet<CrfCategory>>(
		() => new Set(),
	);

	const expandable = React.useMemo(
		() =>
			CRF_CATEGORIES.map((category) => category.value as CrfCategory).filter(
				(value) => (linesByCategory.get(value)?.length ?? 0) > 0,
			),
		[linesByCategory],
	);
	const allExpanded = expandable.every((value) => !collapsed.has(value));
	const allCollapsed = expandable.every((value) => collapsed.has(value));

	const toggle = (category: CrfCategory) =>
		setCollapsed((previous) => {
			const next = new Set(previous);
			if (!next.delete(category)) next.add(category);
			return next;
		});

	const totalQuantity = items.reduce(
		(sum, item) => sum + toNumber(item.quantity),
		0,
	);
	const grandTotal = items.reduce((sum, item) => sum + getLineAmount(item), 0);
	const pricing = sumPricing(items.map((item) => getLinePricing(item)));

	const footerStats: CrfViewStat[] = stats ?? [
		{ label: "Items", value: items.length },
		{ label: "Total qty", value: formatCrfQuantity(totalQuantity) },
		{ label: "Taxable value", value: formatCrfAmount(pricing.taxable) },
		{ label: "GST (included)", value: formatCrfAmount(pricing.gst) },
	];

	return (
		<section className="crf-details" aria-label={title ?? "CRF details"}>
			{/* ------------------------------ Header ------------------------------ */}
			<header className="crf-details-header">
				<div className="crf-details-heading">
					{title ? <h2 className="crf-details-title">{title}</h2> : null}
					<CrfStatusPill status={status} />
				</div>

				<div className="crf-details-actions">
					{headerNote ? (
						<span className="crf-details-order-id">{headerNote}</span>
					) : null}

					{expandable.length > 0 ? (
						<div className="crf-details-toolbar">
							<button
								type="button"
								className="crf-details-link"
								disabled={allCollapsed}
								onClick={() => setCollapsed(new Set(expandable))}
							>
								Collapse all
							</button>
							<button
								type="button"
								className="crf-details-link crf-details-link--accent"
								disabled={allExpanded}
								onClick={() => setCollapsed(new Set())}
							>
								Expand all
							</button>
						</div>
					) : null}

					{onGoToOrder ? (
						<Button
							type="button"
							text="Go to CRF Order"
							Icon={ArrowRight}
							iconPosition="right"
							size="sm"
							appearance="standard"
							variant="brand"
							onClick={onGoToOrder}
						/>
					) : null}

					{actions}
				</div>
			</header>

			{/* Column headings, shown once for every open section. The tables
			    below keep their own (visually hidden) headers for screen readers. */}
			{!allCollapsed ? (
				<div className="crf-details-columns" aria-hidden="true">
					<div className="crf-details-row crf-details-row--head">
						<span>Item</span>
						<span className="crf-details-num">Rate</span>
						<span className="crf-details-num">Qty</span>
						<span className="crf-details-num">Total</span>
					</div>
				</div>
			) : null}

			{/* ------------------------------ Sections ---------------------------- */}
			{CRF_CATEGORIES.map(({ title: categoryTitle, value }) => {
				const category = value as CrfCategory;
				const lines = linesByCategory.get(category) ?? [];
				const hasLines = lines.length > 0;
				const isOpen = hasLines && !collapsed.has(category);
				const panelId = `${baseId}-${category}`;
				const meta = (
					<span className="crf-details-section-meta">
						{itemCountLabel(lines.length)}
					</span>
				);

				// Nothing to expand: a quiet, non-interactive row (or nothing at all).
				if (!hasLines) {
					if (hideEmptySections) return null;

					return (
						<div
							key={category}
							className="crf-details-section crf-details-section--empty"
						>
							<div className="crf-details-section-head">
								<span className="crf-details-section-label">
									<ChevronRight aria-hidden="true" />
									{categoryTitle}
								</span>
								{meta}
							</div>
						</div>
					);
				}

				return (
					<div key={category} className="crf-details-section">
						<button
							type="button"
							className="crf-details-section-head crf-details-section-toggle"
							aria-expanded={isOpen}
							aria-controls={panelId}
							onClick={() => toggle(category)}
						>
							<span className="crf-details-section-label">
								{isOpen ? (
									<ChevronDown
										aria-hidden="true"
										className="crf-details-chevron--open"
									/>
								) : (
									<ChevronRight aria-hidden="true" />
								)}
								{categoryTitle}
							</span>
							{meta}
						</button>

						<div id={panelId} className="crf-details-panel" hidden={!isOpen}>
							<div
								className="crf-details-table"
								role="table"
								aria-label={categoryTitle}
							>
								<div
									className="crf-details-row crf-details-row--sr-head"
									role="row"
								>
									<span role="columnheader">Item</span>
									<span role="columnheader" className="crf-details-num">
										Rate
									</span>
									<span role="columnheader" className="crf-details-num">
										Qty
									</span>
									<span role="columnheader" className="crf-details-num">
										Total
									</span>
								</div>

								{lines.map((item, index) => {
									const meta = [getCodeText(item), getDetail(item)]
										.filter(Boolean)
										.join(" · ");
									const description = getDescription(item);

									return (
										<div
											key={item.id ?? `${getCrfLineKey(item)}-${index}`}
											className="crf-details-row"
											role="row"
										>
											<div role="cell" className="crf-details-item">
												<CrfImage
													src={item.imageUrl}
													alt=""
													category={item.category}
													className="crf-details-thumb"
												/>
												<div className="crf-details-item-text">
													<span className="crf-details-name">
														{item.label || "Item"}
													</span>
													{meta ? (
														<span className="crf-details-meta">{meta}</span>
													) : null}
													{description && item.category !== "ARTWORK" ? (
														<span
															className="crf-details-meta crf-details-meta--clamp"
															title={description}
														>
															{description}
														</span>
													) : null}
												</div>
											</div>

											<span
												role="cell"
												className="crf-details-num"
												data-label="Rate"
											>
												{formatCrfAmount(item.rate)}
											</span>
											<span
												role="cell"
												className="crf-details-num"
												data-label="Qty"
											>
												× {formatCrfQuantity(item.quantity)}
											</span>
											<span
												role="cell"
												className="crf-details-num crf-details-line-total"
												data-label="Total"
											>
												{formatCrfAmount(getLineAmount(item))}
											</span>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				);
			})}

			{/* ------------------------------ Details ----------------------------- */}
			{details}

			{/* ------------------------------ Footer ------------------------------ */}
			<footer className="crf-details-footer">
				<dl className="crf-details-stats">
					{footerStats.map((stat) => (
						<div key={stat.label}>
							<dt>{stat.label}</dt>
							<dd>{stat.value}</dd>
						</div>
					))}
				</dl>

				<div className="crf-details-grand">
					<span>{totalLabel}</span>
					<strong>{formatCrfAmount(totalValue ?? grandTotal)}</strong>
				</div>
			</footer>
		</section>
	);
}
