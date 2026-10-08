// crf/crf.catalog.tsx
// CRF item picker — category tabs, product cards, and the active tab's
// summary card.
//
//   [ Printed Materials ] [ Souvenirs ] [ Artworks ]          [ search ]
//
//   Printed Materials  MAP product master · placeholder image · price · qty
//                      (no size fields)
//   Souvenirs          live from the store (crf.souvenirs.tsx): image,
//                      variants, price / compare-at, discount, GST, stock
//   Artworks           MAP product master · placeholder image · WIDE card;
//                      digital → pick a pixel resolution (preset or custom)
//
// Fully controlled: the cart (items / onChange) lives in useCrfForm. This
// component owns only UI state (search, and the active tab when the parent
// doesn't control it).
//
// Tabs are independent: the grid AND the summary card show only the active
// tab's category. The summary lists the first few lines; "Load more" shows
// the rest of that tab's lines.

import React from "react";
import { Minus, PackageOpen, Plus, Trash2 } from "lucide-react";

import Button from "../../../components/common/Button";
import { TabsBar } from "../../../components/common/TabsBar";
import { SearchInput } from "../../../components/forms/SearchInput";
import type { GroupedOption, LineItemOption } from "../shared/lineItem.types";

import {
	CRF_LIMITS,
	EMPTY_CRF_ERRORS,
	formatArtworkSize,
	formatCrfAmount,
	formatCrfQuantity,
	getCrfLineKey,
	roundTo,
	sanitizeQuantityInput,
	type CrfFormErrors,
} from "./crf.schema";
import { getLinePricing, sumPricing } from "./crf.shop.mapper";
import { CrfImage } from "./crf.media";
import SouvenirCatalog from "./crf.souvenirs";
import {
	ARTWORK_CUSTOM_PRESET,
	ARTWORK_RESOLUTION_PRESETS,
	CRF_CATEGORIES,
	type ArtworkResolutionPreset,
	type CrfCategory,
	type CrfLineItem,
} from "./crf.types";
import "./crf.css";

/* ========================================================================== */
/*                                   Types                                    */
/* ========================================================================== */

type CategoryConfig = { readonly title: string; readonly value: CrfCategory };

export type CrfCatalogProps = {
	/** MAP products grouped by category (printed materials, artworks). */
	options: GroupedOption[];
	/** Selected lines (the cart). */
	items: CrfLineItem[];
	onChange: React.Dispatch<React.SetStateAction<CrfLineItem[]>>;
	/** Output of validateCrfForm — shown on tiles and above the grid. */
	errors?: CrfFormErrors;
	/** Hides all add / edit controls. */
	readOnly?: boolean;
	/** Override to show a subset of categories. Defaults to all CRF categories. */
	categories?: readonly CategoryConfig[];
	/** Uncontrolled starting tab (ignored when `activeCategory` is passed). */
	defaultCategory?: CrfCategory;
	/** Controlled active tab — pass with `onCategoryChange` (CrfForm's steps). */
	activeCategory?: CrfCategory;
	onCategoryChange?: (category: CrfCategory) => void;
};

/** Lines shown in the summary card before "Load more". */
export const CRF_SUMMARY_PAGE_SIZE = 5;

/* ========================================================================== */
/*                                  Helpers                                   */
/* ========================================================================== */

const toNumber = (value: unknown) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

/** Line in the cart for a MAP product (printed / artwork: one line each). */
const findLineIndex = (
	items: CrfLineItem[],
	productId: string,
	category: string,
) =>
	items.findIndex(
		(item) => item.value === productId && item.category === category,
	);

const matchesSearch = (option: LineItemOption, query: string) => {
	if (!query) return true;
	const haystack = [option.label, option.partNumber, option.description]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();
	return haystack.includes(query);
};

/**
 * New cart line from a MAP product.
 *   • Printed: no size fields at all.
 *   • Artwork: px, resolution still to be chosen (the schema requires it).
 */
