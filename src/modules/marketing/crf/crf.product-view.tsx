// crf/crf.product-view.tsx
// Single-product view for a store souvenir, e-commerce style, in a modal.
//
//   ┌──────────────────────────────────────────────────────────────────┐
//   │ Polo T-Shirt                                                 [×] │
//   ├───────────────────────────┬──────────────────────────────────────┤
//   │                           │ Apparel · Tata Hitachi               │
//   │        main image         │ ₹549.00  ₹799.00  −31%               │
//   │                           │ You save ₹250.00 per piece           │
//   │ [▪][▪][▪]  thumbnails     │ ┌ GST 5% · prices include GST ─────┐ │
//   │                           │ │ Taxable · GST · Price  (1 / × n)  │ │
//   │                           │ └ Saved with this CRF line ─────────┘ │
//   │                           │ Size    [M] [L̶] [XL]                 │
//   │                           │ Colour  (●) Orange                   │
//   │                           │ 25 in stock · SKU THCM-0201          │
//   │                           │ Qty [− 2 +]                          │
//   │                           │ In this CRF: M / Orange × 2          │
//   │                           │ Description …                        │
//   ├───────────────────────────┴──────────────────────────────────────┤
//   │                    [Close] [Remove] [Add to CRF · ₹1,098.00]     │
//   └──────────────────────────────────────────────────────────────────┘
//
// Renders instantly from the listing data, then fills in the gallery,
// description and fresh stock from Get Product. The cart stays in useCrfForm
// (items / onChange); this view only edits the selected variant's line.

