// handouts/HandoutRequestList.tsx
// The right-hand "Request list" sidebar of the New handout request page
// (wireframe: board 3). Replaces the generic cart that CrfCatalog draws inside
// the Souvenirs card, and takes over the Submit / Cancel buttons.
//
//   • One row per souvenir line: name, variant, qty × rate, Remove.
//   • Stock warning while any line asks for more than is available
//     (availability is display-only; the approver and delivery team re-check).
//   • Estimated value (GST inclusive, same as the request detail page).
//   • Submit for approval (disabled while empty, submitting or short) + Cancel.
//
// Validation messages from validateCrfForm still show per line, so a failed
// submit points at the line to fix.

import { useMemo, type Dispatch, type SetStateAction } from "react";
import { Send } from "lucide-react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import {
	formatCrfAmount,
	formatCrfQuantity,
	type CrfFormErrors,
	type CrfLineItem,
} from "../crf";

type Props = {
	items: CrfLineItem[];
	onChange: Dispatch<SetStateAction<CrfLineItem[]>>;
	/** Output of validateCrfForm (line messages are keyed by line index). */
	errors: CrfFormErrors;
	submitting: boolean;
	onSubmit: () => void;
	onCancel: () => void;
};

const toNumber = (value: unknown) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

/** "Steel water bottle, Blue · 750 ml" */
const lineName = (item: CrfLineItem) =>
	[item.label || "Item", item.variantTitle].filter(Boolean).join(", ");

export default function HandoutRequestList({
	items,
	onChange,
	errors,
	submitting,
	onSubmit,
	onCancel,
}: Props) {
	// Quantity per SKU, so two lines of one SKU are compared with stock once
	// (same rule as the stock check on submit).
	const stockWarnings = useMemo(() => {
		const perSku = new Map<string, number>();
		for (const item of items) {
			if (!item.sku) continue;
			perSku.set(
				item.sku,
				(perSku.get(item.sku) ?? 0) + toNumber(item.quantity),
			);
		}

		const warnings = new Map<string, string>();
		for (const item of items) {
			if (!item.sku || warnings.has(item.sku)) continue;
			// availableQty is only known once stock has been read for the line.
			if (item.availableQty === undefined || item.availableQty === null)
				continue;

			const available = toNumber(item.availableQty);
			const asked = perSku.get(item.sku) ?? 0;
			if (available <= 0) {
				warnings.set(
					item.sku,
					`${lineName(item)}: out of stock. Remove it to submit.`,
				);
			} else if (asked > available) {
				warnings.set(
					item.sku,
					`${lineName(item)}: only ${formatCrfQuantity(available)} available, you asked for ${formatCrfQuantity(asked)}. Reduce the quantity to submit.`,
				);
			}
		}
		return [...warnings.values()];
	}, [items]);

	const estimatedValue = items.reduce(
		(sum, item) => sum + toNumber(item.quantity) * toNumber(item.rate),
		0,
	);

	const removeLine = (index: number) =>
		onChange((previous) => previous.filter((_, i) => i !== index));

	const canSubmit =
		items.length > 0 && stockWarnings.length === 0 && !submitting;

	return (
		<Card
			padding="compact"
			title="Request list"
			actions={
				<span className="handout-note">
					{items.length} {items.length === 1 ? "item" : "items"}
				</span>
			}
			footer={
				<div className="bottom-buttons-bar-between ">
					<Button
						type="button"
						text="Cancel"
						appearance="standard"
						variant="outline"
						size="sm"
						disabled={submitting}
						onClick={onCancel}
					/>
					<Button
						type="button"
						text={submitting ? "Submitting..." : "Submit for approval"}
						Icon={Send}
						iconPosition="left"
						appearance="standard"
						variant="brand"
						size="sm"
						disabled={!canSubmit}
						onClick={onSubmit}
					/>
				</div>
			}
		>
			{items.length === 0 ? (
				<p className="handout-note">
					No souvenirs added yet. Add a product from the catalog and it will
					appear here.
				</p>
			) : (
				<ul className="handout-list" aria-label="Souvenirs in this request">
					{items.map((item, index) => {
						const lineErrors = Object.values(errors.items[index] ?? {}).filter(
							Boolean,
						) as string[];

						return (
							<li
								key={item.id ?? `${item.sku ?? item.value}-${index}`}
								className="handout-list-row"
							>
								<div className="handout-list-name">
									{item.label || "Item"}
									{item.variantTitle ? (
										<small>{item.variantTitle}</small>
									) : null}
									{lineErrors.map((message) => (
										<span
											key={message}
											className="handout-list-error"
											role="alert"
										>
											{message}
										</span>
									))}
								</div>
								<div className="handout-list-figures">
									<span>
										{formatCrfQuantity(item.quantity)} ×{" "}
										{formatCrfAmount(toNumber(item.rate))}
									</span>
									<button
										type="button"
										className="handout-link-button"
										aria-label={`Remove ${lineName(item)}`}
										onClick={() => removeLine(index)}
									>
										Remove
									</button>
								</div>
							</li>
						);
					})}
				</ul>
			)}

			{stockWarnings.length > 0 ? (
				<div className="handout-warning" role="alert">
					{stockWarnings.map((message) => (
						<p key={message}>{message}</p>
					))}
				</div>
			) : null}

			{items.length > 0 ? (
				<>
					<div className="handout-list-total">
						<span>Estimated value (incl. GST)</span>
						<strong>{formatCrfAmount(estimatedValue)}</strong>
					</div>
					<p className="handout-note handout-list-hint">
						Availability is checked live and not reserved. It is checked again
						before delivery.
					</p>
				</>
			) : null}
		</Card>
	);
}
