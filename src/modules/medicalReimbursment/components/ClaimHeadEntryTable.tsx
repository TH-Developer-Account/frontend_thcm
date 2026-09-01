import { useMemo, type ReactNode } from "react";
import { Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";

import SimpleViewTable, {
	type SimpleTableColumn,
	type SimpleTableWidthUnits,
} from "../../../components/ui/tables/SimpleViewTable";

import { CLAIM_HEAD_OPTIONS } from "../utils/claimHead.constants";

import type {
	ClaimHead,
	ClaimHeadRow,
} from "../types/reimbursementClaim.types";

import DatePickerInput from "../../../components/common/DatePickerInput";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import { formatDate } from "../../../utils/format";
import Checkbox from "../../../components/forms/Checkbox";
import {
	sanitizeAmountInput,
	toDatePickerValue,
	toDateString,
	useReimbursementClaimFormContext,
} from "../hooks/useReimbursementClaimForm";

const SKELETON_ROWS = 5;

const formatCurrency = (amount: number) =>
	`₹ ${amount.toLocaleString("en-IN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;

const sumAmounts = (
	rows: ClaimHeadRow[],
	accessor: (row: ClaimHeadRow) => string | number | null | undefined,
) => rows.reduce((total, row) => total + Number(accessor(row) || 0), 0);

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
					const option = CLAIM_HEAD_OPTIONS.find(
						(item) => item.value === row.original.claimHead,
					);

					return (
						<span
							className="block max-w-52 truncate font-medium"
							title={option?.label}
						>
							{option?.label ?? "--"}
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

		tableColumns.push({
			id: "approvedClaimAmount",

			header: "Approved Amount",

			enableSorting: false,

			cell: ({ row }) => {
				const claim = row.original;

				const isApproved = claim.approvalStatus === "APPROVED";

				return (
					<div className="min-w-10">
						<FormInput
							value={claim.approvedClaimAmount ?? claim.amount}
							inputMode="decimal"
							disabled={loading || !canApproveLineItems || isApproved}
							onChange={(event) =>
								onApprovedAmountChange(claim.id, event.target.value)
							}
							error={errors[`approvedClaimAmount-${claim.id}`]}
						/>
					</div>
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

				const disabled = loading || isApproving || !canApproveLineItems;

				return (
					<div className="flex flex-col gap-1.5 justify-center text-center">
						<div className="flex items-center gap-1.5 justify-center text-center">
							<Checkbox
								name={`bill-approved-${claim.id}`}
								checked={isApproved || isApproving}
								disabled={disabled}
								onChange={(checked) => {
									if (checked) {
										void handleApproveLineItem(claim);
										return;
									}
									onToggleLineItemStatus(claim.id);
								}}
								label={isApproved ? "Approved" : "Approve"}
								size={20}
							/>
						</div>
					</div>
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
				const isApproved = claim.approvalStatus === "APPROVED";
				const isApproving = approvingId === claim.id;
				const isSavingRemarks = savingRemarksId === claim.id;

				const disabled =
					loading ||
					isApproving ||
					!canApproveLineItems ||
					isApproved ||
					isSavingRemarks;

				const hasRemarks = Boolean(claim.remarks?.trim());

				return (
					<div className="flex min-w-56 items-start gap-2">
						<div className="min-w-0 flex-1">
							<FormInput
								placeholder="Enter remarks"
								value={claim.remarks ?? ""}
								disabled={disabled}
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
					</div>
				);
			},
		});

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
								onClick={() => onEditRow(claim)}
								aria-label="Edit Claim"
							/>

							<Button
								type="button"
								Icon={Trash2}
								appearance="icon"
								variant="outline"
								size="sm"
								disabled={isDeleting}
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
		canApproveLineItems,
		canEditClaimRows,
		deletingId,
		errors,
		isViewMode,
		loading,
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
											sumAmounts(rows, (row) => row.approvedClaimAmount),
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
									placeholder="Bill Number"
									onChange={(event) =>
										onChange(item.id, "billNumber", event.target.value)
									}
									error={errors[`billNumber-${item.id}`]}
								/>

								<FormInput
									value={item.billName}
									placeholder="Bill Description"
									label="Bill Description"
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
										disabled={isSaving}
										onClick={() => onSaveRow(item)}
										aria-label={isEditing ? "Update Claim" : "Add Claim"}
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
						loading={loading}
						skeletonRows={SKELETON_ROWS}
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
