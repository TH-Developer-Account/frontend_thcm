import { useMemo, type ReactNode } from "react";
import { Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";

import SimpleViewTable, {
	type SimpleTableColumn,
	type SimpleTableWidthUnits,
} from "../../../components/ui/tables/SimpleViewTable";

import {
	CLAIM_HEAD_OPTIONS,
	getClaimHeadLabel,
} from "../utils/claimHead.constants";

import type {
	ClaimHead,
	ClaimHeadRow,
} from "../types/reimbursementClaim.types";

import DatePickerInput from "../../../components/common/DatePickerInput";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import { formatDate } from "../../../utils/format";
import Checkbox from "../../../components/forms/Checkbox";
import {
	resolveApprovedAmount,
	sanitizeAmountInput,
	sanitizeBillNumberInput,
	toDatePickerValue,
	toDateString,
	useReimbursementClaimFormContext,
} from "../hooks/useReimbursementClaimForm";

const formatCurrency = (amount: number) =>
	`₹ ${amount.toLocaleString("en-IN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;

const sumAmounts = (
	rows: ClaimHeadRow[],
	accessor: (row: ClaimHeadRow) => string | number | null | undefined,
) => rows.reduce((total, row) => total + Number(accessor(row) || 0), 0);

/**
 * Wraps a review cell (Approved Amount / Approved / Remarks) so it is
 * visibly disabled and can't be clicked or focused.
 */
const ReviewCell = ({
	locked,
	className = "",
	children,
}: {
	locked: boolean;
	className?: string;
	children: ReactNode;
}) => (
	<div
		className={`${className} ${
			locked
				? "pointer-events-none cursor-not-allowed select-none opacity-60"
				: ""
		}`}
		aria-disabled={locked || undefined}
	>
		{children}
	</div>
);

type TableColumnDefinition<T> = {
	id?: string;
	accessorKey?: string;
	header: ReactNode;
	widthUnits?: SimpleTableWidthUnits;
	minWidth?: number;
	enableSorting?: boolean;
	cell: (context: { row: { original: T; index: number } }) => ReactNode;
};

export const ClaimHeadEntryTable = () => {
	const {
		claimRows: items,
		savedClaims,
		isLoading: loading,
		editingClaimId: editingId,
		savingClaimId: savingId,
		deletingClaimId: deletingId,
		approvingClaimId: approvingId,
		isReadOnly: isViewMode,
		canReviewLineItems: canApproveLineItems,
		canEditClaimForm: canEditClaimRows,
		hideReviewColumns: hideReviewColumnsProp,
		claimErrors: errors,
		handleClaimChange: onChange,
		handleSaveClaim: onSaveRow,
		handleEditClaim: onEditRow,
		handleCancelClaimEdit: onCancelEdit,
		handleDeleteClaim: onDeleteRow,
		handleApprovedAmountChange: onApprovedAmountChange,
		handleToggleLineItemStatus: onToggleLineItemStatus,
		handleApproveLineItem,
		handleRemarksChange: onRemarksChange,
		handleSaveRemarks,
		savingRemarksId,
	} = useReimbursementClaimFormContext();

	// Only the current internal approver can review line items; everyone
	// else sees these three columns locked.
	const reviewLocked = !canApproveLineItems;

	// Claimant filling a fresh claim: nothing to show in the review columns.
	const hideReviewColumns = hideReviewColumnsProp;

	const columns = useMemo<TableColumnDefinition<ClaimHeadRow>[]>(() => {
		const tableColumns: TableColumnDefinition<ClaimHeadRow>[] = [
			{
				id: "serialNumber",
				header: "S.No",
				enableSorting: false,
				cell: ({ row }) => row.index + 1,
			},
			{
				accessorKey: "claimHead",
				widthUnits: 1,
				header: "Claim Head",
				cell: ({ row }) => {
					const label = getClaimHeadLabel(row.original.claimHead);
					return (
						<span className="block max-w-52 truncate font-medium" title={label}>
							{label}
						</span>
					);
				},
			},
			{
				accessorKey: "billNumber",
				header: "Bill No.",
				cell: ({ row }) => {
					const value = row.original.billNumber || "--";
					return (
						<span className="whitespace-nowrap" title={value}>
							{value}
						</span>
					);
				},
			},
			{
				accessorKey: "billName",
				widthUnits: 1,
				header: "Bill Description",
				cell: ({ row }) => {
					const value = row.original.billName || "--";
					return (
						<span className="block max-w-56 truncate" title={value}>
							{value}
						</span>
					);
				},
			},
			{
				accessorKey: "billDate",
				header: "Bill Date",
				cell: ({ row }) => (
					<span className="whitespace-nowrap">
						{formatDate(row.original.billDate)}
					</span>
				),
			},
			{
				accessorKey: "fileName",
				header: "Attachment",
				widthUnits: 2,
				enableSorting: false,
				cell: ({ row }) => {
					const fileValue = row.original.attachment;
					if (!fileValue) {
						return <span className="text-iron">--</span>;
					}
					return (
						<div className="min-w-0">
							<FileUploadField
								label=""
								kind="mediclaimDocument"
								value={fileValue}
								onChange={() => undefined}
								readonly
								showActions
								previewVariant="line"
								inputName={`bill-attachment-${row.original.id}`}
							/>
						</div>
					);
				},
			},
			{
				accessorKey: "amount",
				header: "Claimed Amount",
				cell: ({ row }) => {
					const amount = Number(row.original.amount || 0);
					return (
						<span className="font-medium">
							₹ {amount.toLocaleString("en-IN")}
						</span>
					);
				},
			},
		];

		if (!hideReviewColumns) {
			tableColumns.push({
				id: "approvedClaimAmount",
				header: "Approved Amount",
				enableSorting: false,
				cell: ({ row }) => {
					const claim = row.original;
					const isApproved = claim.approvalStatus === "APPROVED";

					// Read-only viewers only see an amount once a bill is approved.
					if (reviewLocked) {
						return (
							<span className="font-medium">
								{isApproved
									? `₹ ${Number(resolveApprovedAmount(claim) || 0).toLocaleString("en-IN")}`
									: "--"}
							</span>
						);
					}

					return (
						<ReviewCell locked={false} className="min-w-10">
							<FormInput
								// Pre-filled with the claimed amount, so ticking
								// "Approve" without typing approves the full amount.
								value={claim.approvedClaimAmount || claim.amount}
								inputMode="decimal"
								disabled={loading || isApproved || approvingId === claim.id}
								onChange={(event) =>
									onApprovedAmountChange(claim.id, event.target.value)
								}
								error={errors[`approvedClaimAmount-${claim.id}`]}
								aria-label={`Approved amount for bill ${claim.billNumber}`}
							/>
						</ReviewCell>
					);
				},
			});

			tableColumns.push({
				id: "review",
				header: "Approved",
				enableSorting: false,
				cell: ({ row }) => {
					const claim = row.original;
					const isApproved = claim.approvalStatus === "APPROVED";
					const isApproving = approvingId === claim.id;
					const disabled = reviewLocked || loading || isApproving;

					// The claimant only sees the outcome, never the action.
					const label = isApproved
						? "Approved"
						: reviewLocked
							? "Pending"
							: "Approve";

					return (
						<ReviewCell
							locked={reviewLocked}
							className="flex items-center justify-center gap-1.5 text-center"
						>
							<Checkbox
								name={`bill-approved-${claim.id}`}
								checked={isApproved}
								disabled={disabled}
								onChange={(checked) => {
									if (disabled) return;
									if (checked) {
										void handleApproveLineItem(claim);
										return;
									}
									void onToggleLineItemStatus(claim.id);
								}}
								label={isApproving ? "Saving…" : label}
								size={20}
							/>
						</ReviewCell>
					);
				},
			});

			tableColumns.push({
				id: "remarks",
				header: "Remarks",
				widthUnits: 2,
				enableSorting: false,
				cell: ({ row }) => {
					const claim = row.original;

					if (reviewLocked) {
						const text = claim.remarks?.trim();
						return (
							<span
								className={text ? "text-sm text-iron-dark" : "text-iron"}
								title={text || undefined}
							>
								{text || "--"}
							</span>
						);
					}

					const isApproved = claim.approvalStatus === "APPROVED";
					const isApproving = approvingId === claim.id;
					const isSavingRemarks = savingRemarksId === claim.id;
					const hasRemarks = Boolean(claim.remarks?.trim());
					// Remarks stay editable until the bill is approved; a reduced
					// approval needs its remark typed BEFORE ticking Approve.
					const disabled =
						loading || isApproving || isApproved || isSavingRemarks;

					return (
						<ReviewCell
							locked={false}
							className="flex min-w-56 items-start gap-2"
						>
							<div className="min-w-0 flex-1">
								<FormInput
									placeholder="Enter remarks"
									value={claim.remarks ?? ""}
									disabled={disabled}
									maxLength={500}
									onChange={(event) =>
										onRemarksChange(claim.id, event.target.value)
									}
									error={errors[`remarks-${claim.id}`]}
									aria-label={`Remarks for bill ${claim.billNumber}`}
								/>
							</div>
							<Button
								type="button"
								appearance="icon"
								Icon={Save}
								disabled={disabled || !hasRemarks}
								loading={isSavingRemarks}
								onClick={() => void handleSaveRemarks(claim.id)}
								title="Save remarks"
							/>
						</ReviewCell>
					);
				},
			});
		}

		if (canEditClaimRows && !isViewMode) {
			tableColumns.push({
				id: "actions",
				header: "Actions",
				enableSorting: false,
				cell: ({ row }) => {
					const claim = row.original;
					const isDeleting = deletingId === claim.id;
					return (
						<div className="flex items-center gap-1.5">
							<Button
								type="button"
								Icon={Pencil}
								appearance="icon"
								variant="outline"
								size="sm"
								disabled={loading}
								onClick={() => onEditRow(claim)}
								aria-label="Edit Claim"
							/>
							<Button
								type="button"
								Icon={Trash2}
								appearance="icon"
								variant="outline"
								size="sm"
								disabled={isDeleting || loading}
								onClick={() => onDeleteRow(claim.id)}
								aria-label="Delete Claim"
							/>
						</div>
					);
				},
			});
		}

		return tableColumns;
	}, [
		approvingId,
		canEditClaimRows,
		deletingId,
		errors,
		hideReviewColumns,
		isViewMode,
		loading,
		reviewLocked,
		onApprovedAmountChange,
		onDeleteRow,
		onEditRow,
		handleApproveLineItem,
		onToggleLineItemStatus,
		onRemarksChange,
		handleSaveRemarks,
		savingRemarksId,
	]);

	const simpleColumns = useMemo<SimpleTableColumn<ClaimHeadRow>[]>(
		() =>
			columns.map((column, columnIndex) => ({
				key: column.id ?? column.accessorKey ?? `column-${columnIndex}`,
				header: column.header,
				widthUnits: column.widthUnits,
				minWidth: column.minWidth,
				render: (item, index) =>
					column.cell({ row: { original: item, index } }),
				footer:
					column.accessorKey === "claimHead"
						? "Total"
						: column.accessorKey === "amount"
							? (rows) => formatCurrency(sumAmounts(rows, (row) => row.amount))
							: column.id === "approvedClaimAmount"
								? (rows) =>
										formatCurrency(
											sumAmounts(
												rows.filter((row) => row.approvalStatus === "APPROVED"),
												(row) => resolveApprovedAmount(row),
											),
										)
								: undefined,
			})),
		[columns],
	);

	return (
		<div className="flex flex-col gap-4">
			{errors.form ? (
				<p className="lead-entry-error-banner" role="alert">
					{errors.form}
				</p>
			) : null}

			{canEditClaimRows && !isViewMode
				? items.map((item) => {
						const isSaving = savingId === item.id;
						const isEditing = editingId === item.id;

						return (
							<div
								key={item.id}
								className="grid grid-cols-1 items-center gap-3 bg-page p-4 xl:grid-cols-7"
							>
								<SelectInput
									placeholder="Claim Head"
									label="Claim Head"
									options={CLAIM_HEAD_OPTIONS}
									value={
										CLAIM_HEAD_OPTIONS.find(
											(option) => option.value === item.claimHead,
										) ?? null
									}
									onChange={(option) =>
										onChange(
											item.id,
											"claimHead",
											(option?.value as ClaimHead) ?? "",
										)
									}
									error={errors[`claimHead-${item.id}`]}
								/>

								<FormInput
									value={item.billNumber}
									label="Bill Number"
									placeholder="e.g. MI-5532"
									maxLength={50}
									onChange={(event) =>
										onChange(
											item.id,
											"billNumber",
											sanitizeBillNumberInput(event.target.value),
										)
									}
									error={errors[`billNumber-${item.id}`]}
								/>

								<FormInput
									value={item.billName}
									placeholder="Bill Description"
									label="Bill Description"
									maxLength={150}
									onChange={(event) =>
										onChange(item.id, "billName", event.target.value)
									}
									error={errors[`billName-${item.id}`]}
								/>

								<DatePickerInput
									label="Date"
									mode="single"
									value={toDatePickerValue(item.billDate)}
									onChange={(nextValue) => {
										if (nextValue instanceof Date) {
											onChange(item.id, "billDate", toDateString(nextValue));
										}
									}}
									error={errors[`billDate-${item.id}`]}
									placeholder="Bill Date"
									toDate={new Date()}
								/>

								<FormInput
									value={item.amount}
									label="Amount"
									inputMode="decimal"
									placeholder="0.00"
									onChange={(event) =>
										onChange(
											item.id,
											"amount",
											sanitizeAmountInput(event.target.value),
										)
									}
									error={errors[`amount-${item.id}`]}
								/>

								<FileUploadField
									label="Upload bill"
									kind="mediclaimDocument"
									value={item.attachment ?? null}
									onChange={(nextValue) =>
										onChange(item.id, "attachment", nextValue)
									}
									error={errors[`file-${item.id}`]}
									disabled={isSaving}
									inputName={`attachment-${item.id}`}
									showActions
								/>

								<div className="mt-1 flex items-end gap-1.5 sm:mt-5">
									<Button
										type="button"
										Icon={isEditing ? Save : Plus}
										appearance="icon"
										variant="outline"
										size="sm"
										disabled={isSaving || loading}
										onClick={() => onSaveRow(item)}
										aria-label={isEditing ? "Update Claim" : "Add Claim"}
										title={isEditing ? "Update bill" : "Add bill"}
									/>
									<Button
										type="button"
										Icon={RotateCcw}
										appearance="icon"
										variant="outline"
										size="sm"
										disabled={isSaving}
										onClick={onCancelEdit}
										aria-label="Reset"
										title={isEditing ? "Cancel editing" : "Clear row"}
									/>
								</div>
							</div>
						);
					})
				: null}

			<section
				className="min-w-0"
				aria-label="Saved Claim Heads"
				aria-busy={loading}
			>
				<div className="min-w-0">
					<SimpleViewTable<ClaimHeadRow>
						data={savedClaims}
						columns={simpleColumns}
						getRowId={(claim) => claim.id}
						loading={false}
						maxHeight="500px"
						ariaLabel="Saved Claim Heads"
						emptyTitle="No claim heads added"
						emptyDescription={
							isViewMode
								? "No claim heads are available for this claim."
								: "Add a claim head using the form above."
						}
					/>
				</div>
			</section>
		</div>
	);
};

export default ClaimHeadEntryTable;
