// crf/order/useCrfOrder.ts
// Controller for the CRF order section. Owns the dispatch-details form and
// the souvenir swap cart; CrfOrderSection / its sub-components only render
// what this returns.
//
//   APPROVED          → dispatch details → Place order
//   STOCK_SHORTFALL   → dispatch details → (a) swap souvenir lines (cart,
//                        capped at crf.shortfallAmount — the frozen value of
//                        the CURRENT out-of-stock lines, not the approval-time
//                        total; see core/types.ts's CrfDetail doc comment) or
//                        (b) place the order anyway (acceptPartial: true —
//                        backend raises a debit note for the shortfall value)
//   STOCK_CHECK_FAILED → the post-approval Shopify stock check itself
//                        couldn't reach the store (THCM Shop down) — no
//                        dispatch form involved, just a retry of the check
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
import {
  backfillSouvenirDisplayFields,
  buildCrfItemInput,
} from "../core/mapper";
import {
  usePlaceCrfOrderMutation,
  useRetryCrfOrderMutation,
  useCancelCrfOrderMutation,
  useRetryStockCheckMutation,
  useSwapSouvenirLinesMutation,
  useUpdateDispatchDetailsMutation,
} from "./api";
import { getLineTotals, getSouvenirFormLines } from "./logic";
import { getDefaultDispatchFormValues, validateDispatchForm } from "./schema";
import type {
  CrfDispatchFormErrors,
  CrfDispatchFormField,
  CrfDispatchFormValues,
} from "./types";
import { useSouvenirStockBySkusQuery } from "../shop/api";
import {
  getCrfLineKey,
  validateCrfForm,
  type CrfFormErrors,
} from "../core/schema";
import type {
  CrfDetail,
  CrfLineItem,
  CrfShopifyItem,
  CrfShopifyItemInput,
} from "../core/types";

export type CrfOrderStep = "dispatch" | "shortfall" | "replace";

const getErrorMessage = (error: unknown, fallback: string) => {
  const response = (
    error as { response?: { data?: { message?: string } } } | undefined
  )?.response;
  const message =
    response?.data?.message ??
    (error as { message?: string } | undefined)?.message;
  return message || fallback;
};

/** sku → total requestedQty, across whichever line list is passed in. */
const sumQtyBySku = (lines: CrfLineItem[]): Map<string, number> => {
  const map = new Map<string, number>();
  for (const line of lines) {
    if (!line.sku) continue;
    map.set(line.sku, (map.get(line.sku) ?? 0) + (Number(line.quantity) || 0));
  }
  return map;
};

