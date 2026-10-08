// crf/useCrfForm.ts
// CRF form controller. Owns the cart (LineItemOption[]), the active tab and
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

import React from "react";

import { useToast } from "../../../context/Auth/AuthContext";
import type { GroupedOption, LineItemOption } from "../shared/lineItem.types";
import {
	useCreateCrfMutation,
	useCrfProductsQuery,
	useUpdateCrfMutation,
} from "./crf.api";
import {
	buildCrfPayload,
	groupProductsByCategory,
	mapCrfLineItemsToFormItems,
} from "./crf.mapper";
import {
	EMPTY_CRF_ERRORS,
	filterCrfErrorsByCategory,
	getFirstCrfErrorMessage,
	getFirstInvalidCategory,
	hasCrfErrors,
	validateCrfForm,
	type CrfFormErrors,
} from "./crf.schema";
import { CRF_CATEGORIES, type CrfCategory, type CrfDetail } from "./crf.types";

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
	costItems: LineItemOption[];
	setCostItems: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
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
	const productsQuery = useCrfProductsQuery();

	const initialCostItems = React.useMemo(
		() => mapCrfLineItemsToFormItems(initialData?.lineItems ?? []),
		[initialData],
	);

	const [costItems, setCostItems] =
		React.useState<LineItemOption[]>(initialCostItems);

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

	const submitting = createCrfMutation.isPending || updateCrfMutation.isPending;
	const loading = productsQuery.isLoading;
	const isDirty = costItems !== initialCostItems;

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

		try {
			// Schema output: trimmed, rounded, totals recomputed, artwork-only sizes.
			const payload = buildCrfPayload(
				// buildCrfPayload only reads value/category/quantity/rate/total/
				// description/width/height/unit — all present on the schema output.
				validation.data.lineItems as unknown as LineItemOption[],
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
	]);

	const handleReset = React.useCallback(() => {
		// Tabs are independent: only the active tab goes back to its initial lines.
		setCostItems((previous) => [
			...previous.filter((item) => item.category !== activeCategory),
			...initialCostItems.filter((item) => item.category === activeCategory),
		]);
		setCheckedCategories((previous) =>
			previous.filter((category) => category !== activeCategory),
		);
	}, [activeCategory, initialCostItems]);

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
