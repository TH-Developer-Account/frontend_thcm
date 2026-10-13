import React from "react";
import { PackageOpen, Plus, RefreshCcw, SlidersHorizontal } from "lucide-react";

import Button from "../../../../components/common/Button";
import SouvenirProductView from "./SouvenirProductView";
import { useSouvenirCatalogQuery } from "./api";
import {
	STOCK_LABEL,
	createSouvenirLine,
	findVariantLineIndex,
	groupStockRows,
	type SouvenirProduct,
	type SouvenirVariant,
} from "./mapper";
import { CrfImage } from "../core/Media";
import {
	formatCrfAmount,
	formatCrfQuantity,
	type CrfFormErrors,
} from "../core/schema";
import { CRF_PAGE_SIZE, type CrfLineItem } from "../core/types";
import LoadMoreBar from "../core/LoadMoreBar";

/* ========================================================================== */
/*                                  Helpers                                   */
/* ========================================================================== */

const SOUVENIR = "SOUVENIR";

const useDebouncedValue = <T,>(value: T, delayMs = 300) => {
	const [debounced, setDebounced] = React.useState(value);
	React.useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delayMs);
		return () => clearTimeout(timer);
	}, [value, delayMs]);
	return debounced;
};

/** Indexes (in the full cart) of this product's lines. */
const getProductLineIndexes = (items: CrfLineItem[], productId: string) =>
	items.reduce<number[]>((acc, item, index) => {
		if (item.category === SOUVENIR && item.shopifyProductId === productId)
			acc.push(index);
		return acc;
	}, []);

/** The only orderable variant, when the product has nothing to choose. */
const getSingleVariant = (product: SouvenirProduct): SouvenirVariant | null =>
	product.variants.length === 1 ? product.variants[0] : null;

/* ========================================================================== */
/*                          Souvenir card (minimal)                           */
/* ========================================================================== */

type SouvenirCardProps = {
	product: SouvenirProduct;
	items: CrfLineItem[];
	errors: CrfFormErrors;
	readOnly: boolean;
	onOpen: (product: SouvenirProduct) => void;
	onQuickAdd: (product: SouvenirProduct, variant: SouvenirVariant) => void;
};

