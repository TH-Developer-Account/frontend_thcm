// crf/crf.order.form.tsx
// Order form: 1. Delivery PIN (serviceability + estimated delivery)
//             2. Shipping address   3. Recipient   4. Billing
// with the order summary and "Place order" on the side.

import type { ReactNode } from "react";
import { CalendarClock, CircleAlert, MapPin, PackageCheck, Search, Truck } from "lucide-react";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import { OrderItemList, OrderTotals, formatDeliveryWindow } from "./crf.order.summary";
import type { CrfOrderFormField } from "./crf.order.types";
import type { CrfOrderController } from "./useCrfOrder";

const fieldId = (field: CrfOrderFormField) => `crf-order-${field}`;

/* ========================================================================== */
/*                                  Pieces                                    */
/* ========================================================================== */

const Panel = ({
	index,
	title,
	description,
	disabled,
	children,
}: {
	index: number;
	title: string;
	description?: string;
	disabled?: boolean;
	children: ReactNode;
}) => (
	<section className={["crf-order-panel", disabled && "crf-order-panel--disabled"].filter(Boolean).join(" ")}>
		<header className="crf-order-panel-header">
			<span className="crf-order-panel-index" aria-hidden="true">
				{index}
			</span>
			<div>
				<h3 className="crf-order-panel-title">{title}</h3>
				{description ? <p className="crf-order-panel-description">{description}</p> : null}
			</div>
		</header>
		<fieldset className="crf-order-fieldset" disabled={disabled}>
			{children}
		</fieldset>
	</section>
);

