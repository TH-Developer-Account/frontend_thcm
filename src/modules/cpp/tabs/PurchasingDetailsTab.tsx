// tabs/PurchasingDetailsTab.tsx — wizard step 2.
// Suppliers, the summary sheet (part info) and the approval values.
//
// Approval values: when the saved summary sheet has parts, "Highest value per
// part" and the amount band (annualised value / impact, actual impact) are picked
// from a dropdown of those parts, highest first — the value is taken from the
// part and shown read-only. Without a saved sheet the values are typed by hand.
// Amounts are stored raw (no commas); the field shows commas and the amount in words.
// Plain content: the parent card in CppRequestCreatePage provides the surface.
import { useEffect, useMemo, useState } from "react";
import {
	Controller,
	useFormContext,
	useWatch,
	type FieldPath,
} from "react-hook-form";
import { Download } from "lucide-react";

import Button from "../../../components/common/Button";
import ReadOnlyField from "../../../components/forms/ReadOnlyField";
import SelectInput from "../../../components/forms/SelectInput";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import PartSummaryModal from "../components/PartSummaryModal";
import {
	FieldAnchor,
	RhfAmountInput,
	RhfInput,
	useCppReadOnly,
	useFieldError,
} from "../components/CppFields";
import type {
	CppFormValues,
	CppSummaryPart,
} from "../types/cpp.types";
import { formatAmountText } from "../utils/cpp.amount";
import {
	CPP_AMOUNT_BASIS_LABELS,
	CPP_PART_BASIS_LABELS,
} from "../utils/cpp.constants";
import { canDownload, downloadCppFile } from "../utils/cpp.files";
import {
	partAmountOf,
	partLabel,
	partOptions,
	partPriceOf,
} from "../utils/cpp.parts";
import { RECOMMENDED_CODE_REQUIRED } from "../utils/cpp.schema";
import { getCondition } from "../utils/cpp.utils";

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
			<div className="grid gap-2">
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
					required={keyName === "recommended" && RECOMMENDED_CODE_REQUIRED}
				/>
			</div>
		</div>
	);
};

/* ------------------------------ part pickers ------------------------------ */

type ApprovalKey = keyof CppFormValues["approvalValues"];

/**
 * Picks one summary-sheet part and copies its value into `valueName`.
 * Falls back to a typed amount when the sheet has no parts yet.
 */
const PartValueField = ({
	label,
	partName,
	valueName,
	valueOf,
}: {
	label: string;
	partName: ApprovalKey;
	valueName: ApprovalKey;
	valueOf: (part: CppSummaryPart) => number | null;
}) => {
	const { control, setValue } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const partPath = `approvalValues.${partName}` as FieldPath<CppFormValues>;
	const valuePath = `approvalValues.${valueName}` as FieldPath<CppFormValues>;
	const partError = useFieldError(partPath);
	const parts =
		(useWatch({ control, name: "summaryParts" }) as CppSummaryPart[]) ?? [];
	const options = useMemo(() => partOptions(parts, valueOf), [parts, valueOf]);
	const selectOptions = useMemo(
		() =>
			options.map((option) => ({
				value: option.key,
				label: `${partLabel(option.part)} — ₹ ${formatAmountText(option.value)}`,
			})),
		[options],
	);

	// No saved sheet (or no part has this value): type the amount.
	if (options.length === 0)
		return (
			<div className="flex flex-col gap-1">
				<RhfAmountInput name={valuePath} label={label} required />
				{readOnly ? null : (
					<p className="form-helper-text">
						Upload the summary sheet and save the draft to pick the part
						instead of typing.
					</p>
				)}
			</div>
		);

	return (
		<div className="flex flex-col gap-2">
			<Controller
				name={partPath}
				control={control}
				render={({ field }) => {
					const selected =
						selectOptions.find((option) => option.value === field.value) ??
						null;
					return (
						<FieldAnchor name={partPath}>
							{readOnly ? (
								<ReadOnlyField
									label={`${label} — part`}
									value={selected?.label ?? (field.value as string)}
								/>
							) : (
								<SelectInput
									inputId={partPath}
									name={partPath}
									label={`${label} — part`}
									required
									placeholder="Select the part (highest first)"
									options={selectOptions}
									value={selected}
									onChange={(option: { value: string } | null) => {
										const key = option?.value ?? "";
										field.onChange(key);
										const match = options.find((item) => item.key === key);
										setValue(valuePath, match ? String(match.value) : "", {
											shouldDirty: true,
											shouldValidate: true,
										});
									}}
									error={partError}
								/>
							)}
						</FieldAnchor>
					);
				}}
			/>
			{/* The picked part's value: shown, never typed. */}
			<RhfAmountInput name={valuePath} label={label} disabled />
		</div>
	);
};

