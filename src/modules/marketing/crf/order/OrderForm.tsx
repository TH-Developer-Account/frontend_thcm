// crf/order/OrderForm.tsx
// The dispatch flow in two steps:
//
//   1. Delivery PIN        → OrderDeliveryCheck (estimate, serviceability)
//   2. Recipient + address → this file's panels, matching DispatchDetailsInput
//                            (crfDispatchDetails.service.ts) field for field
//
// Renders only the panels (a fragment): the surrounding grid — form column +
// "Souvenirs to order" summary — belongs to CrfOrderSection. (This used to
// render its own `crf-order-layout` inside that grid, which is what squeezed
// the form into half the width with an empty column beside it.)

import { Check, MapPin } from "lucide-react";

import FormInput from "../../../../components/forms/FormInput";
import {
	RECIPIENT_TYPES,
	RECIPIENT_TYPE_LABEL,
	type CrfDispatchFormField,
} from "./types";
import OrderDeliveryCheck, {
	formatDeliveryDate,
	formatEstimatePlace,
} from "./OrderDeliveryCheck";
import type { CrfOrderController } from "./useCrfOrder";
import type { DeliveryCheckController } from "./useDeliveryCheck";

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

/* ========================================================================== */
/*                                 Step header                                */
/* ========================================================================== */

const STEPS = [
	{ id: "pin", label: "Delivery PIN" },
	{ id: "details", label: "Recipient & address" },
] as const;

const OrderSteps = ({ step }: { step: DeliveryCheckController["step"] }) => {
	const activeIndex = STEPS.findIndex((item) => item.id === step);

	return (
		<ol className="crf-order-steps" aria-label="Order steps">
			{STEPS.map((item, index) => {
				const state =
					index < activeIndex
						? "done"
						: index === activeIndex
							? "active"
							: "todo";

				return (
					<li
						key={item.id}
						className={`crf-order-step crf-order-step--${state}`}
						aria-current={state === "active" ? "step" : undefined}
					>
						<span className="crf-order-step-index" aria-hidden="true">
							{state === "done" ? <Check /> : index + 1}
						</span>
						<span className="crf-order-step-label">{item.label}</span>
					</li>
				);
			})}
		</ol>
	);
};

/* ========================================================================== */
/*                                    Form                                    */
/* ========================================================================== */

type Props = {
	order: CrfOrderController;
	delivery: DeliveryCheckController;
};

export default function CrfOrderForm({ order, delivery }: Props) {
	const { values, errors, setField } = order;
	const { estimate } = delivery;

	// "Required by" earlier than the estimate can't be met — warn, don't block.
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

	const place = estimate ? formatEstimatePlace(estimate) : "";
	const etaLabel = formatDeliveryDate(estimate?.estimatedDeliveryDate);

	return (
		<>
			<OrderSteps step={delivery.step} />

			{delivery.step === "pin" ? (
				<OrderDeliveryCheck order={order} delivery={delivery} />
			) : (
				<>
					<div className="crf-order-delivering">
						<MapPin aria-hidden="true" />
						<p className="crf-order-delivering-text">
							Delivering to <strong>{values.pincode}</strong>
							{place ? ` · ${place}` : ""}
							{etaLabel ? ` · est. by ${etaLabel}` : ""}
						</p>
						<button
							type="button"
							className="crf-order-link"
							onClick={delivery.change}
						>
							Change
						</button>
					</div>

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
									<label
										htmlFor={fieldId("recipientType")}
										className="form-label"
									>
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
										The estimated delivery is {etaLabel}, which is after this
										date.
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
									PIN code {values.pincode}
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
								<Field
									order={order}
									field="company"
									label="Company / dealership"
								/>
								<Field order={order} field="city" label="City" required />
								<Field order={order} field="district" label="District" />
								<Field order={order} field="state" label="State" required />
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
			)}
		</>
	);
}