const createLine = (
	option: LineItemOption,
	category: CrfCategory,
): CrfLineItem => {
	const rate = toNumber(option.rate);
	const { width: _w, height: _h, unit: _u, ...rest } = option;

	return {
		...rest,
		id: undefined, // new line — no server id yet
		category,
		particular: option.value,
		quantity: 1,
		rate,
		total: rate,
		...(category === "ARTWORK"
			? { unit: "px", width: undefined, height: undefined, resolutionPreset: undefined }
			: {}),
	};
};

/** Patch for a resolution preset choice (fills or clears width × height). */
const getPresetPatch = (
	preset: ArtworkResolutionPreset | "",
): Partial<CrfLineItem> => {
	if (!preset) {
		return { resolutionPreset: undefined, width: undefined, height: undefined, unit: "px" };
	}
	if (preset === ARTWORK_CUSTOM_PRESET) {
		return { resolutionPreset: preset, unit: "px" };
	}
	const match = ARTWORK_RESOLUTION_PRESETS.find((p) => p.value === preset);
	return {
		resolutionPreset: preset,
		width: match?.width,
		height: match?.height,
		unit: "px",
	};
};

/* ========================================================================== */
/*                           Shared quantity controls                         */
/* ========================================================================== */

type QuantityControlsProps = {
	label: string;
	line: CrfLineItem;
	invalid: boolean;
	readOnly: boolean;
	onQuantity: (next: number | undefined) => void;
	onRemove: () => void;
};

const QuantityControls = ({
	label,
	line,
	invalid,
	readOnly,
	onQuantity,
	onRemove,
}: QuantityControlsProps) => {
	const quantity = toNumber(line.quantity);

	const step = (next: number) => {
		if (next < 1) {
			onRemove();
			return;
		}
		onQuantity(next);
	};

	return (
		<div className="crf-tile-controls">
			{readOnly ? (
				<span className="crf-tile-qty-readonly">× {formatCrfQuantity(quantity)}</span>
			) : (
				<div className="crf-stepper" role="group" aria-label="Quantity">
					<button
						type="button"
						className="crf-stepper-button"
						onClick={() => step(quantity - 1)}
						aria-label={quantity <= 1 ? `Remove ${label}` : `Decrease ${label} quantity`}
					>
						<Minus aria-hidden="true" />
					</button>
					<input
						type="text"
						inputMode="numeric"
						className="crf-stepper-input"
						value={line.quantity ?? ""}
						aria-label={`${label} quantity`}
						aria-invalid={invalid ? "true" : undefined}
						onChange={(event) => {
							const cleaned = sanitizeQuantityInput(event.target.value);
							// Blank stays blank while typing; the schema reports it.
							onQuantity(cleaned === "" ? undefined : Number(cleaned));
						}}
					/>
					<button
						type="button"
						className="crf-stepper-button"
						onClick={() => step(quantity + 1)}
						disabled={quantity >= CRF_LIMITS.MAX_QUANTITY}
						aria-label={`Increase ${label} quantity`}
					>
						<Plus aria-hidden="true" />
					</button>
				</div>
			)}

			{!readOnly ? (
				<Button
					type="button"
					appearance="icon"
					variant="outline"
					size="sm"
					Icon={Trash2}
					aria-label={`Remove ${label}`}
					onClick={onRemove}
				/>
			) : null}
		</div>
	);
};

const TileErrors = ({ messages }: { messages: string[] }) =>
	messages.length > 0 ? (
		<ul className="crf-tile-errors" role="alert">
			{messages.map((message) => (
				<li key={message}>{message}</li>
			))}
		</ul>
	) : null;

/* ========================================================================== */
/*                        Printed material tile (compact)                     */
/* ========================================================================== */

type TileProps = {
	option: LineItemOption;
	category: CrfCategory;
	line?: CrfLineItem;
	lineErrors?: CrfFormErrors["items"][number];
	readOnly: boolean;
	onAdd: () => void;
	onPatch: (patch: Partial<CrfLineItem>) => void;
	onRemove: () => void;
};

