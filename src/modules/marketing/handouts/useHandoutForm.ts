// handouts/useHandoutForm.ts
// State + submit flow of the "New handout request" page.
//
// Details are validated with handouts.schema.ts. The souvenir lines are the
// CRF's own CrfLineItem cart, validated with the CRF's validateCrfForm, so
// quantity / SKU / stock rules are identical to a CRF souvenir line.
//
// Submit order:  validate → live stock check (display only, soft-fails) →
// POST /handouts → refresh lists → back to the Handouts page.

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useToast } from "../../../context/Auth/AuthContext";
import {
	showApiErrorToast,
	showSuccessToast,
	showWarningToast,
} from "../../../utils/apiError.helper";
import {
	EMPTY_CRF_ERRORS,
	getFirstCrfErrorMessage,
	useStockCheckMutation,
	validateCrfForm,
	type CrfFormErrors,
	type CrfLineItem,
} from "../crf";

import { handoutKeys, useCreateHandoutMutation } from "./handouts.api";
import { HANDOUT_LIMITS, HANDOUTS_BASE_PATH } from "./handouts.constants";
import {
	EMPTY_HANDOUT_DETAILS,
	HANDOUT_MESSAGES,
	handoutDetailsSchema,
	parseWithFieldErrors,
	type HandoutDetailsErrors,
	type HandoutDetailsField,
	type HandoutDetailsValues,
} from "./handouts.schema";
import type { CreateHandoutPayload } from "./handouts.types";

// The CRF validator wants an EPC id; a handout has none, so a fixed marker.
const NO_EPC = "HANDOUT";

const toNumber = (value: unknown) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

export function useHandoutForm() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	const createHandout = useCreateHandoutMutation();
	const stockCheck = useStockCheckMutation();

	const [values, setValues] =
		useState<Required<HandoutDetailsValues>>(EMPTY_HANDOUT_DETAILS);
	const [errors, setErrors] = useState<HandoutDetailsErrors>({});
	const [items, setItemsState] = useState<CrfLineItem[]>([]);
	const [itemErrors, setItemErrors] = useState<CrfFormErrors>(EMPTY_CRF_ERRORS);

	const setField = useCallback(
		(name: HandoutDetailsField, value: string) => {
			setValues((previous) => ({ ...previous, [name]: value }));
			setErrors((previous) =>
				previous[name] ? { ...previous, [name]: undefined } : previous,
			);
		},
		[],
	);

	// Same signature CrfCatalog expects; editing the cart clears stale errors.
	const setItems: Dispatch<SetStateAction<CrfLineItem[]>> = useCallback(
		(update) => {
			setItemsState(update);
			setItemErrors(EMPTY_CRF_ERRORS);
		},
		[],
	);

	/** Validates the cart; an empty cart gets the handout wording. */
	const validateItems = useCallback((lines: CrfLineItem[]) => {
		if (lines.length === 0) {
			return {
				success: false as const,
				errors: { form: HANDOUT_MESSAGES.itemsRequired, items: {} },
			};
		}
		if (lines.length > HANDOUT_LIMITS.MAX_ITEMS) {
			return {
				success: false as const,
				errors: { form: HANDOUT_MESSAGES.tooManyItems, items: {} },
			};
		}
		return validateCrfForm({ epcId: NO_EPC, lineItems: lines });
	}, []);

	/**
	 * Live stock for the cart. Returns the cart with availableQty / stockStatus
	 * filled in, or null when the store could not be reached (soft-fail: stock
	 * is not reserved anyway and the approver re-checks it).
	 */
	const refreshStock = useCallback(
		async (lines: CrfLineItem[]): Promise<CrfLineItem[] | null> => {
			const perSku = new Map<string, number>();
			for (const line of lines) {
				if (!line.sku) continue;
				perSku.set(line.sku, (perSku.get(line.sku) ?? 0) + toNumber(line.quantity));
			}

			try {
				const result = await stockCheck.mutateAsync(
					[...perSku.entries()].map(([sku, quantity]) => ({ sku, quantity })),
				);
				const bySku = new Map(result.lines.map((line) => [line.sku, line]));
				return lines.map((line) => {
					const found = line.sku ? bySku.get(line.sku) : undefined;
					return found
						? {
								...line,
								availableQty: found.available,
								stockStatus: found.status,
							}
						: line;
				});
			} catch {
				showWarningToast(
					showToast,
					"Stock could not be verified right now. The approver will see live stock.",
					"Stock check skipped",
				);
				return null;
			}
		},
		[showToast, stockCheck],
	);

	const submit = useCallback(async () => {
		const details = parseWithFieldErrors(handoutDetailsSchema, values);
		const firstPass = validateItems(items);

		setErrors(details.success ? {} : (details.errors as HandoutDetailsErrors));
		setItemErrors(firstPass.errors);

		if (!details.success || !firstPass.success) {
			showToast({
				type: "error",
				title: "Check the request",
				description: !details.success
					? Object.values(details.errors)[0]
					: (getFirstCrfErrorMessage(firstPass.errors, items) ??
						HANDOUT_MESSAGES.itemsRequired),
			});
			return;
		}

		// Fresh stock, then the same rules again (now with availableQty).
		const refreshed = await refreshStock(items);
		const lines = refreshed ?? items;
		if (refreshed) {
			setItemsState(refreshed);
			const secondPass = validateItems(refreshed);
			if (!secondPass.success) {
				setItemErrors(secondPass.errors);
				showToast({
					type: "error",
					title: "Some items are short",
					description:
						getFirstCrfErrorMessage(secondPass.errors, refreshed) ??
						"Reduce the quantity or remove the item.",
				});
				return;
			}
		}

		const payload: CreateHandoutPayload = {
			purpose: details.data.purpose,
			requiredBy: details.data.requiredBy,
			deliverTo: details.data.deliverTo,
			contactPhone: details.data.contactPhone,
			remarks: details.data.remarks || undefined,
			items: lines.map((line) => ({
				sku: line.sku as string,
				quantity: toNumber(line.quantity),
				title: line.label || undefined,
				variantTitle: line.variantTitle || undefined,
				imageUrl: line.imageUrl || undefined,
				rate: toNumber(line.rate),
			})),
		};

		try {
			const created = await createHandout.mutateAsync(payload);
			await queryClient.invalidateQueries({ queryKey: handoutKeys.all });
			showSuccessToast(
				showToast,
				`Request ${created.requestNumber} was submitted for approval.`,
				"Handout requested",
			);
			navigate(HANDOUTS_BASE_PATH);
		} catch (error) {
			showApiErrorToast(
				showToast,
				error,
				"The handout request could not be submitted.",
				"Unable to submit",
			);
		}
	}, [
		createHandout,
		items,
		navigate,
		queryClient,
		refreshStock,
		showToast,
		validateItems,
		values,
	]);

	return {
		values,
		errors,
		setField,
		items,
		setItems,
		itemErrors,
		submit,
		submitting: createHandout.isPending || stockCheck.isPending,
	};
}
