// handouts/HandoutRequestList.tsx
// The "Request list" sidebar of the CRF items step (replaces the generic cart
// CrfCatalog draws inside the Souvenirs card).
//
//   • One row per souvenir line: name, variant, qty × rate, Remove.
//   • Stock warning while any line asks for more than is available
//     (availability is display-only; the approver and delivery team re-check).
//   • Estimated value (GST inclusive).
//
// Back / Next come from the wizard through `footer`. Validation messages from
// validateCrfForm show per line, so a failed Next points at the line to fix.

import {
	useMemo,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
} from "react";

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
	footer: ReactNode;
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
	footer,
}: Props) {
	// Quantity per SKU, so two lines of one SKU are compared with stock once.
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

	const messages = [errors.form, ...stockWarnings].filter(Boolean) as string[];

	return (
		<Card
			padding="compact"
			title="Request list"
			actions={
				<span className="handout-note">
					{items.length} {items.length === 1 ? "item" : "items"}
				</span>
			}
			footer={footer}
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
									<Button
										type="button"
										text="Remove"
										aria-label={`Remove ${lineName(item)}`}
										appearance="standard"
										variant="outline"
										size="sm"
										onClick={() => removeLine(index)}
									/>
								</div>
							</li>
						);
					})}
				</ul>
			)}

			{messages.length > 0 ? (
				<div className="handout-warning" role="alert">
					{messages.map((message) => (
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
