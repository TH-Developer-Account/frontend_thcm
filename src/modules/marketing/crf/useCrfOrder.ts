// crf/useCrfOrder.ts
// Controller for the CRF order section. Owns the form, the delivery
// estimate and the shortfall flow; the components only render it.
//
//   step "form"        PIN check → shipping / recipient / billing → Place order
//                         └─ live stock check
//                              ├─ all available → order created (tracking)
//                              └─ short         → step "shortfall"
//   step "shortfall"   (a) Order something else → step "replace"
//                      (b) Generate debit note  → step "debit-note"
//   step "replace"     souvenir listing again (cart = what's available),
//                      kept within the approved value → stock check → order
//   step "debit-note"  invoice-style note (PDF) → Confirm → order for the
//                      available quantities, note attached
//
// Nothing is reserved by a stock check, and THCM re-checks on Create Order —
// a 409 there brings the user back to the shortfall step with fresh numbers.

import React from "react";

import { useToast } from "../../../context/Auth/AuthContext";
import { CRF_SHOP_USE_MOCK } from "./crf.shop.api";
import {
	useCreateCrfOrderMutation,
	useCrfOrderQuery,
	useDeliveryEstimateMutation,
	useOrderStockCheckMutation,
} from "./crf.order.api";
import {
	buildCrfOrderPayload,
	buildDebitNote,
	buildStockOutcome,
	getAvailableLines,
	getCrfOrderPhase,
	getOrderLinesTotals,
	getStoreOrderLines,
} from "./crf.order.logic";
import { isMockShortfallEnabled, setMockShortfall } from "./crf.order.mock";
import {
	ORDER_FIELD_ORDER,
	PINCODE_PATTERN,
	getDefaultOrderFormValues,
	validateCrfOrderForm,
} from "./crf.order.schema";
import type {
	CrfOrderContext,
	CrfOrderFormErrors,
	CrfOrderFormField,
	CrfOrderFormValues,
	CrfOrderLine,
	DebitNote,
	DeliveryEstimate,
	ShortfallResolution,
	StockCheckOutcome,
} from "./crf.order.types";
import { validateCrfForm } from "./crf.schema";
import { withLocalStoreLines } from "./crf.store-lines";
import type { CrfLineItem } from "./crf.types";

export type CrfOrderStep = "form" | "shortfall" | "replace" | "debit-note";

/* ========================================================================== */
/*                          Cart ↔ order-line helpers                         */
/* ========================================================================== */

/** Order line → souvenir cart line (for the "order something else" listing). */
const toCartLine = (
	line: CrfOrderLine,
	availableQty: number | null,
): CrfLineItem => ({
	id: undefined,
	value: line.variantId ?? line.sku,
	label: line.title,
	particular: line.variantId ?? line.sku,
	description: line.variantTitle ?? "",
	partNumber: line.sku,
	category: "SOUVENIR",
	rate: line.unitPrice,
	quantity: line.quantity,
	total: line.unitPrice * line.quantity,
	sku: line.sku,
	variantId: line.variantId,
	shopifyProductId: line.shopifyProductId,
	variantTitle: line.variantTitle,
	options: {},
	imageUrl: line.imageUrl,
	compareAtPrice: line.compareAtPrice,
	gstRate: line.gstRate,
	availableQty,
	stockStatus: null,
});

const toOrderLine = (
	item: CrfLineItem,
	approvedKeys: Set<string>,
): CrfOrderLine => {
	const key = item.variantId ?? item.sku ?? item.value;
	return {
		key,
		sku: item.sku ?? "",
		variantId: item.variantId ?? null,
		shopifyProductId: item.shopifyProductId ?? null,
		title: item.label,
		variantTitle: item.variantTitle ?? null,
		imageUrl: item.imageUrl ?? null,
		quantity: Number(item.quantity) || 0,
		unitPrice: Number(item.rate) || 0,
		compareAtPrice: item.compareAtPrice ?? null,
		gstRate: item.gstRate ?? null,
		isReplacement: !approvedKeys.has(key),
	};
};

const getErrorMessage = (error: any, fallback: string) =>
	error?.response?.data?.message || error?.message || fallback;

/* ========================================================================== */
/*                                    Hook                                    */
/* ========================================================================== */

