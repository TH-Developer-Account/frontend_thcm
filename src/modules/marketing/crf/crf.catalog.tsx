// crf/CrfCatalog.tsx

import React from "react";
import { Minus, PackageOpen, Plus, Trash2 } from "lucide-react";

import Button from "../../../components/common/Button";
import { TabsBar } from "../../../components/common/TabsBar";
import { SearchInput } from "../../../components/forms/SearchInput";
import type { GroupedOption, LineItemOption } from "../shared/lineItem.types";

import {
	ARTWORK_UNITS,
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
import { CRF_CATEGORIES, type CrfCategory } from "./crf.types";
import "./crf.css";

/* ========================================================================== */
/*                                   Types                                    */
/* ========================================================================== */

type CategoryConfig = { readonly title: string; readonly value: CrfCategory };

export type CrfCatalogProps = {
	/** Products grouped by category (GroupedOption.label = category value). */
	options: GroupedOption[];
	/** Selected lines (the cart). */
	items: LineItemOption[];
	onChange: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
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

const getLineTotal = (item: LineItemOption) =>
	roundTo(toNumber(item.rate) * toNumber(item.quantity));

/** Line in the cart for this product (artwork: first size line of the product). */
const findLineIndex = (
	items: LineItemOption[],
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

/** New cart line from a catalog product. */
const createLine = (
	option: LineItemOption,
	category: CrfCategory,
): LineItemOption => {
	const isArtwork = category === "ARTWORK";
	const rate = toNumber(option.rate);

	return {
		...option,
		id: undefined, // new line — no server id yet
		category,
		particular: option.value,
		quantity: 1,
		rate,
		total: rate,
		width: isArtwork ? toNumber(option.width) || undefined : undefined,
		height: isArtwork ? toNumber(option.height) || undefined : undefined,
		unit: isArtwork ? option.unit || "ft" : undefined,
	};
};

/* ========================================================================== */
/*                               Product tile                                 */
/* ========================================================================== */

type ProductTileProps = {
	option: LineItemOption;
	category: CrfCategory;
	line?: LineItemOption;
	lineErrors?: CrfFormErrors["items"][number];
	readOnly: boolean;
	onAdd: () => void;
	onPatch: (patch: Partial<LineItemOption>) => void;
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
}: ProductTileProps) => {
	const isSelected = Boolean(line);
	const isArtwork = category === "ARTWORK";
	const quantity = line ? toNumber(line.quantity) : 0;
	const errorMessages = lineErrors
		? Object.values(lineErrors).filter(Boolean)
		: [];

	const setQuantity = (next: number | undefined) => {
		if (next !== undefined && next < 1) {
			onRemove();
			return;
		}
		onPatch({ quantity: next });
	};

	return (
		<article
			className={[
				"crf-tile",
				isSelected && "crf-tile--selected",
				errorMessages.length > 0 && "crf-tile--error",
			]
				.filter(Boolean)
				.join(" ")}
			aria-label={option.label}
		>
			<header className="crf-tile-header">
				<h4 className="crf-tile-name" title={option.label}>
					{option.label}
				</h4>
				{option.partNumber ? (
					<span className="crf-tile-part">{option.partNumber}</span>
				) : null}
			</header>

			{option.description ? (
				<p className="crf-tile-description" title={option.description}>
					{option.description}
				</p>
			) : null}

			<div className="crf-tile-meta">
				<span className="crf-tile-price">{formatCrfAmount(option.rate)}</span>
				{isArtwork ? (
					<span className="crf-tile-size">
						{formatArtworkSize(option.width, option.height, option.unit)}
					</span>
				) : null}
			</div>

			{/* ---------------- Not in cart: big "+" (the sketch's tile) --------------- */}
			{!isSelected && !readOnly ? (
				<button
					type="button"
					className="crf-tile-add"
					onClick={onAdd}
					aria-label={`Add ${option.label}`}
				>
					<Plus aria-hidden="true" />
				</button>
			) : null}

			{/* ------------------------- In cart: edit controls ------------------------ */}
			{isSelected && line ? (
				<div className="crf-tile-controls">
					{readOnly ? (
						<span className="crf-tile-qty-readonly">
							× {formatCrfQuantity(quantity)}
						</span>
					) : (
						<div className="crf-stepper" role="group" aria-label="Quantity">
							<button
								type="button"
								className="crf-stepper-button"
								onClick={() => setQuantity(quantity - 1)}
								aria-label={
									quantity <= 1
										? `Remove ${option.label}`
										: `Decrease ${option.label} quantity`
								}
							>
								<Minus aria-hidden="true" />
							</button>

							<input
								type="text"
								inputMode="numeric"
								className="crf-stepper-input"
								value={line.quantity ?? ""}
								aria-label={`${option.label} quantity`}
								aria-invalid={lineErrors?.quantity ? "true" : undefined}
								onChange={(event) => {
									const cleaned = sanitizeQuantityInput(event.target.value);
									// Blank stays blank while typing; the schema reports it.
									onPatch({
										quantity: cleaned === "" ? undefined : Number(cleaned),
									});
								}}
							/>

							<button
								type="button"
								className="crf-stepper-button"
								onClick={() => setQuantity(quantity + 1)}
								disabled={quantity >= CRF_LIMITS.MAX_QUANTITY}
								aria-label={`Increase ${option.label} quantity`}
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
							aria-label={`Remove ${option.label}`}
							onClick={onRemove}
						/>
					) : null}
				</div>
			) : null}

			{/* ------------------------- Artwork size (in cart) ----------------------- */}
			{isSelected && line && isArtwork ? (
				<div className="crf-tile-size-fields">
					{readOnly ? (
						<span>{formatArtworkSize(line.width, line.height, line.unit)}</span>
					) : (
						<>
							<input
								type="number"
								min={0}
								step="0.01"
								className="form-input crf-size-input"
								placeholder="W"
								aria-label={`${option.label} width`}
								aria-invalid={lineErrors?.width ? "true" : undefined}
								value={line.width ?? ""}
								onChange={(event) =>
									onPatch({
										width:
											event.target.value === ""
												? undefined
												: Number(event.target.value),
									})
								}
							/>
							<span aria-hidden="true">×</span>
							<input
								type="number"
								min={0}
								step="0.01"
								className="form-input crf-size-input"
								placeholder="H"
								aria-label={`${option.label} height`}
								aria-invalid={lineErrors?.height ? "true" : undefined}
								value={line.height ?? ""}
								onChange={(event) =>
									onPatch({
										height:
											event.target.value === ""
												? undefined
												: Number(event.target.value),
									})
								}
							/>
							<select
								className="form-input crf-unit-select"
								aria-label={`${option.label} unit`}
								aria-invalid={lineErrors?.unit ? "true" : undefined}
								value={line.unit ?? ""}
								onChange={(event) => onPatch({ unit: event.target.value })}
							>
								{ARTWORK_UNITS.map((unit) => (
									<option key={unit} value={unit}>
										{unit}
									</option>
								))}
							</select>
						</>
					)}
				</div>
			) : null}

			{errorMessages.length > 0 ? (
				<ul className="crf-tile-errors" role="alert">
					{errorMessages.map((message) => (
						<li key={message}>{message}</li>
					))}
				</ul>
			) : null}
		</article>
	);
};

/* ========================================================================== */
/*                               Summary card                                 */
/* ========================================================================== */

/** A cart line plus its index in the FULL items list (errors are keyed by it). */
type CartEntry = { item: LineItemOption; index: number };

type CartSummaryProps = {
	/** Title of the active tab, e.g. "Souvenirs". */
	title: string;
	/** Only the active tab's lines. */
	entries: CartEntry[];
	errors: CrfFormErrors;
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
	const visibleEntries = expanded
		? entries
		: entries.slice(0, CRF_SUMMARY_PAGE_SIZE);
	const hiddenCount = entries.length - visibleEntries.length;

	const totalQuantity = entries.reduce(
		(sum, { item }) => sum + toNumber(item.quantity),
		0,
	);
	const totalAmount = entries.reduce(
		(sum, { item }) => sum + getLineTotal(item),
		0,
	);

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

							return (
								<li
									key={item.id ?? `${getCrfLineKey(item)}-${index}`}
									className={["crf-cart-row", hasError && "crf-cart-row--error"]
										.filter(Boolean)
										.join(" ")}
								>
									<span className="crf-cart-row-name">
										{item.label || "Item"}
										{item.category === "ARTWORK" ? (
											<small>
												{formatArtworkSize(item.width, item.height, item.unit)}
											</small>
										) : null}
									</span>
									<strong className="crf-cart-row-qty">
										× {formatCrfQuantity(item.quantity)}
									</strong>
									<span className="crf-cart-row-amount">
										{formatCrfAmount(getLineTotal(item))}
									</span>
								</li>
							);
						})}
					</ul>

					{hiddenCount > 0 ? (
						<button
							type="button"
							className="crf-cart-more"
							onClick={() => setShowAll(true)}
						>
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
				<div className="crf-cart-total-amount">
					<span>Total</span>
					<span>{formatCrfAmount(totalAmount)}</span>
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

	// Search belongs to one tab: switching tabs (by click OR by the parent's
	// "Save & Next") starts with an empty search — no effect needed.
	const [searchState, setSearchState] = React.useState({
		category: activeCategory,
		text: "",
	});
	const search =
		searchState.category === activeCategory ? searchState.text : "";
	const setSearch = (text: string) =>
		setSearchState({ category: activeCategory, text });
	const query = search.trim().toLowerCase();

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

	/* ------------------------------ Mutations ---------------------------- */

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
									quantity: Math.min(
										toNumber(item.quantity) + 1,
										CRF_LIMITS.MAX_QUANTITY,
									),
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
		(productId: string, patch: Partial<LineItemOption>) => {
			onChange((previous) =>
				previous.map((item) => {
					if (item.value !== productId || item.category !== activeCategory) {
						return item;
					}
					const next = { ...item, ...patch };
					return { ...next, total: getLineTotal(next) };
				}),
			);
		},
		[activeCategory, onChange],
	);

	const removeProduct = React.useCallback(
		(productId: string) => {
			onChange((previous) =>
				previous.filter(
					(item) =>
						!(item.value === productId && item.category === activeCategory),
				),
			);
		},
		[activeCategory, onChange],
	);

	/* -------------------------------- Render ----------------------------- */

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
					placeholder="Search by name or part no."
				/>
			</div>

			{errors.form ? (
				<p className="crf-catalog-form-error" role="alert">
					{errors.form}
				</p>
			) : null}

			<div className="crf-catalog-body">
				<div className="crf-catalog-grid" role="list">
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
									<ProductTile
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
