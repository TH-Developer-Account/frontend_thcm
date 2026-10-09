// crf/core/useCrfForm.ts
// CRF form controller. Owns the cart (CrfLineItem[]), the active tab and
// the validation state; <CrfForm /> / <CrfCatalog /> just render it.
//
// Tabs work as steps:  Printed Materials → Souvenirs → Artworks
//   • "Save & Next" checks ONLY the active tab's lines and moves to the next
//     tab. Nothing is sent to the API. An empty tab is allowed (a CRF does
//     not need every category).
//   • The last tab's save checks the whole CRF (at least one item, every
//     line valid) and creates / updates it. If a line in another tab is
//     invalid, the form jumps to that tab. The parent's `onSuccess` then
//     moves the flow on (e.g. to EPF).
//
// Errors are shown per tab: only for tabs the user has already saved, and
// they re-check live as the cart changes. After the final save, all errors
// are shown.
//
// Souvenirs come from the store, so the final save first re-checks live stock
// (POST /crf-shop/stock-check — a check, never a reservation). Lines whose
// stock dropped get the fresh availability, the schema flags them, and the
// form jumps to the Souvenirs tab instead of saving.
//
// Edit mode: a saved souvenir line only carries { sku, requestedQty, status }
// (see crf.types.ts) — nothing to show. Once mapCrfLineItemsToFormItems has
// produced the bare lines, a live catalog lookup for exactly those SKUs
// (useSouvenirStockBySkusQuery) backfills title/image/price/GST, applied
// once via backfillSouvenirDisplayFields. That backfill isn't a user edit,
// so the "is this tab dirty" baseline moves forward with it (initialCostItemsRef).

import React from "react";

import { useToast } from "../../../../context/Auth/AuthContext";
import type { GroupedOption } from "../../shared/lineItem.types";
import { useSouvenirStockBySkusQuery, useStockCheckMutation } from "../shop/api";
import {
	useCreateCrfMutation,
	useCrfProductsQuery,
	useUpdateCrfMutation,
} from "./api";
import {
	backfillSouvenirDisplayFields,
	buildCrfPayload,
	groupProductsByCategory,
	mapCrfLineItemsToFormItems,
} from "./mapper";
import {
	EMPTY_CRF_ERRORS,
	filterCrfErrorsByCategory,
	getFirstCrfErrorMessage,
	getFirstInvalidCategory,
	hasCrfErrors,
	validateCrfForm,
	type CrfFormErrors,
} from "./schema";
import {
	CRF_CATEGORIES,
	type CrfCategory,
	type CrfDetail,
	type CrfLineItem,
} from "./types";

export type CrfFormProps = {
	/** Parent EPC the CRF belongs to (sent in the payload). */
	epcId: string;
	/** Existing CRF → edit mode. Omit / null → create mode. */
	initialData?: CrfDetail | null;
	/** Called after a successful save. The parent refreshes its own data here. */
	onSuccess: (saved?: unknown) => void | Promise<void>;
	onCancel?: () => void;
	/** Overrides the LAST tab's save label (e.g. "Save & Next" inside the wizard). */
	submitLabel?: string;
};

type CategoryStep = (typeof CRF_CATEGORIES)[number];

type UseCrfFormResult = {
	costItems: CrfLineItem[];
	setCostItems: React.Dispatch<React.SetStateAction<CrfLineItem[]>>;
	options: GroupedOption[];
	errors: CrfFormErrors;
	loading: boolean;
	submitting: boolean;
	isEditMode: boolean;
	isDirty: boolean;

	/* --------------------------- Tab steps --------------------------- */
	steps: readonly CategoryStep[];
	activeCategory: CrfCategory;
	setActiveCategory: (category: CrfCategory) => void;
	stepIndex: number;
	isFirstStep: boolean;
	isLastStep: boolean;
	/** Back one tab (no validation). */
	handleBack: () => void;
	/** Intermediate tabs: validate this tab, then go to the next one. */
	handleSaveAndNext: () => void;
	/** Last tab: validate everything, then create / update the CRF. */
	handleSubmit: () => Promise<void>;
	/** Resets only the active tab to its initial lines. */
	handleReset: () => void;
};

const STEPS = CRF_CATEGORIES;

