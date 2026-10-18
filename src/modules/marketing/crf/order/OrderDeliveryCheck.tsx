// crf/order/OrderDeliveryCheck.tsx
// Step 1 of the order flow: the delivery PIN code. The user enters a PIN,
// we fetch a delivery estimate for it, and only a serviceable PIN lets them
// continue to the recipient + address step.

import {
	ArrowRight,
	CalendarClock,
	CircleAlert,
	MapPin,
	RefreshCcw,
	Search,
	Truck,
} from "lucide-react";

import Button from "../../../../components/common/Button";
import FormInput from "../../../../components/forms/FormInput";
import { formatCrfAmount } from "../core/schema";
import type { DeliveryEstimate } from "./types";
import type { DeliveryCheckController } from "./useDeliveryCheck";
import type { CrfOrderController } from "./useCrfOrder";

/* ========================================================================== */
/*                                 Formatting                                 */
/* ========================================================================== */

/** "Fri, 23 Oct" — or null when the date is missing / unparsable. */
export const formatDeliveryDate = (value?: string | null) => {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return date.toLocaleDateString("en-IN", {
		weekday: "short",
		day: "numeric",
		month: "short",
	});
};

/** "3–6 days" / "Up to 5 days" — or null when no window is known. */
export const formatDeliveryDays = (estimate: DeliveryEstimate) => {
	const { minDays, maxDays } = estimate;
	if (minDays && maxDays) {
		return minDays === maxDays
			? `${maxDays} days`
			: `${minDays}–${maxDays} days`;
	}
	if (maxDays) return `Up to ${maxDays} days`;
	if (minDays) return `${minDays}+ days`;
	return null;
};

/** One-line place name from whatever the estimate resolved. */
export const formatEstimatePlace = (estimate: DeliveryEstimate) =>
	[estimate.city, estimate.state].filter(Boolean).join(", ");

/* ========================================================================== */
/*                                 Component                                  */
/* ========================================================================== */

type Props = {
	order: CrfOrderController;
	delivery: DeliveryCheckController;
};

export default function OrderDeliveryCheck({ order, delivery }: Props) {
	const { estimate, checking, failed, pin, canContinue } = delivery;

	const date = estimate
		? formatDeliveryDate(estimate.estimatedDeliveryDate)
		: null;
	const days = estimate ? formatDeliveryDays(estimate) : null;
	const place = estimate ? formatEstimatePlace(estimate) : "";

	return (
		<section className="crf-order-panel" aria-label="Delivery PIN code">
			<header className="crf-order-panel-header">
				<div>
					<h3 className="crf-order-panel-title">
						<MapPin aria-hidden="true" />
						Delivery PIN code
					</h3>
					<p className="crf-order-panel-description">
						Where should the souvenirs go? Enter the PIN code to check delivery
						and see when it can arrive.
					</p>
				</div>
			</header>

			<form
				className="crf-order-pin-form"
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					delivery.check();
				}}
			>
				<FormInput
					id="crf-dispatch-pincode"
					name="pincode"
					label="PIN code"
					required
					value={order.values.pincode}
					error={delivery.pinError ?? order.errors.pincode}
					isTooltip={false}
					inputMode="numeric"
					maxLength={6}
					placeholder="6-digit PIN code"
					onChange={(event) => delivery.changePin(event.target.value)}
				/>

				<Button
					type="submit"
					text={checking ? "Checking…" : "Check delivery"}
					Icon={Search}
					size="md"
					appearance="standard"
					variant="outline"
					disabled={checking}
				/>
			</form>

			<div className="crf-order-estimate-slot" role="status" aria-live="polite">
				{checking ? (
					<p className="crf-order-estimate-loading">
						Checking delivery to {pin}…
					</p>
				) : null}

				{failed ? (
					<div className="crf-order-alert" role="alert">
						<CircleAlert aria-hidden="true" />
						<div>
							<p className="crf-order-alert-title">Couldn't check delivery</p>
							<p className="crf-order-alert-meta">
								The delivery check isn't available right now. Please try again.
							</p>
							<Button
								type="button"
								text="Try again"
								Icon={RefreshCcw}
								size="sm"
								appearance="standard"
								variant="outline"
								onClick={delivery.check}
							/>
						</div>
					</div>
				) : null}

				{estimate && !estimate.serviceable ? (
					<div className="crf-order-alert" role="alert">
						<CircleAlert aria-hidden="true" />
						<div>
							<p className="crf-order-alert-title">
								Delivery isn't available to {estimate.pincode}
							</p>
							<p className="crf-order-alert-meta">
								{estimate.message ?? "Try a nearby PIN code."}
							</p>
						</div>
					</div>
				) : null}

				{estimate?.serviceable ? (
					<div className="crf-order-estimate">
						<Truck aria-hidden="true" />
						<div className="crf-order-estimate-body">
							<p className="crf-order-estimate-title">
								Delivery available to {estimate.pincode}
								{place ? ` · ${place}` : ""}
							</p>

							<dl className="crf-order-estimate-grid">
								{date ? (
									<div>
										<dt>Estimated delivery</dt>
										<dd>By {date}</dd>
									</div>
								) : null}
								{days ? (
									<div>
										<dt>Delivery time</dt>
										<dd>{days}</dd>
									</div>
								) : null}
								<div>
									<dt>Delivery charge</dt>
									<dd>
										{estimate.shippingCharge
											? formatCrfAmount(estimate.shippingCharge)
											: "Free"}
									</dd>
								</div>
							</dl>

							{estimate.message ? (
								<p className="crf-order-summary-note">{estimate.message}</p>
							) : null}
						</div>
					</div>
				) : null}
			</div>

			<footer className="crf-order-panel-footer">
				<Button
					type="button"
					text="Continue"
					Icon={ArrowRight}
					iconPosition="right"
					size="md"
					appearance="standard"
					variant="brand"
					disabled={!canContinue}
					onClick={delivery.proceed}
				/>
				{!canContinue && !checking ? (
					<span className="crf-order-panel-hint">
						<CalendarClock aria-hidden="true" />
						Check a serviceable PIN code to continue.
					</span>
				) : null}
			</footer>
		</section>
	);
}
