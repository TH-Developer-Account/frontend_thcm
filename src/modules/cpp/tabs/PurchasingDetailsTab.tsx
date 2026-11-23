// tabs/PurchasingDetailsTab.tsx — wizard step 2.
// Suppliers, the purchasing-details Excel upload, and the summary sheet (part info)
// which opens a modal with the expected format. The app does not capture or store
// line items: the Excel is attached and handed to TCS after approval.
// "Approval values" are the few numbers the approval matrix needs to pick a band.
// Plain content: the parent card in CppRequestCreatePage provides the surface.
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import Button from "../../../components/common/Button";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import PartSummaryModal from "../components/PartSummaryModal";
import {
	RhfInput,
	useCppReadOnly,
	useFieldError,
} from "../components/CppFields";
import type { CppFormValues } from "../types/cpp.types";
import {
	CPP_AMOUNT_BASIS_LABELS,
	CPP_PART_BASIS_LABELS,
} from "../utils/cpp.constants";
import { formatLacs, getCondition, toNum } from "../utils/cpp.utils";

type SupplierKey = keyof CppFormValues["suppliers"];

const SUPPLIERS: { key: SupplierKey; title: string }[] = [
	{ key: "existing", title: "Existing supplier" },
	{ key: "other", title: "Other supplier" },
	{ key: "recommended", title: "Recommended supplier" },
];

const SupplierBlock = ({
	keyName,
	title,
}: {
	keyName: SupplierKey;
	title: string;
}) => {
	const base = `suppliers.${keyName}` as const;

	return (
		<div className="rounded-md border border-slate-200 p-3">
			<div className="mb-2 text-xs font-semibold text-slate-700">{title}</div>
			<div className="grid gap-3">
				{/* Plain input for now — swap for BusinessPartnerAsyncSelect later. */}
				<RhfInput
					name={`${base}.name`}
					label="Supplier name"
					placeholder="Enter supplier name"
					required={keyName !== "other"}
				/>
				<RhfInput
					name={`${base}.code`}
					label="Vendor code"
					placeholder="e.g. V-000000"
				/>
			</div>
		</div>
	);
};

const AmountHint = ({ name }: { name: "partValue" | "amount" }) => {
	const { control } = useFormContext<CppFormValues>();
	const value = useWatch({ control, name: `approvalValues.${name}` });
	const parsed = toNum(value);
	if (parsed === null) return null;
	return <span className="text-xs text-slate-500">= {formatLacs(parsed)}</span>;
};

const ApprovalValuesFields = () => {
	const { control, setValue } = useFormContext<CppFormValues>();
	const conditionCode = useWatch({ control, name: "condition" });
	const condition = getCondition(conditionCode);

	// Drop values the new condition no longer reads, so stale numbers never route.
	useEffect(() => {
		if (condition?.partBasis !== "PART_VALUE") {
			setValue("approvalValues.partValue", "");
		}
		if (condition?.partBasis !== "VARIATION_PCT") {
			setValue("approvalValues.variationPct", "");
		}
	}, [condition?.partBasis, setValue]);

	return (
		<>
			{!condition ? (
				<p className="text-sm text-slate-500">
					Select a condition in Basic details to see the values needed.
				</p>
			) : (
				<div className="grid gap-4 sm:grid-cols-2">
					{condition.partBasis === "PART_VALUE" ? (
						<div className="flex flex-col gap-1">
							<RhfInput
								name="approvalValues.partValue"
								label={CPP_PART_BASIS_LABELS.PART_VALUE}
								required
								inputMode="decimal"
							/>
							<AmountHint name="partValue" />
						</div>
					) : null}
					{condition.partBasis === "VARIATION_PCT" ? (
						<RhfInput
							name="approvalValues.variationPct"
							label={CPP_PART_BASIS_LABELS.VARIATION_PCT}
							required
							inputMode="decimal"
							placeholder="Absolute %, e.g. 12.5"
						/>
					) : null}
					<div className="flex flex-col gap-1">
						<RhfInput
							name="approvalValues.amount"
							label={CPP_AMOUNT_BASIS_LABELS[condition.amountBasis]}
							required
							inputMode="decimal"
						/>
						<AmountHint name="amount" />
					</div>
				</div>
			)}
		</>
	);
};

/** Summary sheet (part info): a status line plus a button that opens the format modal. */
const PartSummaryField = () => {
	const { control } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const [open, setOpen] = useState(false);
	const file = useWatch({ control, name: "attachments.partSummary" }) as
		| FileUploadValue
		| null
		| undefined;
	const error = useFieldError("attachments.partSummary");

	const status = file
		? file.name
		: readOnly
			? "Not uploaded"
			: "Not uploaded yet. This field is mandatory.";

	return (
		<div className="flex flex-col gap-2 rounded-md border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex flex-col gap-0.5">
				<span className="text-sm font-semibold text-slate-900">
					Summary sheet (part info)
					{readOnly ? null : <span className="form-required"> *</span>}
				</span>
				<span className="text-xs text-slate-500 break-all">{status}</span>
				{error && !readOnly ? (
					<span className="form-error-text" role="alert">
						{error}
					</span>
				) : null}
			</div>
			<Button
				type="button"
				text={readOnly ? "View format" : "Summary / part info"}
				size="sm"
				appearance="standard"
				variant="outline"
				onClick={() => setOpen(true)}
			/>
			<PartSummaryModal open={open} onClose={() => setOpen(false)} />
		</div>
	);
};

const PurchasingDetailsTab = () => {
	const { control } = useFormContext<CppFormValues>();

	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-4 lg:grid-cols-3">
				{SUPPLIERS.map((s) => (
					<SupplierBlock key={s.key} keyName={s.key} title={s.title} />
				))}
			</div>

			<PartSummaryField />

			<ApprovalValuesFields />
		</div>
	);
};

export default PurchasingDetailsTab;
