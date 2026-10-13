// crf/order/useCrfOrder.ts
// Controller for the CRF order section. Owns the dispatch-details form and
// the souvenir swap cart; CrfOrderSection / its sub-components only render
// what this returns.
//
//   APPROVED          → dispatch details → Place order
//   STOCK_SHORTFALL   → dispatch details → (a) swap souvenir lines (cart,
//                        capped at souvenirTotalAtApproval) or (b) place the
//                        order anyway (acceptPartial: true — backend raises
//                        a debit note for the shortfall value)
//   ORDER_FAILED      → dispatch details (in case the failure was an
//                        address problem) → Retry order
//   ORDERED           → order summary (from ApiCrfOrder) → Cancel order
//
// No client-side stock check here: which souvenir lines are short is read
// straight off crf.items[].status (OUT_OF_STOCK vs REQUESTED), which the
// backend's post-approval / swap evaluation already wrote. Nothing is
// re-derived or polled.

import React from "react";

import { useToast } from "../../../../context/Auth/AuthContext";
import { backfillSouvenirDisplayFields, buildCrfItemInput } from "../core/mapper";
import {
	usePlaceCrfOrderMutation,
	useRetryCrfOrderMutation,
	useCancelCrfOrderMutation,
	useSwapSouvenirLinesMutation,
	useUpdateDispatchDetailsMutation,
} from "./api";
import {
	getLineTotals,
	getSouvenirFormLines,
} from "./logic";
import {
	getDefaultDispatchFormValues,
	validateDispatchForm,
} from "./schema";
import type { CrfDispatchFormErrors, CrfDispatchFormField, CrfDispatchFormValues } from "./types";
import { useSouvenirStockBySkusQuery } from "../shop/api";
import { getCrfLineKey, validateCrfForm, type CrfFormErrors } from "../core/schema";
import type { CrfDetail, CrfLineItem, CrfShopifyItem } from "../core/types";

export type CrfOrderStep = "dispatch" | "shortfall" | "replace";

const getErrorMessage = (error: unknown, fallback: string) => {
	const response = (error as { response?: { data?: { message?: string } } } | undefined)?.response;
	const message = response?.data?.message ?? (error as { message?: string } | undefined)?.message;
	return message || fallback;
};