export function useCrfOrder(
  crf: CrfDetail | null,
  onRefresh: () => void | Promise<void>,
) {
  const { showToast } = useToast();
  const crfId = crf?.id ?? null;
  const status = crf?.status ?? null;
  const permissions = crf?.permissions ?? null;

  /* ------------------------------ Souvenir lines -------------------------- */

  const shopifyItems = React.useMemo(
    () =>
      (crf?.items ?? []).filter(
        (item): item is CrfShopifyItem => item.source === "SHOPIFY",
      ),
    [crf],
  );
  const souvenirSkus = React.useMemo(
    () => shopifyItems.map((item) => item.sku),
    [shopifyItems],
  );

  const backfillQuery = useSouvenirStockBySkusQuery(
    souvenirSkus,
    souvenirSkus.length > 0,
  );

  const bareSouvenirLines = React.useMemo(
    () => getSouvenirFormLines(crf),
    [crf],
  );
  const souvenirLines = React.useMemo(
    () =>
      backfillQuery.data
        ? backfillSouvenirDisplayFields(
            bareSouvenirLines,
            backfillQuery.data.data,
          )
        : bareSouvenirLines,
    [backfillQuery.data, bareSouvenirLines],
  );
  const souvenirTotals = React.useMemo(
    () => getLineTotals(souvenirLines),
    [souvenirLines],
  );

  /** sku → requestedQty/status, straight off the saved CRF items (no re-check). */
  const shortLines = React.useMemo(() => {
    const shortSkus = new Set(
      shopifyItems
        .filter((item) => item.status === "OUT_OF_STOCK")
        .map((item) => item.sku),
    );
    return souvenirLines.filter((line) => line.sku && shortSkus.has(line.sku));
  }, [shopifyItems, souvenirLines]);
  const shortTotals = React.useMemo(
    () => getLineTotals(shortLines),
    [shortLines],
  );
  const inStockLines = React.useMemo(
    () => souvenirLines.filter((line) => !shortLines.includes(line)),
    [shortLines, souvenirLines],
  );

  /* ------------------------------ Dispatch form --------------------------- */

  const [values, setValues] = React.useState<CrfDispatchFormValues>(() =>
    getDefaultDispatchFormValues(),
  );
  const [errors, setErrors] = React.useState<CrfDispatchFormErrors>({});

  const setField = React.useCallback(
    <K extends CrfDispatchFormField>(
      field: K,
      value: CrfDispatchFormValues[K],
    ) => {
      setValues((previous) => ({ ...previous, [field]: value }));
      setErrors((previous) =>
        previous[field] ? { ...previous, [field]: undefined } : previous,
      );
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
        description:
          Object.values(validation.errors).find(Boolean) ||
          "Some fields need attention.",
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

  // Snapshotted at the moment "Order something else" is opened — the
  // baseline that re-adding the same kept quantity back costs nothing
  // against. Mirrors swapSouvenirLines' own priorKeptQtyBySku snapshot on
  // the backend, so the frontend's budget math matches what the server
  // will actually charge instead of re-deriving its own notion of "kept".
  const [keptSkuQty, setKeptSkuQty] = React.useState<Map<string, number>>(
    new Map(),
  );

  const startReplace = React.useCallback(() => {
    setKeptSkuQty(sumQtyBySku(inStockLines));
    setCart(inStockLines);
    setReplacing(true);
  }, [inStockLines]);

  const cancelReplace = React.useCallback(() => setReplacing(false), []);

  const cartTotals = React.useMemo(() => getLineTotals(cart), [cart]);

  // The actual swap budget cap: the frozen value of the CURRENT shortfall
  // (crf.shortfallAmount), not the approval-time souvenirTotalAtApproval —
  // see core/types.ts's CrfDetail doc comment for why that one drifts.
  const cap = crf?.shortfallAmount ?? null;

  // What this swap would actually cost against the budget: only the
  // quantity ABOVE what was already kept, at each SKU's current price —
  // matching swapSouvenirLines' own newSpend calculation on the backend
  // exactly, so a cart that passes this check never gets rejected there.
  const cartNewSpend = React.useMemo(() => {
    const cartQtyBySku = sumQtyBySku(cart);
    const priceBySku = new Map(
      cart
        .filter((line) => line.sku)
        .map((line) => [line.sku as string, Number(line.rate) || 0]),
    );
    let total = 0;
    for (const [sku, qty] of cartQtyBySku) {
      const extraQty = Math.max(0, qty - (keptSkuQty.get(sku) ?? 0));
      total += extraQty * (priceBySku.get(sku) ?? 0);
    }
    return Math.round((total + Number.EPSILON) * 100) / 100;
  }, [cart, keptSkuQty]);

  const cartValidation = React.useMemo(
    () => validateCrfForm({ epcId: crf?.epcId ?? "", lineItems: cart }),
    [cart, crf?.epcId],
  );

  const overBudget = cap !== null && cartNewSpend > Number(cap) + 0.005;

  const swapMutation = useSwapSouvenirLinesMutation();

  const submitReplace = React.useCallback(async () => {
    if (!crfId) return;
    if (cart.length === 0) {
      showToast({
        type: "error",
        title: "Add items",
        description: "Add at least one souvenir to order.",
      });
      return;
    }

    if (overBudget) {
      showToast({
        type: "error",
        title: "Over the shortfall budget",
        description:
          "The new items added can't cost more than the shortfall being replaced.",
      });
      return;
    }
    if (!cartValidation.success) {
      showToast({
        type: "error",
        title: "Check the items",
        description: "Some items exceed available stock.",
      });
      return;
    }

    try {
      // Narrow to the full CrfShopifyItemInput shape (sku + requestedQty +
      // amount/rate/title/variantTitle/imageUrl), not just { sku,
      // requestedQty } — the backend's buildShopifyItemRows requires
      // amount/rate on every souvenir line and 400s without them.
      const items = cart
        .map((line) => buildCrfItemInput(line))
        .filter((input): input is CrfShopifyItemInput => "sku" in input);
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
  }, [
    cart,
    cartValidation.success,
    crfId,
    onRefresh,
    overBudget,
    showToast,
    swapMutation,
  ]);

  /* ------------------------------ Order actions ---------------------------- */

  const placeMutation = usePlaceCrfOrderMutation();
  const retryMutation = useRetryCrfOrderMutation();
  const cancelMutation = useCancelCrfOrderMutation();
  const retryStockCheckMutation = useRetryStockCheckMutation();

  const submitPlaceOrder = React.useCallback(
    async (acceptPartial?: boolean) => {
      if (!crfId) return;
      try {
        const order = await placeMutation.mutateAsync({
          crfId,
          input: { acceptPartial },
        });
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

  /**
   * Retries the stock check itself (STOCK_CHECK_FAILED) — a different
   * action from submitRetry (which retries PLACING an already-confirmed
   * order, ORDER_FAILED). Nothing to validate first: unlike order
   * placement, the stock check doesn't depend on dispatch details, so
   * this never runs submitDispatchDetails beforehand.
   */
  const submitRetryStockCheck = React.useCallback(async () => {
    if (!crfId) return;
    try {
      await retryStockCheckMutation.mutateAsync({ crfId });
      showToast({ type: "success", title: "Stock check passed" });
      await onRefresh();
    } catch (error) {
      showToast({
        type: "error",
        title: "Stock check failed again",
        description: getErrorMessage(
          error,
          "The souvenir store may still be unreachable.",
        ),
      });
    }
  }, [crfId, onRefresh, retryStockCheckMutation, showToast]);

  /* --------------------------------- Step ---------------------------------- */

  const step: CrfOrderStep = replacing
    ? "replace"
    : status === "STOCK_SHORTFALL"
      ? "shortfall"
      : "dispatch";

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
    cartNewSpend,
    shortfallBudget: cap,
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
    submitRetryStockCheck,
    retryingStockCheck: retryStockCheckMutation.isPending,
  };
}

export type CrfOrderController = ReturnType<typeof useCrfOrder>;

// Re-exported so sub-components can key a line without importing core/schema directly.
export { getCrfLineKey };