const SouvenirCard = ({
	product,
	items,
	errors,
	readOnly,
	onOpen,
	onQuickAdd,
}: SouvenirCardProps) => {
	const lineIndexes = getProductLineIndexes(items, product.productId);
	const inCrfQty = lineIndexes.reduce(
		(sum, index) => sum + (Number(items[index].quantity) || 0),
		0,
	);
	const firstError = lineIndexes
		.map((index) => errors.items[index])
		.flatMap((lineErrors) => (lineErrors ? Object.values(lineErrors) : []))
		.find(Boolean);

	// Price shown on the card: the cheapest orderable variant (else cheapest).
	const priced =
		[...product.variants]
			.filter((v) => v.isOrderable)
			.sort((a, b) => a.price - b.price)[0] ??
		[...product.variants].sort((a, b) => a.price - b.price)[0];
	const hasRange = product.minPrice !== product.maxPrice;

	const single = getSingleVariant(product);
	const canQuickAdd =
		!readOnly &&
		single !== null &&
		single.isOrderable &&
		lineIndexes.length === 0;

	// Stock hint only when it matters: low, out, or unavailable.
	const stockHint = !product.hasOrderable
		? product.variants.some((v) => !v.sku)
			? "Unavailable"
			: "Out of stock"
		: single && single.stockLevel === "LOW"
			? STOCK_LABEL.LOW(single.availableQty)
			: null;

	const open = () => onOpen(product);

	return (
		<article
			className={[
				"crf-tile",
				"crf-tile--product",
				"crf-tile--clickable",
				lineIndexes.length > 0 && "crf-tile--selected",
				firstError && "crf-tile--error",
				!product.hasOrderable && "crf-tile--unavailable",
			]
				.filter(Boolean)
				.join(" ")}
			role="button"
			tabIndex={0}
			aria-label={`${product.title} — view details`}
			onClick={open}
			onKeyDown={(event) => {
				if (event.target !== event.currentTarget) return;
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					open();
				}
			}}
		>
			<div className="crf-tile-media">
				<CrfImage
					src={product.imageUrl}
					alt={product.title}
					category={SOUVENIR}
					className="crf-tile-image"
				/>
				{product.maxDiscountPercent > 0 && product.hasOrderable ? (
					<span className="crf-badge crf-badge--discount">
						{hasRange ? "Up to " : ""}−{product.maxDiscountPercent}%
					</span>
				) : null}
				{inCrfQty > 0 ? (
					<span className="crf-badge crf-badge--in-crf">
						In CRF × {formatCrfQuantity(inCrfQty)}
					</span>
				) : null}
				{!product.hasOrderable ? (
					<span className="crf-tile-media-overlay">{stockHint}</span>
				) : null}
			</div>

			<h4 className="crf-tile-name" title={product.title}>
				{product.title}
			</h4>

			{priced ? (
				<div className="crf-price-row">
					<span className="crf-tile-price">
						{hasRange ? "From " : ""}
						{formatCrfAmount(priced.price)}
					</span>
					{priced.compareAtPrice && priced.compareAtPrice > priced.price ? (
						<s className="crf-price-compare">
							{formatCrfAmount(priced.compareAtPrice)}
						</s>
					) : null}
				</div>
			) : null}

			{stockHint && product.hasOrderable ? (
				<span className="crf-stock crf-stock--low">{stockHint}</span>
			) : null}

			{firstError ? (
				<p className="crf-tile-errors" role="alert">
					{firstError}
				</p>
			) : null}

			{!readOnly ? (
				canQuickAdd && single ? (
					<button
						type="button"
						className="crf-tile-add"
						onClick={(event) => {
							event.stopPropagation();
							onQuickAdd(product, single);
						}}
						aria-label={`Add ${product.title} to CRF`}
					>
						<Plus aria-hidden="true" />
						<span>Add</span>
					</button>
				) : (
					<button
						type="button"
						className="crf-tile-add crf-tile-add--secondary"
						onClick={(event) => {
							event.stopPropagation();
							open();
						}}
						disabled={!product.hasOrderable && lineIndexes.length === 0}
					>
						<SlidersHorizontal aria-hidden="true" />
						<span>
							{lineIndexes.length > 0
								? `× ${formatCrfQuantity(inCrfQty)} in CRF · Edit`
								: product.hasOrderable
									? "View options"
									: stockHint}
						</span>
					</button>
				)
			) : null}
		</article>
	);
};

/* ========================================================================== */
/*                              Souvenir catalog                              */
/* ========================================================================== */

export type SouvenirCatalogProps = {
	items: CrfLineItem[];
	onChange: React.Dispatch<React.SetStateAction<CrfLineItem[]>>;
	errors: CrfFormErrors;
	readOnly: boolean;
	/** Search text from the catalog toolbar (sent to the store as `q`). */
	search: string;
};