const ProductTile = ({
	option,
	category,
	line,
	lineErrors,
	readOnly,
	onAdd,
	onPatch,
	onRemove,
}: TileProps) => {
	const errorMessages = lineErrors ? Object.values(lineErrors).filter(Boolean) as string[] : [];

	return (
		<article
			className={[
				"crf-tile",
				"crf-tile--product",
				line && "crf-tile--selected",
				errorMessages.length > 0 && "crf-tile--error",
			]
				.filter(Boolean)
				.join(" ")}
			aria-label={option.label}
		>
			<div className="crf-tile-media">
				<CrfImage alt={option.label} category={category} className="crf-tile-image" />
			</div>

			<header className="crf-tile-header">
				<h4 className="crf-tile-name" title={option.label}>
					{option.label}
				</h4>
				{option.partNumber ? <span className="crf-tile-part">{option.partNumber}</span> : null}
			</header>

			{option.description ? (
				<p className="crf-tile-description" title={option.description}>
					{option.description}
				</p>
			) : null}

			<div className="crf-price-row">
				<span className="crf-tile-price">{formatCrfAmount(option.rate)}</span>
				<span className="crf-tile-part">per piece</span>
			</div>

			{!line && !readOnly ? (
				<button type="button" className="crf-tile-add" onClick={onAdd} aria-label={`Add ${option.label}`}>
					<Plus aria-hidden="true" />
					<span>Add</span>
				</button>
			) : null}

			{line ? (
				<QuantityControls
					label={option.label}
					line={line}
					invalid={Boolean(lineErrors?.quantity)}
					readOnly={readOnly}
					onQuantity={(quantity) => onPatch({ quantity })}
					onRemove={onRemove}
				/>
			) : null}

			<TileErrors messages={errorMessages} />
		</article>
	);
};

/* ========================================================================== */
/*                      Artwork tile (wide · digital resolution)              */
/* ========================================================================== */

const ArtworkTile = ({
	option,
	category,
	line,
	lineErrors,
	readOnly,
	onAdd,
	onPatch,
	onRemove,
}: TileProps) => {
	const errorMessages = lineErrors ? Object.values(lineErrors).filter(Boolean) as string[] : [];
	const preset = line?.resolutionPreset ?? "";
	const isCustom = preset === ARTWORK_CUSTOM_PRESET;
	const presetHint = ARTWORK_RESOLUTION_PRESETS.find((p) => p.value === preset)?.hint;
	const sizeInvalid = Boolean(
		lineErrors?.resolutionPreset || lineErrors?.width || lineErrors?.height || lineErrors?.unit,
	);

	const setDimension = (key: "width" | "height", raw: string) => {
		const digits = raw.replace(/\D/g, "").slice(0, String(CRF_LIMITS.MAX_PIXELS).length);
		onPatch({ [key]: digits === "" ? undefined : Number(digits), resolutionPreset: ARTWORK_CUSTOM_PRESET });
	};

	return (
		<article
			className={[
				"crf-tile",
				"crf-tile--wide",
				line && "crf-tile--selected",
				errorMessages.length > 0 && "crf-tile--error",
			]
				.filter(Boolean)
				.join(" ")}
			aria-label={option.label}
		>
			<div className="crf-tile-media crf-tile-media--side">
				<CrfImage alt={option.label} category={category} className="crf-tile-image" />
			</div>

			<div className="crf-tile-body">
				<header className="crf-tile-header">
					<h4 className="crf-tile-name" title={option.label}>
						{option.label}
					</h4>
					<span className="crf-tile-part">
						{[option.partNumber, "Digital artwork"].filter(Boolean).join(" · ")}
					</span>
				</header>

				{option.description ? (
					<p className="crf-tile-description" title={option.description}>
						{option.description}
					</p>
				) : null}

				<div className="crf-price-row">
					<span className="crf-tile-price">{formatCrfAmount(option.rate)}</span>
					<span className="crf-tile-part">per artwork</span>
				</div>

				{!line && !readOnly ? (
					<button type="button" className="crf-tile-add" onClick={onAdd} aria-label={`Add ${option.label}`}>
						<Plus aria-hidden="true" />
						<span>Add &amp; choose size</span>
					</button>
				) : null}

				{line ? (
					<>
						{/* ---------------------- Resolution (required) --------------------- */}
						{readOnly ? (
							<span className="crf-tile-part">
								{formatArtworkSize(line.width, line.height, line.unit)}
							</span>
						) : (
							<div className="crf-resolution">
								<label className="crf-field-label" htmlFor={`res-${option.value}`}>
									Resolution <span aria-hidden="true">*</span>
								</label>
								<select
									id={`res-${option.value}`}
									className="form-input crf-resolution-select"
									value={preset}
									aria-invalid={sizeInvalid ? "true" : undefined}
									onChange={(event) =>
										onPatch(getPresetPatch(event.target.value as ArtworkResolutionPreset | ""))
									}
								>
									<option value="">Select resolution…</option>
									{ARTWORK_RESOLUTION_PRESETS.map((p) => (
										<option key={p.value} value={p.value}>
											{p.label}
										</option>
									))}
									<option value={ARTWORK_CUSTOM_PRESET}>Custom size (px)…</option>
								</select>
								{presetHint ? <span className="crf-tile-part">{presetHint}</span> : null}

								{isCustom ? (
									<div className="crf-tile-size-fields">
										<input
											type="text"
											inputMode="numeric"
											className="form-input crf-size-input"
											placeholder="Width"
											aria-label={`${option.label} width in pixels`}
											aria-invalid={lineErrors?.width ? "true" : undefined}
											value={line.width ?? ""}
											onChange={(event) => setDimension("width", event.target.value)}
										/>
										<span aria-hidden="true">×</span>
										<input
											type="text"
											inputMode="numeric"
											className="form-input crf-size-input"
											placeholder="Height"
											aria-label={`${option.label} height in pixels`}
											aria-invalid={lineErrors?.height ? "true" : undefined}
											value={line.height ?? ""}
											onChange={(event) => setDimension("height", event.target.value)}
										/>
										<span className="crf-tile-part">px</span>
									</div>
								) : null}
							</div>
						)}

						<QuantityControls
							label={option.label}
							line={line}
							invalid={Boolean(lineErrors?.quantity)}
							readOnly={readOnly}
							onQuantity={(quantity) => onPatch({ quantity })}
							onRemove={onRemove}
						/>
					</>
				) : null}

				<TileErrors messages={errorMessages} />
			</div>
		</article>
	);
};

