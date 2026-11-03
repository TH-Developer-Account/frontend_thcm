// handouts/HandoutDeliveryPanel.tsx
// Delivery team's part of the request:
//   • Check items   : tick every item once physically verified
//   • Hand-over     : who received it, and when
// The OUTCOME is chosen in the side-panel decision card (HandoutDetailPage):
//   "Request fulfilled"          → useHandoutDelivery().submit(reason)
//   "Request can't be fulfilled" → cannot-fulfil API
// Both need a reason, so the delivery team is accountable either way. The
// fulfilled reason is saved as the delivery note.
//
// State lives in useHandoutDelivery so the page (decision card) and this panel
// share it. "Delivered on" is the shared DatePickerInput; the form value is the
// same "YYYY-MM-DDTHH:mm" string (the picker edits the date, the time stays
// what it was — now, by default), so handoutDeliverySchema is unchanged.

import { useMemo, useState } from "react";

import Card from "../../../components/common/Card";
import DatePickerInput from "../../../components/common/DatePickerInput";
import FormInput from "../../../components/forms/FormInput";
import { useToast } from "../../../context/Auth/AuthContext";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../utils/apiError.helper";
import type { ShopStockCheckResult } from "../crf";

import { useDeliverHandoutMutation } from "./handouts.api";
import { fromDateInputValue, toDateInputValue } from "./handouts.format";
import {
	HANDOUT_MESSAGES,
	handoutDeliverySchema,
	nowInputValue,
	parseWithFieldErrors,
	type HandoutDeliveryErrors,
} from "./handouts.schema";
import type { HandoutDetail } from "./handouts.types";
import HandoutItemsTable from "./HandoutItemsTable";

/* ========================================================================== */
/*                                    State                                   */
/* ========================================================================== */

export function useHandoutDelivery(
	handout: HandoutDetail | undefined,
	onDelivered: () => void | Promise<void>,
) {
	const { showToast } = useToast();
	const deliver = useDeliverHandoutMutation();

	const [checked, setChecked] = useState<Set<string>>(new Set());
	const [handedToName, setHandedToName] = useState("");
	const [deliveredOn, setDeliveredOn] = useState(nowInputValue);
	const [errors, setErrors] = useState<HandoutDeliveryErrors>({});

	const allSkus = useMemo(
		() => [...new Set((handout?.items ?? []).map((item) => item.sku))],
		[handout?.items],
	);
	const allChecked =
		allSkus.length > 0 && allSkus.every((sku) => checked.has(sku));

	const toggle = (sku: string, value: boolean) => {
		setChecked((previous) => {
			const next = new Set(previous);
			if (value) next.add(sku);
			else next.delete(sku);
			return next;
		});
		setErrors((previous) => ({ ...previous, checked: undefined }));
	};

	const changeHandedTo = (value: string) => {
		setHandedToName(value);
		setErrors((previous) => ({ ...previous, handedToName: undefined }));
	};

	// Picker ⇄ "YYYY-MM-DDTHH:mm": swap only the date part, keep the time.
	const changeDeliveredDate = (next: unknown) => {
		const date = next instanceof Date ? toDateInputValue(next) : "";
		const time = deliveredOn.slice(11) || nowInputValue().slice(11);
		setDeliveredOn(date ? `${date}T${time}` : "");
		setErrors((previous) => ({ ...previous, deliveredOn: undefined }));
	};

	/** "Request fulfilled": `reason` is saved as the delivery note. */
	const submit = async (reason: string) => {
		if (!handout) return;

		const parsed = parseWithFieldErrors(handoutDeliverySchema, {
			handedToName,
			deliveredOn,
			note: reason,
		});
		const nextErrors: HandoutDeliveryErrors = parsed.success
			? {}
			: (parsed.errors as HandoutDeliveryErrors);
		if (!allChecked) nextErrors.checked = HANDOUT_MESSAGES.itemsNotChecked;

		setErrors(nextErrors);
		if (!parsed.success || !allChecked) return;

		try {
			await deliver.mutateAsync({
				id: handout.id,
				payload: {
					handedToName: parsed.data.handedToName,
					deliveredOn: new Date(parsed.data.deliveredOn).toISOString(),
					note: parsed.data.note || undefined,
					checkedSkus: allSkus,
				},
			});
			showSuccessToast(
				showToast,
				`${handout.requestNumber} was marked fulfilled and closed.`,
				"Request fulfilled",
			);
			await onDelivered();
		} catch (error) {
			showApiErrorToast(
				showToast,
				error,
				"The request could not be closed.",
				"Unable to close request",
			);
		}
	};

	return {
		checked,
		allChecked,
		toggle,
		handedToName,
		changeHandedTo,
		deliveredOn,
		changeDeliveredDate,
		errors,
		submit,
		isSubmitting: deliver.isPending,
		/** Enough is filled in to pick "Request fulfilled". */
		canFulfil: allChecked && Boolean(handedToName.trim()),
	};
}

export type HandoutDelivery = ReturnType<typeof useHandoutDelivery>;

/* ========================================================================== */
/*                                    View                                    */
/* ========================================================================== */

type Props = {
	handout: HandoutDetail;
	delivery: HandoutDelivery;
	stock?: ShopStockCheckResult;
	stockLoading?: boolean;
};

export default function HandoutDeliveryPanel({
	handout,
	delivery,
	stock,
	stockLoading,
}: Props) {
	const { errors } = delivery;

	return (
		<>
			<Card
				padding="none"
				title="Check items"
				footer={
					errors.checked ? (
						<p className="form-error-text" role="alert">
							{errors.checked}
						</p>
					) : (
						<p className="handout-note">
							Tick each item once it has been physically verified.
						</p>
					)
				}
			>
				<HandoutItemsTable
					items={handout.items}
					stock={stock}
					stockLoading={stockLoading}
					check={{
						checkedSkus: delivery.checked,
						onToggle: delivery.toggle,
						disabled: delivery.isSubmitting,
					}}
				/>
			</Card>

			<Card
				padding="compact"
				title="Hand over"
				footer={
					<p className="handout-note">
						Then choose “Request fulfilled” or “Request can't be fulfilled” in
						the side panel. A reason is required for both, and fulfilling closes
						the request.
					</p>
				}
			>
				<div className="handout-form-grid">
					<FormInput
						name="handedToName"
						label="Handed to (name)"
						required
						value={delivery.handedToName}
						placeholder="Person who received the items"
						onChange={(event) => delivery.changeHandedTo(event.target.value)}
						error={errors.handedToName}
					/>
					<DatePickerInput
						label="Delivered on"
						mode="single"
						value={fromDateInputValue(delivery.deliveredOn)}
						onChange={delivery.changeDeliveredDate}
						placeholder="Select date"
						helperText="Defaults to today, editable"
						error={errors.deliveredOn}
						toDate={new Date()}
					/>
				</div>
			</Card>
		</>
	);
}