const ApprovalValuesFields = () => {
	const { control, setValue } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const conditionCode = useWatch({ control, name: "condition" });
	const condition = getCondition(conditionCode);
	const amountBasis = condition?.amountBasis ?? "ANNUALISED_VALUE";
	const amountOf = useMemo(() => partAmountOf(amountBasis), [amountBasis]);

	// Drop values the new condition no longer reads, so stale numbers never route.
	// View mode must never rewrite a saved request, so it skips this.
	useEffect(() => {
		if (readOnly) return;
		if (condition?.partBasis !== "PART_VALUE") {
			setValue("approvalValues.partValue", "");
			setValue("approvalValues.partValuePart", "");
		}
		if (condition?.partBasis !== "VARIATION_PCT") {
			setValue("approvalValues.variationPct", "");
		}
	}, [condition?.partBasis, readOnly, setValue]);

	if (!condition)
		return (
			<p className="text-sm text-slate-500">
				Select a condition in Basic details to see the values needed.
			</p>
		);

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{condition.partBasis === "PART_VALUE" ? (
				<PartValueField
					label={CPP_PART_BASIS_LABELS.PART_VALUE}
					partName="partValuePart"
					valueName="partValue"
					valueOf={partPriceOf}
				/>
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
			<PartValueField
				label={CPP_AMOUNT_BASIS_LABELS[amountBasis]}
				partName="amountPart"
				valueName="amount"
				valueOf={amountOf}
			/>
		</div>
	);
};

/* ---------------------------- summary sheet --------------------------------- */

/** Summary sheet (part info): status, download, and the format / upload modal. */
const PartSummaryField = () => {
	const { control } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const [open, setOpen] = useState(false);
	const file = useWatch({ control, name: "attachments.partSummary" }) as
		| (FileUploadValue & { partRowCount?: number })
		| null
		| undefined;
	const error = useFieldError("attachments.partSummary");

	const status = file
		? `${file.name}${
				!file.isLocal && typeof file.partRowCount === "number"
					? ` · ${file.partRowCount} part row${file.partRowCount === 1 ? "" : "s"}`
					: file.isLocal
						? " · rows are read when you save"
						: ""
			}`
		: readOnly
			? "Not uploaded"
			: "Not uploaded yet. This field is mandatory.";

	return (
		<FieldAnchor name="attachments.partSummary">
			<div
				className={`flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between ${
					error && !readOnly ? "border-red-400" : "border-slate-200"
				}`}
			>
				<div className="flex min-w-0 flex-col gap-0.5">
					<span className="text-sm font-semibold text-slate-900">
						Summary sheet (part info)
						{readOnly ? null : <span className="form-required"> *</span>}
					</span>
					<span className="break-all text-xs text-slate-500">{status}</span>
					{error && !readOnly ? (
						<span className="form-error-text" role="alert">
							{error}
						</span>
					) : null}
				</div>
				<div className="flex flex-wrap gap-2">
					{file && !file.isLocal && canDownload(file) ? (
						<Button
							type="button"
							text="Download"
							Icon={Download}
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={() =>
								void downloadCppFile({ name: file.name, url: file.url })
							}
						/>
					) : null}
					<Button
						type="button"
						text={readOnly ? "View format" : "Summary / part info"}
						size="sm"
						appearance="standard"
						variant="outline"
						onClick={() => setOpen(true)}
					/>
				</div>
				<PartSummaryModal open={open} onClose={() => setOpen(false)} />
			</div>
		</FieldAnchor>
	);
};

const PurchasingDetailsTab = () => (
	<div className="flex flex-col gap-4">
		<div className="grid gap-3 lg:grid-cols-3">
			{SUPPLIERS.map((s) => (
				<SupplierBlock key={s.key} keyName={s.key} title={s.title} />
			))}
		</div>

		<PartSummaryField />

		<ApprovalValuesFields />
	</div>
);

export default PurchasingDetailsTab;
