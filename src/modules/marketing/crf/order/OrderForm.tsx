// crf/order/OrderForm.tsx
// Dispatch-details form: recipient + shipping address, matching
// DispatchDetailsInput (crfDispatchDetails.service.ts) field for field.
// Replaces the earlier 4-panel form (PIN delivery check, shipping, recipient,
// billing) built against an endpoint and a billing-address concept that
// don't exist on the real backend.

import FormInput from "../../../../components/forms/FormInput";
import { RECIPIENT_TYPES, RECIPIENT_TYPE_LABEL, type CrfDispatchFormField } from "./types";
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

export default function CrfOrderForm({ order }: { order: CrfOrderController }) {
	const { values, errors, setField } = order;

	return (
		<div className="crf-order-layout">
			<div className="crf-order-main">
				<section className="crf-order-panel">
					<header className="crf-order-panel-header">
						<div>
							<h3 className="crf-order-panel-title">Recipient</h3>
							<p className="crf-order-panel-description">Who receives the souvenirs.</p>
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
								className={["form-input", errors.recipientType && "form-input-error"].filter(Boolean).join(" ")}
								value={values.recipientType}
								onChange={(event) => setField("recipientType", event.target.value as typeof values.recipientType)}
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
							<Field order={order} field="recipientName" label="Recipient name" required />
							<Field order={order} field="recipientPhone" label="Phone" required inputMode="tel" />
							<Field order={order} field="recipientEmail" label="Email" required type="email" inputMode="email" />
							<Field order={order} field="recipientOrganisation" label="Organisation" />

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

							<Field order={order} field="requiredByDate" label="Required by" type="date" />
							<div className="crf-order-span-2 form-field">
								<div className="form-label-row">
									<label htmlFor={fieldId("deliveryInstructions")} className="form-label">
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
									onChange={(event) => setField("deliveryInstructions", event.target.value)}
								/>
							</div>
						</div>
					</fieldset>
				</section>

				<section className="crf-order-panel">
					<header className="crf-order-panel-header">
						<div>
							<h3 className="crf-order-panel-title">Shipping address</h3>
						</div>
					</header>
					<fieldset className="crf-order-fieldset">
						<div className="crf-order-grid">
							<Field order={order} field="line1" label="House / building, street" required className="crf-order-span-2" />
							<Field order={order} field="line2" label="Area / locality" className="crf-order-span-2" />
							<Field order={order} field="landmark" label="Landmark" />
							<Field order={order} field="company" label="Company / dealership" />
							<Field order={order} field="city" label="City" required />
							<Field order={order} field="district" label="District" />
							<Field order={order} field="state" label="State" required />
							<Field order={order} field="pincode" label="PIN code" required inputMode="numeric" maxLength={6} />
							<Field order={order} field="gstin" label="GSTIN" placeholder="Optional, 15 characters" maxLength={15} />
						</div>
					</fieldset>
				</section>
			</div>
		</div>
	);
}
