// handouts/HandoutDeliveryPanel.tsx
// Delivery team: tick every item once verified, say who received it, and
// close the request ("Mark hand delivered"). Closing cannot be undone, so the
// button stays disabled until every item is ticked.

import { useMemo, useState } from "react";
import { PackageCheck } from "lucide-react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormInput from "../../../components/forms/FormInput";
import TextareaInput from "../../../components/forms/TextareaInput";
import { useToast } from "../../../context/Auth/AuthContext";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../utils/apiError.helper";
import type { ShopStockCheckResult } from "../crf";

import { useDeliverHandoutMutation } from "./handouts.api";
import { HANDOUT_LIMITS } from "./handouts.constants";
import {
	HANDOUT_MESSAGES,
	handoutDeliverySchema,
	nowInputValue,
	parseWithFieldErrors,
	type HandoutDeliveryErrors,
} from "./handouts.schema";
import type { HandoutDetail } from "./handouts.types";
import HandoutItemsTable from "./HandoutItemsTable";

type Props = {
	handout: HandoutDetail;
	stock?: ShopStockCheckResult;
	stockLoading?: boolean;
	/** Called after a successful close so the page can refetch. */
	onDelivered: () => void | Promise<void>;
};

export default function HandoutDeliveryPanel({
	handout,
	stock,
	stockLoading,
	onDelivered,
}: Props) {
	const { showToast } = useToast();
	const deliver = useDeliverHandoutMutation();

	const [checked, setChecked] = useState<Set<string>>(new Set());
	const [handedToName, setHandedToName] = useState("");
	const [deliveredOn, setDeliveredOn] = useState(nowInputValue);
	const [note, setNote] = useState("");
	const [errors, setErrors] = useState<HandoutDeliveryErrors>({});

	const allSkus = useMemo(
		() => [...new Set(handout.items.map((item) => item.sku))],
		[handout.items],
	);
	const allChecked = allSkus.every((sku) => checked.has(sku));

	const toggle = (sku: string, value: boolean) => {
		setChecked((previous) => {
			const next = new Set(previous);
			if (value) next.add(sku);
			else next.delete(sku);
			return next;
		});
		setErrors((previous) => ({ ...previous, checked: undefined }));
	};

	const submit = async () => {
		const parsed = parseWithFieldErrors(handoutDeliverySchema, {
			handedToName,
			deliveredOn,
			note,
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
				`${handout.requestNumber} was marked hand delivered and closed.`,
				"Request closed",
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
						checkedSkus: checked,
						onToggle: toggle,
						disabled: deliver.isPending,
					}}
				/>
			</Card>

			<Card
				padding="compact"
				title="Hand over and close"
				footer={
					<div className="handout-actions">
						<Button
							type="button"
							text={deliver.isPending ? "Closing..." : "Mark hand delivered and close"}
							Icon={PackageCheck}
							iconPosition="left"
							appearance="standard"
							variant="brand"
							size="sm"
							disabled={deliver.isPending || !allChecked || !handedToName.trim()}
							onClick={() => void submit()}
						/>
					</div>
				}
			>
				<div className="handout-form-grid">
					<FormInput
						name="handedToName"
						label="Handed to (name)"
						required
						value={handedToName}
						placeholder="Person who received the items"
						onChange={(event) => {
							setHandedToName(event.target.value);
							setErrors((previous) => ({ ...previous, handedToName: undefined }));
						}}
						error={errors.handedToName}
					/>
					<FormInput
						name="deliveredOn"
						type="datetime-local"
						label="Delivered on"
						required
						max={nowInputValue()}
						value={deliveredOn}
						helperText="Defaults to now, editable"
						onChange={(event) => {
							setDeliveredOn(event.target.value);
							setErrors((previous) => ({ ...previous, deliveredOn: undefined }));
						}}
						error={errors.deliveredOn}
					/>
					<div className="is-wide">
						<TextareaInput
							name="note"
							label="Delivery note"
							rows={3}
							maxLength={HANDOUT_LIMITS.NOTE}
							value={note}
							placeholder="Optional"
							onChange={(event) => setNote(event.target.value)}
							error={errors.note}
						/>
					</div>
					<p className="handout-note is-wide">
						Marking hand delivered closes this request. It cannot be reopened.
					</p>
				</div>
			</Card>
		</>
	);
}