/* ========================================================================== */
/*                               Summary card                                 */
/* ========================================================================== */

/** A cart line plus its index in the FULL items list (errors are keyed by it). */
type CartEntry = { item: CrfLineItem; index: number };

type CartSummaryProps = {
	/** Title of the active tab, e.g. "Souvenirs". */
	title: string;
	/** Only the active tab's lines. */
	entries: CartEntry[];
	errors: CrfFormErrors;
};

/** Second line under the item name: variant (souvenir) or size (artwork). */
const getLineDetail = (item: CrfLineItem) => {
	if (item.category === "SOUVENIR") {
		return [item.variantTitle, item.sku].filter(Boolean).join(" · ") || null;
	}
	if (item.category === "ARTWORK") {
		return formatArtworkSize(item.width, item.height, item.unit);
	}
	return null;
};

/**
 * Summary of the ACTIVE tab only. Render it with `key={activeCategory}` so
 * "Load more" collapses again when the tab changes.
 */
const CartSummary = ({ title, entries, errors }: CartSummaryProps) => {
	const [showAll, setShowAll] = React.useState(false);

	// Never hide a broken line behind "Load more".
	const hiddenHasError = entries
		.slice(CRF_SUMMARY_PAGE_SIZE)
		.some(({ index }) => Boolean(errors.items[index]));

	const expanded = showAll || hiddenHasError;
	const visibleEntries = expanded ? entries : entries.slice(0, CRF_SUMMARY_PAGE_SIZE);
	const hiddenCount = entries.length - visibleEntries.length;

	const totalQuantity = entries.reduce((sum, { item }) => sum + toNumber(item.quantity), 0);
	const totals = sumPricing(entries.map(({ item }) => getLinePricing(item)));

	return (
		<aside className="crf-cart" aria-label={`${title} — selected items`}>
			<header className="crf-cart-title">
				<span>{title}</span>
				<span className="crf-cart-count">
					{entries.length} {entries.length === 1 ? "item" : "items"}
				</span>
			</header>

			{entries.length === 0 ? (
				<div className="crf-cart-empty">
					<PackageOpen aria-hidden="true" />
					<p>No {title.toLowerCase()} added yet.</p>
					<p className="crf-cart-empty-hint">Tap + on a product to add it.</p>
				</div>
			) : (
				<>
					<ul className="crf-cart-list">
						{visibleEntries.map(({ item, index }) => {
							const hasError = Boolean(errors.items[index]);
							const detail = getLineDetail(item);
							const pricing = getLinePricing(item);

							return (
								<li
									key={item.id ?? `${getCrfLineKey(item)}-${index}`}
									className={["crf-cart-row", hasError && "crf-cart-row--error"].filter(Boolean).join(" ")}
								>
									<CrfImage
										src={item.imageUrl}
										alt=""
										category={item.category}
										className="crf-cart-thumb"
									/>
									<span className="crf-cart-row-name">
										{item.label || "Item"}
										{detail ? <small>{detail}</small> : null}
									</span>
									<span className="crf-cart-row-figures">
										<strong className="crf-cart-row-qty">× {formatCrfQuantity(item.quantity)}</strong>
										<span className="crf-cart-row-amount">{formatCrfAmount(pricing.total)}</span>
									</span>
								</li>
							);
						})}
					</ul>

					{hiddenCount > 0 ? (
						<button type="button" className="crf-cart-more" onClick={() => setShowAll(true)}>
							Load more ({hiddenCount})
						</button>
					) : null}
				</>
			)}

			<footer className="crf-cart-total">
				<div>
					<span>Total qty</span>
					<span>{formatCrfQuantity(totalQuantity)}</span>
				</div>
				{totals.discount > 0 ? (
					<>
						<div>
							<span>MRP</span>
							<span>{formatCrfAmount(totals.mrpAmount)}</span>
						</div>
						<div className="crf-cart-total-discount">
							<span>Discount</span>
							<span>− {formatCrfAmount(totals.discount)}</span>
						</div>
					</>
				) : null}
				{totals.gst > 0 ? (
					<>
						<div>
							<span>Taxable value</span>
							<span>{formatCrfAmount(totals.taxable)}</span>
						</div>
						<div>
							<span>GST</span>
							<span>{formatCrfAmount(totals.gst)}</span>
						</div>
					</>
				) : null}
				<div className="crf-cart-total-amount">
					<span>Total</span>
					<span>{formatCrfAmount(roundTo(totals.total))}</span>
				</div>
			</footer>
		</aside>
	);
};

