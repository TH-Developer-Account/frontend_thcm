// handouts/HandoutDetailsFields.tsx
// THE handout form — one field set used everywhere:
//   • New request, step 1   → mode="edit"  (values + setField from useHandoutForm)
//   • New request, review   → mode="view"
//   • Request detail page   → mode="view"  (+ `meta`: who/when, from the server)
//   • Resubmit (same wizard, prefilled)  → mode="edit"
//
// Same convention as EpcFormFields: every field is a shared input with
// `mode`; DatePickerInput has no view mode, so in view it is swapped for a
// FormInput in view mode. Fulfillment type + shipping address follow the
// same pattern: Radio has no view mode either, so view shows the resolved
// label as a plain FormInput, and the address block is shown (edit or view)
// only when fulfillmentType is "SHIPPED".

import DatePickerInput from "../../../components/common/DatePickerInput";
import FormInput from "../../../components/forms/FormInput";
import type { FormFieldMode } from "../../../components/forms/input.types";
import Radio from "../../../components/forms/Radio";
import TextareaInput from "../../../components/forms/TextareaInput";

import {
  HANDOUT_FULFILLMENT_TYPE_LABEL,
  HANDOUT_FULFILLMENT_TYPE_OPTIONS,
  HANDOUT_LIMITS,
} from "./handouts.constants";
import {
  formatHandoutDate,
  fromDateInputValue,
  toDateInputValue,
} from "./handouts.format";
import type {
  HandoutDetailsErrors,
  HandoutDetailsField,
  HandoutDetailsValues,
  HandoutShippingAddressField,
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
  /** edit mode only — updates one field of values.shippingAddress */
  setAddressField?: (name: HandoutShippingAddressField, value: string) => void;
  /** view mode only */
  meta?: HandoutFormMeta;
};

const NO_ERRORS: HandoutDetailsErrors = {};

export default function HandoutDetailsFields({
  values,
  mode = "edit",
  errors = NO_ERRORS,
  setField,
  setAddressField,
  meta,
}: Props) {
  const isView = mode === "view";
  const isShipped = values.fulfillmentType === "SHIPPED";
  const set = (name: HandoutDetailsField, value: string) =>
    setField?.(name, value);
  const setAddress = (name: HandoutShippingAddressField, value: string) =>
    setAddressField?.(name, value);
  const addressError = (name: HandoutShippingAddressField) =>
    errors[`shippingAddress.${name}`];

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
        {isView ? (
          <FormInput
            mode="view"
            name="fulfillmentType"
            label="Fulfillment"
            value={HANDOUT_FULFILLMENT_TYPE_LABEL[values.fulfillmentType]}
          />
        ) : (
          <Radio
            groupLabel="Fulfillment"
            required
            name="fulfillmentType"
            options={HANDOUT_FULFILLMENT_TYPE_OPTIONS}
            selectedValue={values.fulfillmentType}
            onChange={(value) => set("fulfillmentType", value)}
            error={errors.fulfillmentType}
          />
        )}
      </div>

      {/* Shipping address — only shown (edit or view) once SHIPPED is chosen. */}
      {isShipped ? (
        <>
          <div className="is-wide">
            <FormInput
              mode={mode}
              name="addressLine1"
              label="Address line 1"
              required
              value={values.shippingAddress.line1}
              placeholder="House / building, street"
              onChange={(event) => setAddress("line1", event.target.value)}
              error={addressError("line1")}
            />
          </div>
          <div className="is-wide">
            <FormInput
              mode={mode}
              name="addressLine2"
              label="Address line 2"
              value={values.shippingAddress.line2 ?? ""}
              placeholder="Area / locality"
              onChange={(event) => setAddress("line2", event.target.value)}
              error={addressError("line2")}
            />
          </div>
          <FormInput
            mode={mode}
            name="addressLandmark"
            label="Landmark"
            value={values.shippingAddress.landmark ?? ""}
            onChange={(event) => setAddress("landmark", event.target.value)}
            error={addressError("landmark")}
          />
          <FormInput
            mode={mode}
            name="addressCity"
            label="City"
            required
            value={values.shippingAddress.city}
            onChange={(event) => setAddress("city", event.target.value)}
            error={addressError("city")}
          />
          <FormInput
            mode={mode}
            name="addressDistrict"
            label="District"
            value={values.shippingAddress.district ?? ""}
            onChange={(event) => setAddress("district", event.target.value)}
            error={addressError("district")}
          />
          <FormInput
            mode={mode}
            name="addressState"
            label="State"
            required
            value={values.shippingAddress.state}
            onChange={(event) => setAddress("state", event.target.value)}
            error={addressError("state")}
          />
          <FormInput
            mode={mode}
            name="addressPincode"
            label="PIN code"
            required
            inputMode="numeric"
            maxLength={6}
            value={values.shippingAddress.pincode}
            placeholder="6-digit PIN code"
            onChange={(event) =>
              setAddress(
                "pincode",
                event.target.value.replace(/\D/g, "").slice(0, 6),
              )
            }
            error={addressError("pincode")}
          />
          <FormInput
            mode={mode}
            name="addressGstin"
            label="GSTIN"
            value={values.shippingAddress.gstin ?? ""}
            placeholder="Optional, 15 characters"
            maxLength={15}
            onChange={(event) => setAddress("gstin", event.target.value)}
            error={addressError("gstin")}
          />
        </>
      ) : null}

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