import React from "react";
import { Check, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import Button from "../../../components/common/Button";
import { Modal } from "../../../components/common/Modal";
import { CrfImage } from "./crf.media";
import { useSouvenirProductQuery } from "./crf.shop.api";
import {
	SHOP_PRICES_INCLUDE_GST,
	STOCK_LABEL,
	createSouvenirLine,
	findVariantBySelection,
	findVariantLineIndex,
	getDefaultVariant,
	getLinePricing,
	getOptionAxes,
	getProductLines,
	isOptionValueOrderable,
	mapProductDetail,
	toDetailPlaceholder,
	type OptionSelection,
	type SouvenirProduct,
	type SouvenirVariant,
} from "./crf.shop.mapper";
import {
	CRF_LIMITS,
	formatCrfAmount,
	formatCrfQuantity,
	sanitizeQuantityInput,
} from "./crf.schema";
import type { CrfLineItem } from "./crf.types";

/* ========================================================================== */
/*                                   Types                                    */
/* ========================================================================== */

export type SouvenirProductViewProps = {
	/** Listing product to show; the view fetches the full product itself. */
	product: SouvenirProduct;
	items: CrfLineItem[];
	onChange: React.Dispatch<React.SetStateAction<CrfLineItem[]>>;
	readOnly?: boolean;
	onClose: () => void;
};

/* ========================================================================== */
/*                                  Helpers                                   */
/* ========================================================================== */

/** Initial variant: one already in the CRF, else the first orderable one. */
const getInitialVariant = (product: SouvenirProduct, items: CrfLineItem[]) => {
	const inCart = getProductLines(items, product.productId)[0];
	return (
		product.variants.find((v) => v.variantId === inCart?.variantId) ??
		getDefaultVariant(product)
	);
};

/** CSS can paint common colour names ("Orange", "Navy"); others show no dot. */
const isCssColor = (value: string) =>
	typeof CSS !== "undefined" && CSS.supports?.("color", value.toLowerCase());

/* ========================================================================== */
/*                               GST breakdown                                */
/* ========================================================================== */

type GstPanelProps = {
	gstRate: number | null;
	variant: SouvenirVariant;
	quantity: number;
};

const GstPanel = ({ gstRate, variant, quantity }: GstPanelProps) => {
	const unit = getLinePricing({ rate: variant.price, quantity: 1, compareAtPrice: variant.compareAtPrice, gstRate });
	const line = getLinePricing({ rate: variant.price, quantity, compareAtPrice: variant.compareAtPrice, gstRate });

	if (gstRate === null) {
		return (
			<section className="crf-gst-panel crf-gst-panel--missing" aria-label="GST">
				<p>
					<strong>GST not set in the store.</strong> This product has no GST tag, so
					it's treated as 0% on this CRF.
				</p>
			</section>
		);
	}

	return (
		<section className="crf-gst-panel" aria-label="GST details">
			<header className="crf-gst-panel-header">
				<span className="crf-badge crf-badge--gst">GST {gstRate}%</span>
				<span>
					{SHOP_PRICES_INCLUDE_GST ? "Prices include GST" : "GST is added to the price"}
				</span>
			</header>

			<table className="crf-gst-table">
				<thead>
					<tr>
						<th scope="col" />
						<th scope="col">Per piece</th>
						<th scope="col">× {formatCrfQuantity(quantity)}</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th scope="row">Taxable value</th>
						<td>{formatCrfAmount(unit.taxable)}</td>
						<td>{formatCrfAmount(line.taxable)}</td>
					</tr>
					<tr>
						<th scope="row">GST ({gstRate}%)</th>
						<td>{formatCrfAmount(unit.gst)}</td>
						<td>{formatCrfAmount(line.gst)}</td>
					</tr>
					<tr className="crf-gst-table-total">
						<th scope="row">Total</th>
						<td>{formatCrfAmount(unit.total)}</td>
						<td>{formatCrfAmount(line.total)}</td>
					</tr>
				</tbody>
			</table>

			<p className="crf-gst-note">
				The GST rate and price are saved with this CRF line, so later store
				changes won't alter it.
			</p>
		</section>
	);
};

/* ========================================================================== */
/*                                 Component                                  */
/* ========================================================================== */

export default function SouvenirProductView({
	product: listingProduct,
	items,
	onChange,
	readOnly = false,
	onClose,
}: SouvenirProductViewProps) {
	/* ------------------------------ Data -------------------------------- */

	const detailQuery = useSouvenirProductQuery(listingProduct.productId);

	// Listing data renders instantly; Get Product adds the gallery,
	// description and fresh stock when it arrives.
	const product = React.useMemo(
		() =>
			detailQuery.data
				? mapProductDetail(detailQuery.data)
				: toDetailPlaceholder(listingProduct),
		[detailQuery.data, listingProduct],
	);

	const axes = React.useMemo(() => getOptionAxes(product.variants), [product.variants]);

	/* ------------------------------ Selection --------------------------- */

	const [selection, setSelection] = React.useState<OptionSelection>(
		() => getInitialVariant(listingProduct, items)?.options ?? {},
	);
	// Products whose variants have titles but no options (rare) pick by id.
	const [pickedVariantId, setPickedVariantId] = React.useState(
		() => getInitialVariant(listingProduct, items)?.variantId,
	);

	const variant: SouvenirVariant | undefined =
		axes.length > 0
			? findVariantBySelection(product.variants, selection)
			: (product.variants.find((v) => v.variantId === pickedVariantId) ??
				product.variants[0]);

	const lineIndex = variant ? findVariantLineIndex(items, variant.variantId) : -1;
	const line = lineIndex >= 0 ? items[lineIndex] : undefined;

	/* ------------------------------ Quantity ---------------------------- */

	const [quantity, setQuantity] = React.useState<number | "">(
		() => Number(line?.quantity) || 1,
	);
	const [justAdded, setJustAdded] = React.useState(false);

	// Switching variant → show that variant's CRF quantity (or 1).
	const variantKey = variant?.variantId;
	const lineQty = line?.quantity;
	React.useEffect(() => {
		setQuantity(Number(lineQty) || 1);
		setJustAdded(false);
	}, [variantKey]); // eslint-disable-line react-hooks/exhaustive-deps

	const maxQty = Math.min(variant?.availableQty ?? 0, CRF_LIMITS.MAX_QUANTITY);
	const qty = quantity === "" ? 0 : quantity;
	const qtyError =
		!variant || !variant.isOrderable
			? null
			: qty < 1
				? "Enter a quantity of at least 1."
				: qty > maxQty
					? `Only ${formatCrfQuantity(maxQty)} in stock.`
					: null;

	const canSubmit = Boolean(variant?.isOrderable) && !qtyError && !readOnly;
	const total = variant
		? getLinePricing({ rate: variant.price, quantity: qty, compareAtPrice: variant.compareAtPrice, gstRate: product.gstRate }).total
		: 0;

	/* ------------------------------ Gallery ----------------------------- */

	const images = product.images.length ? product.images : [null];
	const [activeImage, setActiveImage] = React.useState(0);
	const mainImage = images[Math.min(activeImage, images.length - 1)];

	/* ------------------------------ Actions ----------------------------- */

	const addOrUpdate = () => {
		if (!variant || !canSubmit) return;

		onChange((previous) => {
			const index = findVariantLineIndex(previous, variant.variantId);
			const fresh = createSouvenirLine(product, variant, qty);

			if (index < 0) return [...previous, fresh];

			// Update quantity and refresh the snapshot (price / GST / stock).
			return previous.map((item, i) =>
				i === index ? { ...item, ...fresh, id: item.id } : item,
			);
		});
		setJustAdded(true);
	};

	const removeVariant = (variantId: string) => {
		onChange((previous) =>
			previous.filter(
				(item) => !(item.category === "SOUVENIR" && item.variantId === variantId),
			),
		);
	};

	const productLines = getProductLines(items, product.productId);

	/* ------------------------------ Render ------------------------------ */

	const footerActions = readOnly ? (
		<Button type="button" text="Close" size="sm" appearance="standard" variant="outline" onClick={onClose} />
	) : (
		<>
			<Button type="button" text="Close" Icon={X} size="sm" appearance="standard" variant="outline" onClick={onClose} />
			{line ? (
				<Button
					type="button"
					text="Remove"
					Icon={Trash2}
					size="sm"
					appearance="standard"
					variant="outline"
					onClick={() => variant && removeVariant(variant.variantId)}
				/>
			) : null}
			<Button
				type="button"
				text={
					justAdded
						? "Added to CRF"
						: `${line ? "Update CRF" : "Add to CRF"} · ${formatCrfAmount(total)}`
				}
				Icon={justAdded ? Check : ShoppingBag}
				size="sm"
				appearance="standard"
				variant="brand"
				disabled={!canSubmit || justAdded}
				onClick={addOrUpdate}
			/>
		</>
	);

	return (
		<Modal
			open
			size="xl"
			title={product.title}
			onClose={onClose}
			className="crf-product-modal"
			footer_children={
				variant?.sku ? <span className="crf-tile-part">SKU {variant.sku}</span> : null
			}
			footer_actions={footerActions}
		>
			<div className="crf-product-view">
				{/* ------------------------------ Gallery ------------------------------ */}
				<div className="crf-product-gallery">
					<div className="crf-product-main-image">
						<CrfImage src={mainImage} alt={product.title} category="SOUVENIR" className="crf-tile-image" />
						{variant && variant.discountPercent > 0 ? (
							<span className="crf-badge crf-badge--discount">−{variant.discountPercent}%</span>
						) : null}
					</div>

					{images.length > 1 ? (
						<div className="crf-product-thumbs" role="tablist" aria-label="Product images">
							{images.map((src, index) => (
								<button
									key={`${src}-${index}`}
									type="button"
									role="tab"
									aria-selected={index === activeImage}
									aria-label={`Image ${index + 1}`}
									className={["crf-product-thumb", index === activeImage && "crf-product-thumb--active"].filter(Boolean).join(" ")}
									onClick={() => setActiveImage(index)}
								>
									<CrfImage src={src} alt="" category="SOUVENIR" className="crf-tile-image" />
								</button>
							))}
						</div>
					) : null}
				</div>

				{/* ------------------------------ Details ------------------------------ */}
				<div className="crf-product-details">
					<p className="crf-product-eyebrow">
						{[product.category, product.vendor].filter(Boolean).join(" · ")}
					</p>

					{product.tags.length ? (
						<div className="crf-variant-chips">
							{product.tags.map((tag) => (
								<span key={tag} className="crf-badge crf-badge--gst">{tag}</span>
							))}
						</div>
					) : null}

					{variant ? (
						<div className="crf-product-price">
							<span className="crf-product-price-now">{formatCrfAmount(variant.price)}</span>
							{variant.compareAtPrice && variant.compareAtPrice > variant.price ? (
								<>
									<s className="crf-price-compare">{formatCrfAmount(variant.compareAtPrice)}</s>
									<span className="crf-product-saving">
										You save {formatCrfAmount(variant.compareAtPrice - variant.price)} per piece
									</span>
								</>
							) : null}
						</div>
					) : (
						<p className="crf-tile-part">Select options to see the price.</p>
					)}

					{variant ? <GstPanel gstRate={product.gstRate} variant={variant} quantity={qty || 1} /> : null}

					{/* ----------------------------- Options ----------------------------- */}
					{axes.map((axis) => (
						<fieldset key={axis.name} className="crf-option-group" disabled={readOnly}>
							<legend>
								{axis.label}
								{selection[axis.name] ? <span>: {selection[axis.name]}</span> : null}
							</legend>
							<div className="crf-variant-chips">
								{axis.values.map((value) => {
									const orderable = isOptionValueOrderable(product.variants, selection, axis.name, value);
									const active = selection[axis.name] === value;
									const isColour = /^colou?r$/i.test(axis.name);
									return (
										<button
											key={value}
											type="button"
											aria-pressed={active}
											className={["crf-chip", "crf-chip--option", active && "crf-chip--active", !orderable && "crf-chip--disabled"].filter(Boolean).join(" ")}
											title={orderable ? value : `${value} — not available with this selection`}
											onClick={() => setSelection((prev) => ({ ...prev, [axis.name]: value }))}
										>
											{isColour && isCssColor(value) ? (
												<span className="crf-swatch" style={{ backgroundColor: value.toLowerCase() }} aria-hidden="true" />
											) : null}
											{value}
										</button>
									);
								})}
							</div>
						</fieldset>
					))}

					{axes.length === 0 && product.variants.length > 1 ? (
						<fieldset className="crf-option-group" disabled={readOnly}>
							<legend>Variant</legend>
							<div className="crf-variant-chips">
								{product.variants.map((v) => (
									<button
										key={v.variantId}
										type="button"
										aria-pressed={v.variantId === variant?.variantId}
										className={["crf-chip", "crf-chip--option", v.variantId === variant?.variantId && "crf-chip--active", !v.isOrderable && "crf-chip--disabled"].filter(Boolean).join(" ")}
										onClick={() => setPickedVariantId(v.variantId)}
									>
										{v.variantTitle ?? "Default"}
									</button>
								))}
							</div>
						</fieldset>
					) : null}

					{/* -------------------------- Stock + quantity ----------------------- */}
					{variant ? (
						<p className={`crf-stock crf-stock--${variant.stockLevel.toLowerCase()}`}>
							{STOCK_LABEL[variant.stockLevel](variant.availableQty)}
							{variant.variantTitle ? ` · ${variant.variantTitle}` : ""}
						</p>
					) : (
						<p className="crf-stock crf-stock--unavailable">This combination isn't available.</p>
					)}

					{!readOnly && variant?.isOrderable ? (
						<div className="crf-product-qty">
							<span className="crf-field-label">Quantity</span>
							<div className="crf-stepper" role="group" aria-label="Quantity">
								<button
									type="button"
									className="crf-stepper-button"
									onClick={() => setQuantity(Math.max(1, qty - 1))}
									disabled={qty <= 1}
									aria-label="Decrease quantity"
								>
									<Minus aria-hidden="true" />
								</button>
								<input
									type="text"
									inputMode="numeric"
									className="crf-stepper-input"
									value={quantity}
									aria-label="Quantity"
									aria-invalid={qtyError ? "true" : undefined}
									onChange={(event) => {
										const cleaned = sanitizeQuantityInput(event.target.value);
										setQuantity(cleaned === "" ? "" : Number(cleaned));
										setJustAdded(false);
									}}
								/>
								<button
									type="button"
									className="crf-stepper-button"
									onClick={() => {
										setQuantity(Math.min(maxQty, qty + 1));
										setJustAdded(false);
									}}
									disabled={qty >= maxQty}
									aria-label="Increase quantity"
								>
									<Plus aria-hidden="true" />
								</button>
							</div>
							{qtyError ? <span className="crf-tile-errors" role="alert">{qtyError}</span> : null}
						</div>
					) : null}

					{/* --------------------- Variants already in the CRF ----------------- */}
					{productLines.length ? (
						<div className="crf-product-in-crf">
							<span className="crf-field-label">In this CRF</span>
							<ul>
								{productLines.map((item) => (
									<li key={item.variantId ?? item.sku ?? item.value}>
										<span>
											{item.variantTitle ?? "Default"} × {formatCrfQuantity(item.quantity)}
										</span>
										{!readOnly ? (
											<button
												type="button"
												className="crf-link-button"
												onClick={() => removeVariant(item.variantId as string)}
												aria-label={`Remove ${item.variantTitle ?? product.title} from CRF`}
											>
												Remove
											</button>
										) : null}
									</li>
								))}
							</ul>
						</div>
					) : null}

					{product.description ? (
						<div className="crf-product-description">
							<span className="crf-field-label">Description</span>
							<p>{product.description}</p>
						</div>
					) : detailQuery.isLoading ? (
						<p className="crf-tile-part" role="status">Loading product details…</p>
					) : null}
				</div>
			</div>
		</Modal>
	);
}
