// handouts/HandoutDetailsFields.tsx
// THE handout form — one field set used everywhere:
//   • New request, step 1   → mode="edit"  (values + setField from useHandoutForm)
//   • New request, review   → mode="view"
//   • Request detail page   → mode="view"  (+ `meta`: who/when, from the server)
//
// Same convention as EpcFormFields: every field is a shared input with
// `mode`; DatePickerInput has no view mode, so in view it is swapped for a
// FormInput in view mode.

import DatePickerInput from "../../../components/common/DatePickerInput";
import FormInput from "../../../components/forms/FormInput";
import type { FormFieldMode } from "../../../components/forms/input.types";
import TextareaInput from "../../../components/forms/TextareaInput";

import { HANDOUT_LIMITS } from "./handouts.constants";
import {
	formatHandoutDate,
	fromDateInputValue,
	toDateInputValue,
} from "./handouts.format";
import type {
	HandoutDetailsErrors,
	HandoutDetailsField,
	HandoutDetailsValues,
} from "./handouts.schema";

/** Server-supplied context shown above the form in view mode only. */
export type HandoutFormMeta = {
	requestedBy: string;
	designation?: string | null;
	department?: string | null;
	requestedOn: string;
};

type Props = {
	values: Required<HandoutDetailsValues>;
	mode?: FormFieldMode;
	/** edit mode only */
	errors?: HandoutDetailsErrors;
	setField?: (name: HandoutDetailsField, value: string) => void;
	/** view mode only */
	meta?: HandoutFormMeta;
};

const NO_ERRORS: HandoutDetailsErrors = {};

export default function HandoutDetailsFields({
	values,
	mode = "edit",
	errors = NO_ERRORS,
	setField,
	meta,
}: Props) {
	const isView = mode === "view";
	const set = (name: HandoutDetailsField, value: string) =>
		setField?.(name, value);

	return (
		<div className="handout-form-grid">
			{isView && meta ? (
				<>
					<FormInput
						mode="view"
						name="requestedBy"
						label="Requested by"
						value={meta.requestedBy}
					/>
					<FormInput
						mode="view"
						name="designation"
						label="Designation"
						value={meta.designation ?? ""}
					/>
					<FormInput
						mode="view"
						name="department"
						label="Department"
						value={meta.department ?? ""}
					/>
					<FormInput
						mode="view"
						name="requestedOn"
						label="Requested on"
						value={formatHandoutDate(meta.requestedOn)}
					/>
				</>
			) : null}

			<div className="is-wide">
				<FormInput
					mode={mode}
					name="purpose"
					label="Purpose"
					required
					value={values.purpose}
					maxLength={HANDOUT_LIMITS.PURPOSE}
					placeholder="e.g. Visiting customer delegation"
					onChange={(event) => set("purpose", event.target.value)}
					error={errors.purpose}
				/>
			</div>

			{isView ? (
				<FormInput
					mode="view"
					name="requiredBy"
					label="Required by"
					value={formatHandoutDate(values.requiredBy)}
				/>
			) : (
				<DatePickerInput
					label="Required by"
					mode="single"
					value={fromDateInputValue(values.requiredBy)}
					onChange={(next) =>
						set(
							"requiredBy",
							next instanceof Date ? toDateInputValue(next) : "",
						)
					}
					placeholder="Select date"
					error={errors.requiredBy}
					disablePast
				/>
			)}

			<FormInput
				mode={mode}
				name="contactPhone"
				type="tel"
				inputMode="numeric"
				label="Contact number"
				required
				maxLength={10}
				value={values.contactPhone}
				placeholder="10-digit mobile number"
				onChange={(event) =>
					set(
						"contactPhone",
						event.target.value.replace(/\D/g, "").slice(0, 10),
					)
				}
				error={errors.contactPhone}
			/>

			<div className="is-wide">
				<FormInput
					mode={mode}
					name="deliverTo"
					label="Deliver to"
					required
					value={values.deliverTo}
					maxLength={HANDOUT_LIMITS.DELIVER_TO}
					placeholder="Block, floor, room / reception"
					onChange={(event) => set("deliverTo", event.target.value)}
					error={errors.deliverTo}
				/>
			</div>

			<div className="is-wide">
				<TextareaInput
					mode={mode}
					name="remarks"
					label="Remarks"
					rows={3}
					maxLength={HANDOUT_LIMITS.REMARKS}
					value={values.remarks}
					onChange={(event) => set("remarks", event.target.value)}
					error={errors.remarks}
				/>
			</div>
		</div>
	);
}