/* ========================================================================== */
/*                                  Catalog                                   */
/* ========================================================================== */

export default function CrfCatalog({
	options,
	items,
	onChange,
	errors = EMPTY_CRF_ERRORS,
	readOnly = false,
	categories = CRF_CATEGORIES,
	defaultCategory,
	activeCategory: controlledCategory,
	onCategoryChange,
}: CrfCatalogProps) {
	/* ------------------------------ Tab state ---------------------------- */

	const [uncontrolledCategory, setUncontrolledCategory] =
		React.useState<CrfCategory>(
			defaultCategory ?? categories[0]?.value ?? "PRINTED_MATERIAL",
		);
	const activeCategory = controlledCategory ?? uncontrolledCategory;

	const changeCategory = React.useCallback(
		(category: CrfCategory) => {
			if (onCategoryChange) onCategoryChange(category);
			else setUncontrolledCategory(category);
		},
		[onCategoryChange],
	);

	// Search belongs to one tab: switching tabs starts with an empty search.
	const [searchState, setSearchState] = React.useState({
		category: activeCategory,
		text: "",
	});
	const search = searchState.category === activeCategory ? searchState.text : "";
	const setSearch = (text: string) =>
		setSearchState({ category: activeCategory, text });
	const query = search.trim().toLowerCase();

	const isSouvenirTab = activeCategory === "SOUVENIR";
	const isArtworkTab = activeCategory === "ARTWORK";

	/* ------------------------------ Derived ------------------------------ */

	const activeTitle =
		categories.find((category) => category.value === activeCategory)?.title ??
		"Items";

	/** Active tab's lines, keeping each line's index in the full list. */
	const activeEntries = React.useMemo<CartEntry[]>(
		() =>
			items
				.map((item, index) => ({ item, index }))
				.filter(({ item }) => item.category === activeCategory),
		[items, activeCategory],
	);

	const tabItems = React.useMemo(
		() =>
			categories.map(({ title, value }) => {
				const count = items.filter((item) => item.category === value).length;
				return {
					value,
					label: title,
					badge:
						count > 0 ? (
							<span className="crf-tab-badge" aria-label={`${count} selected`}>
								{count}
							</span>
						) : undefined,
				};
			}),
		[categories, items],
	);

	const products = React.useMemo(
		() =>
			(
				options.find((group) => group.label === activeCategory)?.options ?? []
			).filter((option) => matchesSearch(option, query)),
		[options, activeCategory, query],
	);

	/* --------------------- Mutations (printed / artwork) ----------------- */

	const addProduct = React.useCallback(
		(option: LineItemOption) => {
			onChange((previous) => {
				const index = findLineIndex(previous, option.value, activeCategory);

				// Already in cart → merge (bump quantity) instead of duplicating.
				if (index >= 0) {
					return previous.map((item, itemIndex) =>
						itemIndex === index
							? {
									...item,
									quantity: Math.min(toNumber(item.quantity) + 1, CRF_LIMITS.MAX_QUANTITY),
								}
							: item,
					);
				}

				return [...previous, createLine(option, activeCategory)];
			});
		},
		[activeCategory, onChange],
	);

	const patchProduct = React.useCallback(
		(productId: string, patch: Partial<CrfLineItem>) => {
			onChange((previous) =>
				previous.map((item) => {
					if (item.value !== productId || item.category !== activeCategory) {
						return item;
					}
					const next = { ...item, ...patch };
					return { ...next, total: roundTo(toNumber(next.rate) * toNumber(next.quantity)) };
				}),
			);
		},
		[activeCategory, onChange],
	);

	const removeProduct = React.useCallback(
		(productId: string) => {
			onChange((previous) =>
				previous.filter(
					(item) => !(item.value === productId && item.category === activeCategory),
				),
			);
		},
		[activeCategory, onChange],
	);

	/* -------------------------------- Render ----------------------------- */

	const Tile = isArtworkTab ? ArtworkTile : ProductTile;

	return (
		<section className="crf-catalog" aria-label="CRF item catalog">
			<div className="crf-catalog-toolbar">
				<TabsBar<CrfCategory>
					items={tabItems}
					active={activeCategory}
					onChange={changeCategory}
					ariaLabel="CRF categories"
				/>

				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder={
						isSouvenirTab ? "Search souvenirs, SKU, size, colour…" : "Search by name or part no."
					}
				/>
			</div>

			{errors.form ? (
				<p className="crf-catalog-form-error" role="alert">
					{errors.form}
				</p>
			) : null}

			<div className="crf-catalog-body">
				{isSouvenirTab ? (
					<SouvenirCatalog
						items={items}
						onChange={onChange}
						errors={errors}
						readOnly={readOnly}
						search={search}
					/>
				) : (
					<div
						className={["crf-catalog-grid", isArtworkTab && "crf-catalog-grid--wide"]
							.filter(Boolean)
							.join(" ")}
						role="list"
					>
						{products.length === 0 ? (
							<div className="crf-catalog-empty">
								<PackageOpen aria-hidden="true" />
								<p>
									{query
										? "No products match your search."
										: "No products available in this category."}
								</p>
							</div>
						) : (
							products.map((option) => {
								const index = findLineIndex(items, option.value, activeCategory);
								const line = index >= 0 ? items[index] : undefined;

								return (
									<div role="listitem" key={option.value}>
										<Tile
											option={option}
											category={activeCategory}
											line={line}
											lineErrors={line ? errors.items[index] : undefined}
											readOnly={readOnly}
											onAdd={() => addProduct(option)}
											onPatch={(patch) => patchProduct(option.value, patch)}
											onRemove={() => removeProduct(option.value)}
										/>
									</div>
								);
							})
						)}
					</div>
				)}

				<CartSummary
					key={activeCategory}
					title={activeTitle}
					entries={activeEntries}
					errors={errors}
				/>
			</div>
		</section>
	);
}
