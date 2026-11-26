// tabs/PurchasingDetailsTab.tsx — wizard step 2.
// Suppliers, the summary sheet (part info) and the approval values.
//
// Approval values are picked as RANGES from the approval matrix (utils/cpp.bands.ts):
//   - "Highest value per part" (sheets 1, 5) or "Highest price variation %" (sheet 2)
//   - the amount range: annualised value / annualised impact / actual impact
// The amount ranges depend on the part / % range on sheets 1, 2 and 5, so that
// dropdown opens once the first one is picked. The backend routes on these ranges.
// Requests saved before the ranges existed still show their typed numbers in view mode.
// Plain content: the parent card in CppRequestCreatePage provides the surface.
import { useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Download } from "lucide-react";

import Button from "../../../components/common/Button";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import PartSummaryModal from "../components/PartSummaryModal";
import {
	FieldAnchor,
	RhfAmountInput,
	RhfInput,
	RhfSelect,
	useCppReadOnly,
	useFieldError,
} from "../components/CppFields";
import type { CppFormValues } from "../types/cpp.types";
import { amountBandOptions, partBandOptions } from "../utils/cpp.bands";
import {
	CPP_AMOUNT_BASIS_LABELS,
	CPP_PART_BASIS_LABELS,
} from "../utils/cpp.constants";
import { canDownload, downloadCppFile } from "../utils/cpp.files";
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

/* ----------------------------- approval ranges ----------------------------- */

/** View mode of a request saved before the ranges existed: its typed numbers. */
const LegacyApprovalValues = () => {
	const { control } = useFormContext<CppFormValues>();
	const conditionCode = useWatch({ control, name: "condition" });
	const condition = getCondition(conditionCode);
	if (!condition) return null;

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{condition.partBasis === "PART_VALUE" ? (
				<RhfAmountInput
					name="approvalValues.partValue"
					label={CPP_PART_BASIS_LABELS.PART_VALUE}
					disabled
				/>
			) : null}
			{condition.partBasis === "VARIATION_PCT" ? (
				<RhfInput
					name="approvalValues.variationPct"
					label={CPP_PART_BASIS_LABELS.VARIATION_PCT}
					disabled
				/>
			) : null}
			<RhfAmountInput
				name="approvalValues.amount"
				label={CPP_AMOUNT_BASIS_LABELS[condition.amountBasis]}
				disabled
			/>
		</div>
	);
};

const ApprovalValuesFields = () => {
	const { control, setValue } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const [conditionCode, category, plant, approval] = useWatch({
		control,
		name: ["condition", "category", "plant", "approvalValues"],
	});
	const partBand = approval?.partBand ?? "";
	const amountBand = approval?.amountBand ?? "";
	const condition = getCondition(conditionCode);

	const partOptions = useMemo(
		() => partBandOptions(conditionCode, category, plant),
		[conditionCode, category, plant],
	);
	const amountOptions = useMemo(
		() => amountBandOptions(conditionCode, category, plant, partBand),
		[conditionCode, category, plant, partBand],
	);

	// Keep the picks valid when the condition, the Spares flow or the part range
	// changes, so a stale range never routes. A single possible range (e.g. ">₹1 L
	// per part" -> "Any value") is picked for the user. View mode never rewrites.
	useEffect(() => {
		if (readOnly) return;
		const options = { shouldDirty: true, shouldValidate: false };
		if (partBand && !partOptions.some((o) => o.value === partBand))
			setValue("approvalValues.partBand", "", options);
		if (amountBand && !amountOptions.some((o) => o.value === amountBand))
			setValue("approvalValues.amountBand", "", options);
		else if (!amountBand && amountOptions.length === 1)
			setValue("approvalValues.amountBand", amountOptions[0].value, options);
	}, [amountBand, amountOptions, partBand, partOptions, readOnly, setValue]);

	if (!condition)
		return (
			<p className="text-sm text-slate-500">
				Select a condition in Basic details to see the values needed.
			</p>
		);

	const legacy =
		readOnly &&
		!partBand &&
		!amountBand &&
		Boolean(approval?.partValue || approval?.variationPct || approval?.amount);
	if (legacy) return <LegacyApprovalValues />;

	const needsPart = partOptions.length > 0;

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{needsPart && condition.partBasis ? (
				<RhfSelect
					name="approvalValues.partBand"
					label={CPP_PART_BASIS_LABELS[condition.partBasis]}
					required
					placeholder="Select range"
					options={partOptions}
				/>
			) : null}
			<RhfSelect
				name="approvalValues.amountBand"
				label={CPP_AMOUNT_BASIS_LABELS[condition.amountBasis]}
				required
				placeholder={
					needsPart && !partBand
						? `Select ${condition.partBasis === "VARIATION_PCT" ? "the variation %" : "the part value"} first`
						: "Select range"
				}
				isDisabled={amountOptions.length === 0}
				options={amountOptions}
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