export function useCrfOrder(context: CrfOrderContext, canPlaceOrder: boolean) {
	const { showToast } = useToast();
	const crfId = context.crf?.id ?? null;
	const phase = getCrfOrderPhase(context.epcStatus);

	const orderQuery = useCrfOrderQuery(crfId);
	const estimateMutation = useDeliveryEstimateMutation();
	const stockMutation = useOrderStockCheckMutation();
	const createMutation = useCreateCrfOrderMutation();

	/* ------------------------------ CRF lines ------------------------------ */

	const {
		lines: approvedLines,
		nonStoreLines,
		missingSku,
	} = React.useMemo(
		() =>
			// TEMP: + souvenir lines kept in this browser (see crf.store-lines.ts)
			getStoreOrderLines(
				withLocalStoreLines(context.epcId, context.crf?.lineItems ?? []),
			),
		[context.crf, context.epcId],
	);
	const approvedKeys = React.useMemo(
		() => new Set(approvedLines.map((line) => line.key)),
		[approvedLines],
	);
	const approvedTotals = React.useMemo(
		() => getOrderLinesTotals(approvedLines),
		[approvedLines],
	);

	/* -------------------------------- Form --------------------------------- */

	const [values, setValues] = React.useState<CrfOrderFormValues>(() =>
		getDefaultOrderFormValues(context),
	);
	const [errors, setErrors] = React.useState<CrfOrderFormErrors>({});
	const [submitted, setSubmitted] = React.useState(false);
	const [estimate, setEstimate] = React.useState<DeliveryEstimate | null>(null);

	/** Values that passed validation (used by the later steps). */
	const validValuesRef = React.useRef<CrfOrderFormValues | null>(null);

	// After the first submit, errors re-check live as the user fixes them.
	React.useEffect(() => {
		if (!submitted) return;
		setErrors(validateCrfOrderForm(values, estimate).errors);
	}, [estimate, submitted, values]);

	const setField = React.useCallback(
		<K extends CrfOrderFormField>(field: K, value: CrfOrderFormValues[K]) => {
			setValues((previous) => ({ ...previous, [field]: value }));
		},
		[],
	);

	const checkPincode = React.useCallback(
		async (pincodeInput?: string) => {
			const pincode = (pincodeInput ?? values.pincode).trim();
			if (!PINCODE_PATTERN.test(pincode)) {
				setErrors((previous) => ({
					...previous,
					pincode: "Enter a valid 6-digit PIN code.",
				}));
				return;
			}

			try {
				const result = await estimateMutation.mutateAsync(pincode);
				setEstimate(result);
				setErrors((previous) => ({
					...previous,
					pincode: result.serviceable
						? undefined
						: (result.message ?? "The store doesn't deliver to this PIN code."),
				}));
				if (result.serviceable) {
					// Fill the place from the PIN; keep a city the user already picked if it's valid.
					setValues((previous) => ({
						...previous,
						pincode,
						state: result.stateName ?? previous.state,
						city:
							result.cities.find(
								(c) => c.toLowerCase() === previous.city.trim().toLowerCase(),
							) ??
							(result.cities.length === 1
								? result.cities[0]
								: result.cities.length
									? ""
									: previous.city),
					}));
				}
			} catch (error) {
				console.error("Delivery estimate failed:", error);
				showToast({
					type: "error",
					title: "Couldn't check delivery",
					description: getErrorMessage(error, "Please try again."),
				});
			}
		},
		[estimateMutation, showToast, values.pincode],
	);

	// Changing the PIN invalidates the earlier estimate.
	const setPincode = React.useCallback((pincode: string) => {
		const cleaned = pincode.replace(/\D/g, "").slice(0, 6);
		setValues((previous) => ({ ...previous, pincode: cleaned }));
		setEstimate((previous) =>
			previous && previous.pincode !== cleaned ? null : previous,
		);
	}, []);

	/* -------------------------------- Steps -------------------------------- */

	const [step, setStep] = React.useState<CrfOrderStep>("form");
	const [outcome, setOutcome] = React.useState<StockCheckOutcome | null>(null);
	/** The FIRST shortfall (against the approved CRF) — what the debit note / replacement resolves. */
	const [originalOutcome, setOriginalOutcome] =
		React.useState<StockCheckOutcome | null>(null);
	const [cart, setCart] = React.useState<CrfLineItem[]>([]);
	const [debitNote, setDebitNote] = React.useState<DebitNote | null>(null);
	const [attempt, setAttempt] = React.useState(1);
	const [simulateShortfall, setSimulateShortfallState] = React.useState(
		isMockShortfallEnabled,
	);

	const setSimulateShortfall = React.useCallback((enabled: boolean) => {
		setMockShortfall(enabled);
		setSimulateShortfallState(enabled);
	}, []);

	/* ------------------------------ Place order ---------------------------- */

	const placeOrder = React.useCallback(
		async (lines: CrfOrderLine[], shortfall: ShortfallResolution) => {
			const formValues = validValuesRef.current;
			if (!formValues || !estimate || !crfId) return;

			const payload = buildCrfOrderPayload({
				context,
				values: formValues,
				estimate,
				lines,
				nonStoreLines,
				shortfall,
				attempt,
			});

			try {
				await createMutation.mutateAsync({
					payload,
					placedBy: {
						name: context.requester.name,
						email: context.requester.email,
					},
				});
				showToast({
					type: "success",
					title: "Order placed",
					description:
						"The CRF order was sent to the store. You can track it here.",
				});
				setStep("form");
			} catch (error: any) {
				const code = error?.response?.data?.code;
				console.error("CRF order failed:", error);

				// Stock moved between our check and THCM's — show fresh numbers.
				if (code === "THCM_STOCK_CONFLICT" || code === "THCM_STOCK_RACE") {
					setAttempt((n) => n + 1);
					try {
						const result = await stockMutation.mutateAsync(
							lines.map((line) => ({ sku: line.sku, quantity: line.quantity })),
						);
						const fresh = buildStockOutcome(lines, result, approvedLines);
						setOutcome(fresh);
						setOriginalOutcome((previous) => previous ?? fresh);
						setStep("shortfall");
					} catch {
						/* toast below */
					}
					showToast({
						type: "error",
						title: "Stock changed",
						description:
							"The store's stock changed while placing the order. Review the shortfall and try again.",
					});
					return;
				}

				showToast({
					type: "error",
					title: "Couldn't place the order",
					description: getErrorMessage(error, "Please try again."),
				});
			}
		},
		[
			approvedLines,
			attempt,
			context,
			createMutation,
			crfId,
			estimate,
			nonStoreLines,
			showToast,
			stockMutation,
		],
	);

	/** Live stock check → order, or the shortfall step. */
	const checkAndOrder = React.useCallback(
		async (lines: CrfOrderLine[], resolution: ShortfallResolution) => {
			let result;
			try {
				result = await stockMutation.mutateAsync(
					lines.map((line) => ({ sku: line.sku, quantity: line.quantity })),
				);
			} catch (error) {
				showToast({
					type: "error",
					title: "Couldn't check stock",
					description: getErrorMessage(
						error,
						"The store couldn't be reached. Please try again.",
					),
				});
				return;
			}

			const next = buildStockOutcome(lines, result, approvedLines);
			if (next.allAvailable) {
				await placeOrder(lines, resolution);
				return;
			}

			setOutcome(next);
			setOriginalOutcome((previous) => previous ?? next);
			setStep("shortfall");
		},
		[approvedLines, placeOrder, showToast, stockMutation],
	);

	/* ------------------------------ Actions -------------------------------- */

	const submitForm = React.useCallback(async () => {
		setSubmitted(true);
		const validation = validateCrfOrderForm(values, estimate);
		setErrors(validation.errors);

		if (!validation.success) {
			const first = ORDER_FIELD_ORDER.find((field) => validation.errors[field]);
			if (first) document.getElementById(`crf-order-${first}`)?.focus();
			showToast({
				type: "error",
				title: "Check the delivery details",
				description:
					(first && validation.errors[first]) || "Some fields need attention.",
			});
			return;
		}

		if (approvedLines.length === 0) return;

		validValuesRef.current = validation.data;
		setOriginalOutcome(null);
		await checkAndOrder(approvedLines, { type: "NONE" });
	}, [approvedLines, checkAndOrder, estimate, showToast, values]);

	/** (a) Order something else: listing again, cart = what the store has. */
	const chooseReplace = React.useCallback(() => {
		if (!outcome) return;
		const availableByKey = new Map(
			outcome.lines.map((l) => [l.key, l.availableQty]),
		);
		setCart(
			getAvailableLines(outcome).map((line) =>
				toCartLine(line, availableByKey.get(line.key) ?? null),
			),
		);
		setStep("replace");
	}, [outcome]);

	/** (b) Debit note for the shortfall value. */
	const chooseDebitNote = React.useCallback(() => {
		if (!outcome) return;
		setDebitNote(buildDebitNote({ context, outcome }));
		setStep("debit-note");
	}, [context, outcome]);

	/* Replacement cart */

	const cartLines = React.useMemo(
		() =>
			cart
				.filter((item) => Number(item.quantity) > 0)
				.map((item) => toOrderLine(item, approvedKeys)),
		[approvedKeys, cart],
	);
	const cartTotals = React.useMemo(
		() => getOrderLinesTotals(cartLines),
		[cartLines],
	);
	const cartValidation = React.useMemo(
		() => validateCrfForm({ epcId: context.epcId, lineItems: cart }),
		[cart, context.epcId],
	);
	const overBudget = cartTotals.total > approvedTotals.total + 0.005;

	const submitReplacement = React.useCallback(async () => {
		if (cartLines.length === 0) {
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
				title: "Over the approved value",
				description:
					"Replacements can't cost more than the approved souvenir value. Remove or reduce items.",
			});
			return;
		}
		if (!cartValidation.success) {
			showToast({
				type: "error",
				title: "Check the items",
				description: "Some items exceed the available stock.",
			});
			return;
		}
		const base = originalOutcome ?? outcome;
		await checkAndOrder(cartLines, {
			type: "REPLACED",
			shortLines: base?.shortLines ?? [],
		});
	}, [
		cartLines,
		cartValidation.success,
		checkAndOrder,
		originalOutcome,
		outcome,
		overBudget,
		showToast,
	]);

	/* Debit note */

	/** What still gets ordered with a debit note: the available quantities. */
	const debitNoteLines = React.useMemo(
		() => (outcome ? getAvailableLines(outcome) : []),
		[outcome],
	);

	const confirmDebitNote = React.useCallback(async () => {
		if (!debitNote || !outcome) return;
		if (debitNoteLines.length === 0) {
			showToast({
				type: "error",
				title: "Nothing left to order",
				description:
					"None of the approved souvenirs are in stock. Choose “Order something else” instead.",
			});
			return;
		}
		await checkAndOrder(debitNoteLines, {
			type: "DEBIT_NOTE",
			shortLines: outcome.shortLines,
			debitNote,
		});
	}, [checkAndOrder, debitNote, debitNoteLines, outcome, showToast]);

	const backToForm = React.useCallback(() => {
		setStep("form");
		setOutcome(null);
		setOriginalOutcome(null);
		setDebitNote(null);
	}, []);

	const backToShortfall = React.useCallback(() => setStep("shortfall"), []);

	/* -------------------------------- Result ------------------------------- */

	const order = orderQuery.data ?? null;

	return {
		phase,
		canPlaceOrder: canPlaceOrder && phase === "OPEN" && !order,
		isMock: CRF_SHOP_USE_MOCK,

		/* order */
		order,
		orderQuery,

		/* lines */
		approvedLines,
		approvedTotals,
		nonStoreLines,
		missingSku,

		/* form */
		values,
		errors,
		setField,
		setPincode,
		estimate,
		checkPincode,
		checkingPincode: estimateMutation.isPending,
		submitForm,

		/* steps */
		step,
		/** Latest stock check that came back short. */
		outcome,
		/** First shortfall against the approved CRF (for reference). */
		originalOutcome,
		chooseReplace,
		chooseDebitNote,
		backToForm,
		backToShortfall,

		/* replace */
		cart,
		setCart,
		cartLines,
		cartTotals,
		cartErrors: cartValidation.errors,
		overBudget,
		submitReplacement,

		/* debit note */
		debitNote,
		debitNoteLines,
		confirmDebitNote,

		/* busy */
		checkingStock: stockMutation.isPending,
		placing: createMutation.isPending,
		busy: stockMutation.isPending || createMutation.isPending,

		/* dev */
		simulateShortfall,
		setSimulateShortfall,
	};
}

export type CrfOrderController = ReturnType<typeof useCrfOrder>;