export function useCrfForm({
	epcId,
	initialData,
	onSuccess,
}: CrfFormProps): UseCrfFormResult {
	const { showToast } = useToast();

	const crfId = initialData?.id ?? null;
	const isEditMode = Boolean(crfId);

	const createCrfMutation = useCreateCrfMutation();
	const updateCrfMutation = useUpdateCrfMutation();
	const stockCheckMutation = useStockCheckMutation();
	const productsQuery = useCrfProductsQuery();

	const initialCostItems = React.useMemo(
		() => mapCrfLineItemsToFormItems(initialData?.items ?? []),
		[initialData],
	);

	const [costItems, setCostItems] =
		React.useState<CrfLineItem[]>(initialCostItems);

	// Moves forward with the one-time souvenir backfill below, so that
	// backfill isn't itself mistaken for a user edit by isDirty.
	const initialCostItemsRef = React.useRef(initialCostItems);

	/* --------------------- Souvenir display backfill ----------------------- */

	const souvenirSkus = React.useMemo(
		() =>
			(initialData?.items ?? [])
				.filter((item) => item.source === "SHOPIFY")
				.map((item) => item.sku),
		[initialData],
	);

	const souvenirBackfillQuery = useSouvenirStockBySkusQuery(
		souvenirSkus,
		souvenirSkus.length > 0,
	);

	const backfillAppliedRef = React.useRef(false);
	React.useEffect(() => {
		if (!souvenirBackfillQuery.data || backfillAppliedRef.current) return;
		backfillAppliedRef.current = true;

		setCostItems((previous) => {
			const next = backfillSouvenirDisplayFields(
				previous,
				souvenirBackfillQuery.data.data,
			);
			initialCostItemsRef.current = next;
			return next;
		});
	}, [souvenirBackfillQuery.data]);

	/* ------------------------------ Tab state ------------------------------ */

	const [activeCategory, setActiveCategory] = React.useState<CrfCategory>(
		STEPS[0].value,
	);
	/** Tabs whose "Save & Next" was clicked → their errors are visible. */
	const [checkedCategories, setCheckedCategories] = React.useState<
		CrfCategory[]
	>([]);
	/** Set by the final save → every error (incl. CRF-level) is visible. */
	const [finalAttempted, setFinalAttempted] = React.useState(false);

	const stepIndex = Math.max(
		0,
		STEPS.findIndex((step) => step.value === activeCategory),
	);
	const isFirstStep = stepIndex === 0;
	const isLastStep = stepIndex === STEPS.length - 1;

	const markChecked = React.useCallback((category: CrfCategory) => {
		setCheckedCategories((previous) =>
			previous.includes(category) ? previous : [...previous, category],
		);
	}, []);

	/* ------------------------------ Derived -------------------------------- */

	const options = React.useMemo(
		() => groupProductsByCategory(productsQuery.data ?? []),
		[productsQuery.data],
	);

	// Cheap (≤100 lines), so it runs on every cart change instead of an effect.
	const validation = React.useMemo(
		() => validateCrfForm({ epcId, lineItems: costItems }),
		[costItems, epcId],
	);

	// Only reveal errors for tabs the user has already tried to save.
	const errors = React.useMemo<CrfFormErrors>(() => {
		if (finalAttempted) return validation.errors;
		if (checkedCategories.length === 0) return EMPTY_CRF_ERRORS;
		return filterCrfErrorsByCategory(
			validation.errors,
			costItems,
			checkedCategories,
		);
	}, [checkedCategories, costItems, finalAttempted, validation.errors]);

	const submitting =
		createCrfMutation.isPending ||
		updateCrfMutation.isPending ||
		stockCheckMutation.isPending;
	const loading =
		productsQuery.isLoading ||
		(souvenirSkus.length > 0 && souvenirBackfillQuery.isLoading);
	const isDirty = costItems !== initialCostItemsRef.current;

	/* ------------------------------ Actions -------------------------------- */

	const showFixToast = React.useCallback(
		(tabErrors: CrfFormErrors) => {
			showToast({
				type: "error",
				title: "Please fix the CRF",
				description:
					getFirstCrfErrorMessage(tabErrors, costItems) ??
					"Some CRF items are invalid.",
			});
		},
		[costItems, showToast],
	);

	const handleBack = React.useCallback(() => {
		if (isFirstStep) return;
		setActiveCategory(STEPS[stepIndex - 1].value);
	}, [isFirstStep, stepIndex]);

	const handleSaveAndNext = React.useCallback(() => {
		if (submitting || isLastStep) return;

		markChecked(activeCategory);

		const tabErrors = filterCrfErrorsByCategory(validation.errors, costItems, [
			activeCategory,
		]);

		if (hasCrfErrors(tabErrors)) {
			showFixToast(tabErrors);
			return;
		}

		setActiveCategory(STEPS[stepIndex + 1].value);
	}, [
		activeCategory,
		costItems,
		isLastStep,
		markChecked,
		showFixToast,
		stepIndex,
		submitting,
		validation.errors,
	]);

	/**
	 * Live stock re-check for souvenir lines right before saving.
	 * Writes the fresh availability onto the lines, so the schema shows
	 * "Only N in stock" / "Out of stock" on exactly the lines that changed.
	 * Returns true when every souvenir line can still be fulfilled.
	 */
	const verifySouvenirStock = React.useCallback(async (): Promise<boolean> => {
		const souvenirLines = costItems.filter(
			(item) => item.category === "SOUVENIR" && item.sku,
		);
		if (souvenirLines.length === 0) return true;

		let result;
		try {
			result = await stockCheckMutation.mutateAsync(
				souvenirLines.map((item) => ({
					sku: item.sku as string,
					quantity: Number(item.quantity) || 0,
				})),
			);
		} catch (error) {
			console.error("CRF stock check failed:", error);
			showToast({
				type: "error",
				title: "Couldn't check stock",
				description:
					"The store couldn't be reached to confirm souvenir stock. Please try again.",
			});
			return false;
		}

		const bySku = new Map(
			result.lines.map((line) => [line.sku.toLowerCase(), line]),
		);

		setCostItems((previous) =>
			previous.map((item) => {
				if (item.category !== "SOUVENIR" || !item.sku) return item;
				const line = bySku.get(item.sku.toLowerCase());
				return line
					? { ...item, availableQty: line.available, stockStatus: line.status }
					: item;
			}),
		);

		if (result.allAvailable) return true;

		setActiveCategory("SOUVENIR");
		const shortCount = result.lines.filter(
			(line) => line.status !== "AVAILABLE",
		).length;
		showToast({
			type: "error",
			title: "Stock changed",
			description: `${shortCount} souvenir ${shortCount === 1 ? "item has" : "items have"} less stock than requested. Adjust the highlighted items and save again.`,
		});
		return false;
	}, [costItems, showToast, stockCheckMutation]);

	const handleSubmit = React.useCallback(async () => {
		if (submitting) return;

		if (productsQuery.isError) {
			showToast({
				type: "error",
				title: "Error",
				description:
					"CRF products failed to load. Please refresh and try again.",
			});
			return;
		}

		setFinalAttempted(true);

		if (!validation.success) {
			// Bring the user to the tab that has the first broken line.
			const invalidCategory = getFirstInvalidCategory(
				validation.errors,
				costItems,
			);
			if (invalidCategory) setActiveCategory(invalidCategory);

			showFixToast(validation.errors);
			return;
		}

		// Store stock can change between adding an item and saving.
		if (!(await verifySouvenirStock())) return;

		try {
			// Schema output: trimmed, rounded line items. buildCrfPayload turns
			// each into exactly what the backend accepts — identity + quantity
			// (+ size for artworks) — never rate/amount/total for a catalog
			// line and never a souvenir snapshot; both are computed or looked
			// up server-side.
			const payload = buildCrfPayload(
				validation.data.lineItems as unknown as CrfLineItem[],
				validation.data.epcId,
			);

			const saved = crfId
				? await updateCrfMutation.mutateAsync({ crfId, payload })
				: await createCrfMutation.mutateAsync(payload);

			showToast({
				type: "success",
				title: "Success",
				description: crfId
					? "CRF modified successfully."
					: "CRF created successfully.",
			});

			// Parent decides what's next (refresh EPC, move the wizard to EPF …).
			await onSuccess(saved);
		} catch (error: any) {
			console.error("CRF save failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to save CRF.",
			});
		}
	}, [
		costItems,
		createCrfMutation,
		crfId,
		onSuccess,
		productsQuery.isError,
		showFixToast,
		showToast,
		submitting,
		updateCrfMutation,
		validation,
		verifySouvenirStock,
	]);

	const handleReset = React.useCallback(() => {
		// Tabs are independent: only the active tab goes back to its initial lines.
		setCostItems((previous) => [
			...previous.filter((item) => item.category !== activeCategory),
			...initialCostItemsRef.current.filter(
				(item) => item.category === activeCategory,
			),
		]);
		setCheckedCategories((previous) =>
			previous.filter((category) => category !== activeCategory),
		);
	}, [activeCategory]);

	return {
		costItems,
		setCostItems,
		options,
		errors,
		loading,
		submitting,
		isEditMode,
		isDirty,

		steps: STEPS,
		activeCategory,
		setActiveCategory,
		stepIndex,
		isFirstStep,
		isLastStep,
		handleBack,
		handleSaveAndNext,
		handleSubmit,
		handleReset,
	};
}