export function useCrfOrder(crf: CrfDetail | null, onRefresh: () => void | Promise<void>) {
	const { showToast } = useToast();
	const crfId = crf?.id ?? null;
	const status = crf?.status ?? null;
	const permissions = crf?.permissions ?? null;

	/* ------------------------------ Souvenir lines -------------------------- */

	const shopifyItems = React.useMemo(
		() => (crf?.items ?? []).filter((item): item is CrfShopifyItem => item.source === "SHOPIFY"),
		[crf],
	);
	const souvenirSkus = React.useMemo(() => shopifyItems.map((item) => item.sku), [shopifyItems]);

	const backfillQuery = useSouvenirStockBySkusQuery(souvenirSkus, souvenirSkus.length > 0);

	const bareSouvenirLines = React.useMemo(() => getSouvenirFormLines(crf), [crf]);
	const souvenirLines = React.useMemo(
		() =>
			backfillQuery.data
				? backfillSouvenirDisplayFields(bareSouvenirLines, backfillQuery.data.data)
				: bareSouvenirLines,
		[backfillQuery.data, bareSouvenirLines],
	);
	const souvenirTotals = React.useMemo(() => getLineTotals(souvenirLines), [souvenirLines]);

	/** sku → requestedQty/status, straight off the saved CRF items (no re-check). */
	const shortLines = React.useMemo(() => {
		const shortSkus = new Set(
			shopifyItems.filter((item) => item.status === "OUT_OF_STOCK").map((item) => item.sku),
		);
		return souvenirLines.filter((line) => line.sku && shortSkus.has(line.sku));
	}, [shopifyItems, souvenirLines]);
	const shortTotals = React.useMemo(() => getLineTotals(shortLines), [shortLines]);
	const inStockLines = React.useMemo(
		() => souvenirLines.filter((line) => !shortLines.includes(line)),
		[shortLines, souvenirLines],
	);

	/* ------------------------------ Dispatch form --------------------------- */

	const [values, setValues] = React.useState<CrfDispatchFormValues>(() => getDefaultDispatchFormValues());
	const [errors, setErrors] = React.useState<CrfDispatchFormErrors>({});

	const setField = React.useCallback(
		<K extends CrfDispatchFormField>(field: K, value: CrfDispatchFormValues[K]) => {
			setValues((previous) => ({ ...previous, [field]: value }));
			setErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous));
		},
		[],
	);

	const dispatchMutation = useUpdateDispatchDetailsMutation();

	const submitDispatchDetails = React.useCallback(async () => {
		if (!crfId) return false;
		const validation = validateDispatchForm(values);
		setErrors(validation.errors);
		if (!validation.success) {
			showToast({
				type: "error",
				title: "Check the dispatch details",
				description: Object.values(validation.errors).find(Boolean) || "Some fields need attention.",
			});
			return false;
		}

		try {
			await dispatchMutation.mutateAsync({ crfId, input: validation.data });
			showToast({ type: "success", title: "Dispatch details saved" });
			await onRefresh();
			return true;
		} catch (error) {
			showToast({
				type: "error",
				title: "Couldn't save dispatch details",
				description: getErrorMessage(error, "Please try again."),
			});
			return false;
		}
	}, [crfId, dispatchMutation, onRefresh, showToast, values]);

	/* ------------------------------ Swap cart -------------------------------- */

	const [cart, setCart] = React.useState<CrfLineItem[]>([]);
	const [replacing, setReplacing] = React.useState(false);

	const startReplace = React.useCallback(() => {
		setCart(inStockLines);
		setReplacing(true);
	}, [inStockLines]);

	const cancelReplace = React.useCallback(() => setReplacing(false), []);

	const cartTotals = React.useMemo(() => getLineTotals(cart), [cart]);
	const cartValidation = React.useMemo(
		() => validateCrfForm({ epcId: crf?.epcId ?? "", lineItems: cart }),
		[cart, crf?.epcId],
	);
	const cap = crf?.souvenirTotalAtApproval ?? null;
	const overBudget = cap !== null && cartTotals.total > cap + 0.005;

	const swapMutation = useSwapSouvenirLinesMutation();

	const submitReplace = React.useCallback(async () => {
		if (!crfId) return;
		if (cart.length === 0) {
			showToast({ type: "error", title: "Add items", description: "Add at least one souvenir to order." });
			return;
		}
		if (overBudget) {
			showToast({
				type: "error",
				title: "Over the approved value",
				description: "Replacements can't cost more than the approved souvenir value.",
			});
			return;
		}
		if (!cartValidation.success) {
			showToast({ type: "error", title: "Check the items", description: "Some items exceed available stock." });
			return;
		}

		try {
			const items = cart
				.map((line) => buildCrfItemInput(line))
				.filter((input): input is { sku: string; requestedQty: number } => "sku" in input);
			await swapMutation.mutateAsync({ crfId, input: { items } });
			showToast({ type: "success", title: "Souvenirs updated" });
			setReplacing(false);
			await onRefresh();
		} catch (error) {
			showToast({
				type: "error",
				title: "Couldn't update souvenirs",
				description: getErrorMessage(error, "Please try again."),
			});
		}
	}, [cart, cartValidation.success, crfId, onRefresh, overBudget, showToast, swapMutation]);

	/* ------------------------------ Order actions ---------------------------- */

	const placeMutation = usePlaceCrfOrderMutation();
	const retryMutation = useRetryCrfOrderMutation();
	const cancelMutation = useCancelCrfOrderMutation();

	const submitPlaceOrder = React.useCallback(
		async (acceptPartial?: boolean) => {
			if (!crfId) return;
			try {
				const order = await placeMutation.mutateAsync({ crfId, input: { acceptPartial } });
				showToast({
					type: "success",
					title: "Order placed",
					description:
						order.debitNoteAmount != null
							? `Placed for the available items. A debit note of ₹${order.debitNoteAmount.toLocaleString("en-IN")} was raised for the shortfall.`
							: "The CRF order was sent to the store.",
				});
				await onRefresh();
			} catch (error) {
				showToast({
					type: "error",
					title: "Couldn't place the order",
					description: getErrorMessage(error, "Please try again."),
				});
			}
		},
		[crfId, onRefresh, placeMutation, showToast],
	);

	const submitRetry = React.useCallback(async () => {
		if (!crfId) return;
		try {
			await retryMutation.mutateAsync({ crfId });
			showToast({ type: "success", title: "Order placed" });
			await onRefresh();
		} catch (error) {
			showToast({
				type: "error",
				title: "Retry failed",
				description: getErrorMessage(error, "Please try again."),
			});
		}
	}, [crfId, onRefresh, retryMutation, showToast]);

	const submitCancel = React.useCallback(
		async (reason?: string) => {
			if (!crfId) return;
			try {
				await cancelMutation.mutateAsync({ crfId, input: { reason } });
				showToast({ type: "success", title: "Order cancelled" });
				await onRefresh();
			} catch (error) {
				showToast({
					type: "error",
					title: "Couldn't cancel the order",
					description: getErrorMessage(error, "Please try again."),
				});
			}
		},
		[cancelMutation, crfId, onRefresh, showToast],
	);

	/* --------------------------------- Step ---------------------------------- */

	const step: CrfOrderStep = replacing ? "replace" : status === "STOCK_SHORTFALL" ? "shortfall" : "dispatch";

	return {
		crf,
		status,
		permissions,
		order: crf?.order ?? null,

		souvenirLines,
		souvenirTotals,
		shortLines,
		shortTotals,
		inStockLines,
		loadingSouvenirDetails: backfillQuery.isLoading,

		step,
		values,
		errors,
		setField,
		submitDispatchDetails,
		savingDispatchDetails: dispatchMutation.isPending,

		cart,
		setCart,
		cartTotals,
		cartErrors: cartValidation.errors as CrfFormErrors,
		overBudget,
		startReplace,
		cancelReplace,
		submitReplace,
		swapping: swapMutation.isPending,

		submitPlaceOrder,
		placing: placeMutation.isPending,
		submitRetry,
		retrying: retryMutation.isPending,
		submitCancel,
		cancelling: cancelMutation.isPending,
	};
}

export type CrfOrderController = ReturnType<typeof useCrfOrder>;

// Re-exported so sub-components can key a line without importing core/schema directly.
export { getCrfLineKey };
