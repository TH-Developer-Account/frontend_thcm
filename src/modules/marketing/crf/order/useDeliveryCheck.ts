// crf/order/useDeliveryCheck.ts
// Step 1 of the CRF order flow: enter the delivery PIN → get a delivery
// estimate → continue to the recipient + address step.
//
// Kept apart from useCrfOrder so that controller (and the shortfall / swap
// code in it) stays untouched. It only needs the dispatch form's values and
// setter, so the PIN typed here IS `values.pincode` — the same field the
// address form submits.
//
//   pin ──check──▶ estimate (serviceable?) ──continue──▶ details
//        ◀────────────── change ──────────────────────────┘

import React from "react";

import { useDeliveryEstimateQuery } from "./api";
import { DISPATCH_MESSAGES, PINCODE_PATTERN } from "./schema";
import type { CrfDispatchFormValues } from "./types";
import type { CrfOrderController } from "./useCrfOrder";

export type DeliveryStep = "pin" | "details";

type Params = {
	crfId: string | null;
	values: CrfDispatchFormValues;
	setField: CrfOrderController["setField"];
};

export function useDeliveryCheck({ crfId, values, setField }: Params) {
	const [step, setStep] = React.useState<DeliveryStep>("pin");
	/** The PIN the user last asked to check. */
	const [checkedPin, setCheckedPin] = React.useState<string | null>(null);
	const [pinError, setPinError] = React.useState<string | undefined>();

	const pin = values.pincode.trim();
	const query = useDeliveryEstimateQuery(crfId, checkedPin);

	// An estimate only counts while the box still holds the PIN it was for —
	// edit the PIN and the old result disappears until it's checked again.
	const isCurrent = checkedPin !== null && checkedPin === pin;
	const estimate = isCurrent ? (query.data ?? null) : null;
	const checking = isCurrent && query.isFetching;
	const failed = isCurrent && query.isError && !query.isFetching;

	const changePin = React.useCallback(
		(raw: string) => {
			setField("pincode", raw.replace(/\D/g, "").slice(0, 6));
			setPinError(undefined);
		},
		[setField],
	);

	const check = React.useCallback(() => {
		if (!pin) {
			setPinError(DISPATCH_MESSAGES.pincodeRequired);
			return;
		}
		if (!PINCODE_PATTERN.test(pin)) {
			setPinError(DISPATCH_MESSAGES.pincodeInvalid);
			return;
		}
		setPinError(undefined);

		// Same PIN again (e.g. after an error) → re-ask; a new PIN → new query.
		if (checkedPin === pin) void query.refetch();
		else setCheckedPin(pin);
	}, [checkedPin, pin, query]);

	const canContinue = Boolean(estimate?.serviceable);

	const proceed = React.useCallback(() => {
		if (!estimate?.serviceable) return;

		// Pre-fill what the PIN tells us — never overwrite what's typed.
		if (estimate.city && !values.city.trim()) setField("city", estimate.city);
		if (estimate.district && !values.district.trim()) {
			setField("district", estimate.district);
		}
		if (estimate.state && !values.state.trim())
			setField("state", estimate.state);

		setStep("details");
	}, [estimate, setField, values.city, values.district, values.state]);

	const change = React.useCallback(() => setStep("pin"), []);

	return {
		step,
		pin,
		pinError,
		changePin,
		check,
		checking,
		failed,
		estimate,
		canContinue,
		proceed,
		change,
	};
}

export type DeliveryCheckController = ReturnType<typeof useDeliveryCheck>;
