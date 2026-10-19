// crf/order/OrderForm.tsx
// Dispatch form: recipient + shipping address (PIN code included),
// matching DispatchDetailsInput (crfDispatchDetails.service.ts) field for
// field. Renders only the panels (a fragment): the surrounding grid — form
// column + "Souvenirs to order" summary — belongs to CrfOrderSection.
//
// `estimate` is the optional SIMULATED delivery estimate (test checkbox in
// CrfOrderSection). It only drives the "required by" warning here and is
// never part of any payload.

import FormInput from "../../../../components/forms/FormInput";
import { formatDeliveryDate } from "./OrderDeliveryCheck";
import {
	RECIPIENT_TYPES,
	RECIPIENT_TYPE_LABEL,
	type CrfDispatchFormField,
	type DeliveryEstimate,
} from "./types";
import type { CrfOrderController } from "./useCrfOrder";

const fieldId = (field: CrfDispatchFormField) => `crf-dispatch-${field}`;

const Field = ({
	order,
	field,
	label,
	required,
	...rest
}: {
	order: CrfOrderController;
	field: CrfDispatchFormField;
	label: string;
	required?: boolean;
} & Partial<{
	placeholder: string;
	type: string;
	inputMode: "numeric" | "tel" | "email" | "text";
	maxLength: number;
	className: string;
}>) => (
	<FormInput
		id={fieldId(field)}
		name={field}
		label={label}
		required={required}
		value={order.values[field]}
		error={order.errors[field]}
		isTooltip={false}
		onChange={(event) => order.setField(field, event.target.value)}
		{...rest}
	/>
);

type Props = {
	order: CrfOrderController;
	estimate?: DeliveryEstimate | null;
};

export default function CrfOrderForm({ order, estimate = null }: Props) {
	const { values, errors, setField } = order;

	// "Required by" earlier than the simulated estimate can't be met — warn, don't block.
	const etaDate = estimate?.estimatedDeliveryDate
		? new Date(estimate.estimatedDeliveryDate)
		: null;
	const requiredBy = values.requiredByDate
		? new Date(values.requiredByDate)
		: null;
	const requiredByTooSoon =
		etaDate !== null &&
		requiredBy !== null &&
		!Number.isNaN(etaDate.getTime()) &&
		!Number.isNaN(requiredBy.getTime()) &&
		requiredBy.getTime() < new Date(etaDate.toDateString()).getTime();
	const etaLabel = formatDeliveryDate(estimate?.estimatedDeliveryDate);

	return (
		<>
			<section className="crf-order-panel">
				<header className="crf-order-panel-header">
					<div>
						<h3 className="crf-order-panel-title">Recipient</h3>
						<p className="crf-order-panel-description">
							Who receives the souvenirs.
						</p>
					</div>
				</header>
				<fieldset className="crf-order-fieldset">
					<div className="form-field">
						<div className="form-label-row">
							<label htmlFor={fieldId("recipientType")} className="form-label">
								Who is this for?
								<span className="form-required" aria-hidden="true">
									*
								</span>
							</label>
						</div>
						<select
							id={fieldId("recipientType")}
							name="recipientType"
							className={[
								"form-input",
								errors.recipientType && "form-input-error",
							]
								.filter(Boolean)
								.join(" ")}
							value={values.recipientType}
							onChange={(event) =>
								setField(
									"recipientType",
									event.target.value as typeof values.recipientType,
								)
							}
						>
							{RECIPIENT_TYPES.map((value) => (
								<option key={value} value={value}>
									{RECIPIENT_TYPE_LABEL[value]}
								</option>
							))}
						</select>
						{errors.recipientType ? (
							<p className="form-error-text" role="alert">
								{errors.recipientType}
							</p>
						) : null}
					</div>

					<div className="crf-order-grid">
						<Field
							order={order}
							field="recipientName"
							label="Recipient name"
							required
						/>
						<Field
							order={order}
							field="recipientPhone"
							label="Phone"
							required
							inputMode="tel"
						/>
						<Field
							order={order}
							field="recipientEmail"
							label="Email"
							required
							type="email"
							inputMode="email"
						/>
						<Field
							order={order}
							field="recipientOrganisation"
							label="Organisation"
						/>

						{values.recipientType === "EMPLOYEE" ? (
							<Field
								order={order}
								field="recipientUserId"
								label="Employee user ID"
								required
								placeholder="User ID in MAP"
							/>
						) : null}
						{values.recipientType === "DEALER_CONTACT" ? (
							<Field
								order={order}
								field="recipientContactId"
								label="Dealer contact ID"
								required
								placeholder="Contact ID on the EPF's dealer"
							/>
						) : null}

						<Field
							order={order}
							field="requiredByDate"
							label="Required by"
							type="date"
						/>

						{requiredByTooSoon ? (
							<p className="crf-order-summary-note crf-order-summary-note--warn crf-order-span-2">
								The estimated delivery is {etaLabel}, which is after this date.
							</p>
						) : null}

						<div className="crf-order-span-2 form-field">
							<div className="form-label-row">
								<label
									htmlFor={fieldId("deliveryInstructions")}
									className="form-label"
								>
									Delivery instructions
								</label>
							</div>
							<textarea
								id={fieldId("deliveryInstructions")}
								name="deliveryInstructions"
								className="form-input crf-order-textarea"
								rows={2}
								maxLength={300}
								value={values.deliveryInstructions}
								onChange={(event) =>
									setField("deliveryInstructions", event.target.value)
								}
							/>
						</div>
					</div>
				</fieldset>
			</section>

			<section className="crf-order-panel">
				<header className="crf-order-panel-header">
					<div>
						<h3 className="crf-order-panel-title">Shipping address</h3>
						<p className="crf-order-panel-description">
							Where the souvenirs are delivered.
						</p>
					</div>
				</header>
				<fieldset className="crf-order-fieldset">
					<div className="crf-order-grid">
						<Field
							order={order}
							field="line1"
							label="House / building, street"
							required
							className="crf-order-span-2"
						/>
						<Field
							order={order}
							field="line2"
							label="Area / locality"
							className="crf-order-span-2"
						/>
						<Field order={order} field="landmark" label="Landmark" />
						<Field order={order} field="company" label="Company / dealership" />
						<Field order={order} field="city" label="City" required />
						<Field order={order} field="district" label="District" />
						<Field order={order} field="state" label="State" required />
						<FormInput
							id={fieldId("pincode")}
							name="pincode"
							label="PIN code"
							required
							value={values.pincode}
							error={errors.pincode}
							isTooltip={false}
							inputMode="numeric"
							maxLength={6}
							placeholder="6-digit PIN code"
							onChange={(event) =>
								setField(
									"pincode",
									event.target.value.replace(/\D/g, "").slice(0, 6),
								)
							}
						/>
						<Field
							order={order}
							field="gstin"
							label="GSTIN"
							placeholder="Optional, 15 characters"
							maxLength={15}
						/>
					</div>
				</fieldset>
			</section>
		</>
	);
}
