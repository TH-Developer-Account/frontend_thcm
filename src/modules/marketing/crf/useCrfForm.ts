// crf/useCrfForm.ts
// CRF form controller. Owns the cart (LineItemOption[]) and validation state;
// <CrfForm /> / <CrfCatalog /> just render it.
//
// Validation is Zod-only (crf.schema.ts):
//   • nothing is shown while the user is still picking items,
//   • the first Save validates everything and reveals errors,
//   • after that, errors re-validate live as the cart changes.

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
	getFirstCrfErrorMessage,
	validateCrfForm,
	type CrfFormErrors,
} from "./crf.schema";
import type { CrfDetail } from "./crf.types";

export type CrfFormProps = {
	/** Parent EPC the CRF belongs to (sent in the payload). */
	epcId: string;
	/** Existing CRF → edit mode. Omit / null → create mode. */
	initialData?: CrfDetail | null;
	/** Called after a successful save. The parent refreshes its own data here. */
	onSuccess: (saved?: unknown) => void | Promise<void>;
	onCancel?: () => void;
	/** Overrides the save button label (e.g. "Save & Next" inside the wizard). */
	submitLabel?: string;
};

type UseCrfFormResult = {
	costItems: LineItemOption[];
	setCostItems: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
	options: GroupedOption[];
	errors: CrfFormErrors;
	loading: boolean;
	submitting: boolean;
	isEditMode: boolean;
	isDirty: boolean;
	handleSubmit: () => Promise<void>;
	handleReset: () => void;
};

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
	const [errors, setErrors] = React.useState<CrfFormErrors>(EMPTY_CRF_ERRORS);
	const [hasSubmitted, setHasSubmitted] = React.useState(false);

	const options = React.useMemo(
		() => groupProductsByCategory(productsQuery.data ?? []),
		[productsQuery.data],
	);

	// Live re-validation, but only after the first submit attempt.
	React.useEffect(() => {
		if (!hasSubmitted) return;
		setErrors(validateCrfForm({ epcId, lineItems: costItems }).errors);
	}, [costItems, epcId, hasSubmitted]);

	const submitting = createCrfMutation.isPending || updateCrfMutation.isPending;
	const loading = productsQuery.isLoading;
	const isDirty = costItems !== initialCostItems;

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

		setHasSubmitted(true);
		const validation = validateCrfForm({ epcId, lineItems: costItems });
		setErrors(validation.errors);

		if (!validation.success) {
			showToast({
				type: "error",
				title: "Please fix the CRF",
				description:
					getFirstCrfErrorMessage(validation.errors, costItems) ??
					"Some CRF items are invalid.",
			});
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
		epcId,
		onSuccess,
		productsQuery.isError,
		showToast,
		submitting,
		updateCrfMutation,
	]);

	const handleReset = React.useCallback(() => {
		setCostItems(initialCostItems);
		setErrors(EMPTY_CRF_ERRORS);
		setHasSubmitted(false);
	}, [initialCostItems]);

	return {
		costItems,
		setCostItems,
		options,
		errors,
		loading,
		submitting,
		isEditMode,
		isDirty,
		handleSubmit,
		handleReset,
	};
}