export default function SouvenirCatalog({
	items,
	onChange,
	errors,
	readOnly,
	search,
}: SouvenirCatalogProps) {
	const [category, setCategory] = React.useState<string>("");
	const [inStockOnly, setInStockOnly] = React.useState(false);
	const q = useDebouncedValue(search.trim());

	const catalog = useSouvenirCatalogQuery({
		q: q || undefined,
		category: category || undefined,
		inStock: inStockOnly ? true : undefined,
	});

	const rows = React.useMemo(
		() => catalog.data?.pages.flatMap((page) => page.data) ?? [],
		[catalog.data],
	);
	const products = React.useMemo(() => groupStockRows(rows), [rows]);

	/* --------------------------- Category chips --------------------------- */

	// Chips are learned from every response and never forgotten, so selecting
	// one (which narrows `rows` to that category) can't remove the others.
	const [knownCategories, setKnownCategories] = React.useState<string[]>([]);
	React.useEffect(() => {
		setKnownCategories((previous) => {
			const next = new Set(previous);
			rows.forEach((row) => {
				if (row.category) next.add(row.category);
			});
			return next.size === previous.length ? previous : [...next].sort();
		});
	}, [rows]);

	const categories = React.useMemo(() => {
		const set = new Set(knownCategories);
		if (category) set.add(category);
		return [...set].sort();
	}, [knownCategories, category]);

	/* ----------------------------- Load more ------------------------------ */

	// How many products are on screen. Resets whenever the filters change.
	const filterKey = `${q}|${category}|${inStockOnly}`;
	const [visible, setVisible] = React.useState({
		key: filterKey,
		count: CRF_PAGE_SIZE,
	});
	const visibleCount =
		visible.key === filterKey ? visible.count : CRF_PAGE_SIZE;

	const shownProducts = products.slice(0, visibleCount);
	const hasMore =
		products.length > visibleCount || Boolean(catalog.hasNextPage);

	const loadMore = () => {
		const next = visibleCount + CRF_PAGE_SIZE;
		setVisible({ key: filterKey, count: next });
		// Not enough loaded yet → pull the next page from the store.
		if (
			next > products.length &&
			catalog.hasNextPage &&
			!catalog.isFetchingNextPage
		) {
			void catalog.fetchNextPage();
		}
	};

	/* ------------------------------ Actions ------------------------------ */

	/** Product open in the single-product view (null = closed). */
	const [viewing, setViewing] = React.useState<SouvenirProduct | null>(null);

	const quickAdd = React.useCallback(
		(product: SouvenirProduct, variant: SouvenirVariant) => {
			onChange((previous) =>
				findVariantLineIndex(previous, variant.variantId) >= 0
					? previous
					: [...previous, createSouvenirLine(product, variant, 1)],
			);
		},
		[onChange],
	);

	/* -------------------------------- Render ----------------------------- */

	return (
		<div className="crf-souvenirs">
			<div
				className="crf-souvenir-filters"
				role="toolbar"
				aria-label="Souvenir filters"
			>
				<button
					type="button"
					className={["crf-chip", !category && "crf-chip--active"]
						.filter(Boolean)
						.join(" ")}
					onClick={() => setCategory("")}
				>
					All
				</button>
				{categories.map((value) => (
					<button
						key={value}
						type="button"
						className={["crf-chip", category === value && "crf-chip--active"]
							.filter(Boolean)
							.join(" ")}
						onClick={() => setCategory(value === category ? "" : value)}
					>
						{value}
					</button>
				))}

				<label className="crf-toggle">
					<input
						type="checkbox"
						checked={inStockOnly}
						onChange={(event) => setInStockOnly(event.target.checked)}
					/>
					In stock only
				</label>
			</div>

			<div
				className="crf-catalog-grid"
				role="list"
				aria-busy={catalog.isFetching}
			>
				{catalog.isLoading ? (
					Array.from({ length: CRF_PAGE_SIZE }, (_, i) => (
						<div
							key={i}
							role="listitem"
							className="crf-tile crf-tile--skeleton"
							aria-hidden="true"
						/>
					))
				) : catalog.isError ? (
					<div className="crf-catalog-empty" role="alert">
						<PackageOpen aria-hidden="true" />
						<p>Couldn't load souvenirs from the store.</p>
						<Button
							type="button"
							text="Retry"
							Icon={RefreshCcw}
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={() => void catalog.refetch()}
						/>
					</div>
				) : products.length === 0 ? (
					<div className="crf-catalog-empty">
						<PackageOpen aria-hidden="true" />
						<p>
							{q || category || inStockOnly
								? "No souvenirs match your filters."
								: "No souvenirs available in the store."}
						</p>
					</div>
				) : (
					shownProducts.map((product) => (
						<div role="listitem" key={product.productId}>
							<SouvenirCard
								product={product}
								items={items}
								errors={errors}
								readOnly={readOnly}
								onOpen={setViewing}
								onQuickAdd={quickAdd}
							/>
						</div>
					))
				)}
			</div>

			<LoadMoreBar
				shown={shownProducts.length}
				// The exact total is only known once the store has no more pages.
				total={catalog.hasNextPage ? undefined : products.length}
				hasMore={hasMore && !catalog.isLoading && !catalog.isError}
				loading={catalog.isFetchingNextPage}
				onClick={loadMore}
			/>

			{viewing ? (
				<SouvenirProductView
					key={viewing.productId}
					product={viewing}
					items={items}
					onChange={onChange}
					readOnly={readOnly}
					onClose={() => setViewing(null)}
				/>
			) : null}
		</div>
	);
}