/** Native select styled like FormInput (city list comes from the PIN). */
const SelectField = ({
	field,
	label,
	value,
	options,
	error,
	required,
	onChange,
}: {
	field: CrfOrderFormField;
	label: string;
	value: string;
	options: string[];
	error?: string;
	required?: boolean;
	onChange: (value: string) => void;
}) => (
	<div className={["form-field", error && "has-error"].filter(Boolean).join(" ")}>
		<div className="form-label-row">
			<label htmlFor={fieldId(field)} className="form-label">
				{label}
				{required ? (
					<span className="form-required" aria-hidden="true">
						*
					</span>
				) : null}
			</label>
		</div>
		<div className="form-input-wrapper">
			<select
				id={fieldId(field)}
				name={field}
				className={["form-input", error && "form-input-error"].filter(Boolean).join(" ")}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				aria-invalid={error ? "true" : undefined}
				required={required}
			>
				<option value="">Select {label.toLowerCase()}</option>
				{options.map((option) => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>
		</div>
		{error ? (
			<p className="form-error-text" role="alert">
				{error}
			</p>
		) : null}
	</div>
);

/* ========================================================================== */
/*                                 Component                                  */
/* ========================================================================== */

export default function CrfOrderForm({ order }: { order: CrfOrderController }) {
	const { values, errors, setField, estimate } = order;
	const serviceable = Boolean(estimate?.serviceable && estimate.pincode === values.pincode);

	const input = (
		field: CrfOrderFormField,
		label: string,
		props: Partial<{
			required: boolean;
			placeholder: string;
			type: string;
			inputMode: "numeric" | "tel" | "email" | "text";
			maxLength: number;
			helperText: string;
			readOnly: boolean;
			disabled: boolean;
			className: string;
			transform: (value: string) => string;
		}> = {},
	) => {
		const { transform, className, ...rest } = props;
		return (
			<div className={className}>
				<FormInput
					id={fieldId(field)}
					name={field}
					label={label}
					value={values[field] as string}
					error={errors[field]}
					isTooltip={false}
					onChange={(event) =>
						setField(field, (transform ? transform(event.target.value) : event.target.value) as never)
					}
					{...rest}
				/>
			</div>
		);
	};

	const digits = (max: number) => (value: string) => value.replace(/[^\d+\s-]/g, "").slice(0, max);

	return (
		<div className="crf-order-layout">
			<div className="crf-order-main">
				{/* ------------------------------ 1. PIN ------------------------------ */}
				<Panel
					index={1}
					title="Delivery PIN code"
					description="Check that the store delivers here and when it should arrive."
				>
					<div className="crf-order-pin-row">
						<FormInput
							id={fieldId("pincode")}
							name="pincode"
							label="PIN code"
							value={values.pincode}
							error={errors.pincode}
							required
							inputMode="numeric"
							maxLength={6}
							placeholder="e.g. 560034"
							isTooltip={false}
							onChange={(event) => order.setPincode(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									void order.checkPincode();
								}
							}}
						/>
						<Button
							type="button"
							text={order.checkingPincode ? "Checking…" : "Check delivery"}
							Icon={Search}
							size="sm"
							appearance="standard"
							variant="outline"
							disabled={order.checkingPincode || values.pincode.length !== 6}
							onClick={() => void order.checkPincode()}
						/>
					</div>

					{estimate && estimate.pincode === values.pincode ? (
						estimate.serviceable ? (
							<div className="crf-order-estimate" role="status">
								<Truck aria-hidden="true" />
								<div>
									<p className="crf-order-estimate-title">
										Delivery by {formatDeliveryWindow(estimate.fromDate, estimate.toDate)}
									</p>
									<p className="crf-order-estimate-meta">
										<MapPin aria-hidden="true" />
										{[estimate.district, estimate.stateName].filter(Boolean).join(", ")} ·{" "}
										{estimate.minDays}–{estimate.maxDays} working days after the order is placed
									</p>
									{estimate.message ? <p className="crf-order-estimate-note">{estimate.message}</p> : null}
								</div>
							</div>
						) : (
							<div className="crf-order-estimate crf-order-estimate--error" role="alert">
								<CircleAlert aria-hidden="true" />
								<p>{estimate.message ?? "The store doesn't deliver to this PIN code."}</p>
							</div>
						)
					) : null}
				</Panel>

				{/* ---------------------------- 2. Shipping --------------------------- */}
				<Panel
					index={2}
					title="Shipping address"
					description={serviceable ? undefined : "Check the delivery PIN code first."}
					disabled={!serviceable}
				>
					<div className="crf-order-grid">
						{estimate && estimate.cities.length > 0 ? (
							<SelectField
								field="city"
								label="City"
								value={values.city}
								options={estimate.cities}
								error={errors.city}
								required
								onChange={(value) => setField("city", value)}
							/>
						) : (
							input("city", "City", { required: true })
						)}
						{input("state", "State", { required: true, readOnly: true, helperText: "From the PIN code" })}
						{input("address1", "House / building, street", {
							required: true,
							placeholder: "Plot 12, Civil Lines",
							className: "crf-order-span-2",
						})}
						{input("address2", "Area / locality", { className: "crf-order-span-2" })}
						{input("landmark", "Landmark", { placeholder: "Near GPO" })}
						{input("company", "Company / dealership", { placeholder: "Optional" })}
					</div>
				</Panel>

				{/* ---------------------------- 3. Recipient -------------------------- */}
				<Panel
					index={3}
					title="Recipient"
					description="Who receives the parcel. Can be different from you."
					disabled={!serviceable}
				>
					<div className="crf-order-grid">
						{input("recipientName", "Recipient name", { required: true })}
						{input("recipientPhone", "Mobile number", {
							required: true,
							type: "tel",
							inputMode: "tel",
							placeholder: "10-digit mobile",
							transform: digits(16),
						})}
						{input("recipientEmail", "Email", { type: "email", inputMode: "email" })}
						{input("alternatePhone", "Alternate mobile", {
							type: "tel",
							inputMode: "tel",
							transform: digits(16),
						})}
						<div className="crf-order-span-2 form-field">
							<div className="form-label-row">
								<label htmlFor={fieldId("deliveryInstructions")} className="form-label">
									Delivery instructions
								</label>
							</div>
							<textarea
								id={fieldId("deliveryInstructions")}
								name="deliveryInstructions"
								className={["form-input", "crf-order-textarea", errors.deliveryInstructions && "form-input-error"]
									.filter(Boolean)
									.join(" ")}
								rows={2}
								maxLength={300}
								placeholder="e.g. Deliver to the marketing desk, 10 am – 5 pm"
								value={values.deliveryInstructions}
								onChange={(event) => setField("deliveryInstructions", event.target.value)}
							/>
							{errors.deliveryInstructions ? (
								<p className="form-error-text" role="alert">
									{errors.deliveryInstructions}
								</p>
							) : null}
						</div>
					</div>
				</Panel>

				{/* ----------------------------- 4. Billing --------------------------- */}
				<Panel index={4} title="Billing" disabled={!serviceable}>
					<label className="crf-toggle">
						<input
							type="checkbox"
							checked={values.billingSameAsShipping}
							onChange={(event) => setField("billingSameAsShipping", event.target.checked)}
						/>
						Billing address is the same as shipping
					</label>

					{!values.billingSameAsShipping ? (
						<div className="crf-order-grid">
							{input("billingName", "Billing name", { required: true })}
							{input("billingCompany", "Company")}
							{input("billingGstin", "GSTIN", {
								placeholder: "Optional, 15 characters",
								maxLength: 15,
								transform: (v) => v.toUpperCase(),
							})}
							{input("billingPincode", "PIN code", {
								required: true,
								inputMode: "numeric",
								maxLength: 6,
								transform: (v) => v.replace(/\D/g, "").slice(0, 6),
							})}
							{input("billingAddress1", "Address", { required: true, className: "crf-order-span-2" })}
							{input("billingCity", "City", { required: true })}
							{input("billingState", "State", { required: true })}
						</div>
					) : (
						<div className="crf-order-grid">
							{input("billingGstin", "GSTIN", {
								placeholder: "Optional, 15 characters",
								maxLength: 15,
								transform: (v) => v.toUpperCase(),
							})}
						</div>
					)}
				</Panel>
			</div>

			{/* ------------------------------- Summary ----------------------------- */}
			<aside className="crf-order-aside" aria-label="Order summary">
				<div className="crf-order-summary">
					<h3 className="crf-order-panel-title">
						<PackageCheck aria-hidden="true" /> Souvenirs to order
					</h3>
					<OrderItemList lines={order.approvedLines} />
					<OrderTotals totals={order.approvedTotals} />

					{serviceable && estimate ? (
						<p className="crf-order-summary-eta">
							<CalendarClock aria-hidden="true" />
							Estimated delivery {formatDeliveryWindow(estimate.fromDate, estimate.toDate)}
						</p>
					) : null}

					{order.nonStoreLines.length > 0 ? (
						<p className="crf-order-summary-note">
							{order.nonStoreLines.length} printed material / artwork{" "}
							{order.nonStoreLines.length === 1 ? "line isn't" : "lines aren't"} ordered from the store and
							{order.nonStoreLines.length === 1 ? " is" : " are"} handled separately.
						</p>
					) : null}

					{order.missingSku.length > 0 ? (
						<p className="crf-order-summary-note crf-order-summary-note--warn">
							Not orderable (no store SKU): {order.missingSku.join(", ")}.
						</p>
					) : null}

					<p className="crf-order-summary-note">
						Stock is checked live when you place the order. If something has run short since approval,
						you can order something else or raise a debit note.
					</p>

					{order.isMock ? (
						<label className="crf-toggle crf-order-dev">
							<input
								type="checkbox"
								checked={order.simulateShortfall}
								onChange={(event) => order.setSimulateShortfall(event.target.checked)}
							/>
							Simulate a stock shortfall (mock)
						</label>
					) : null}

					<Button
						type="button"
						text={order.checkingStock ? "Checking stock…" : order.placing ? "Placing order…" : "Place order"}
						Icon={Truck}
						size="md"
						appearance="standard"
						variant="brand"
						disabled={order.busy || order.approvedLines.length === 0}
						onClick={() => void order.submitForm()}
					/>
				</div>
			</aside>
		</div>
	);
}
