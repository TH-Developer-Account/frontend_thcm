import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";

import SimpleViewTable, {
	type SimpleTableColumn,
} from "../../../components/ui/tables/SimpleViewTable";

import { CLAIM_HEAD_OPTIONS } from "../utils/claimHead.constants";

import type {
	ClaimHeadFormRow,
	ClaimHeadRow,
	ClaimHeadValidationErrors,
	ClaimHead,
	ReimbursementClaimActor,
} from "../types/reimbursementClaim.types";

import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import { createRemoteFileUploadValue } from "../../../components/ui/FileUpload/fileUpload.helpers";

import DatePickerInput from "../../../components/common/DatePickerInput";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import { formatDate } from "../../../utils/format";
import Checkbox from "../../../components/forms/Checkbox";

export type MedicalClaimBill = {
	id: string;
	claimId?: string;
	claimHead: ClaimHead;
	billNo?: string | null;
	billNumber?: string | null;
	billName?: string | null;
	billDate?: string | null;
	amount?: string | number | null;
	approvedClaimAmount?: string | number | null;
	approvalStatus?: ClaimHeadRow["approvalStatus"];
	s3Key?: string | null;
	fileName?: string | null;
	fileUrl?: string | null;
	attachmentUrl?: string | null;
	mimeType?: string | null;
	fileSize?: number | null;
	attachment?: FileUploadValue | null;
};

type ClaimHeadEntryTableProps = {
	items: ClaimHeadFormRow[];

	savedItems: Array<ClaimHeadRow | MedicalClaimBill>;

	loading?: boolean;

	editingId?: string | null;

	savingId?: string | null;

	deletingId?: string | null;

	isViewMode?: boolean;

	actorRole?: ReimbursementClaimActor;

	canApproveLineItems?: boolean;

	canEditClaimRows?: boolean;

	errors: ClaimHeadValidationErrors;

	onChange: (
		rowId: string,
		field: keyof Omit<ClaimHeadFormRow, "id">,
		value: unknown,
	) => void;

	onSaveRow: (row: ClaimHeadFormRow, index: number) => void;

	onEditRow: (row: ClaimHeadRow) => void;

	onCancelEdit: () => void;

	onDeleteRow: (id: string) => void;

	onApprovedAmountChange: (id: string, value: string) => void;

	onToggleLineItemStatus: (id: string) => void;

	onApproveLineItem?: (lineItem: ClaimHeadRow) => void | Promise<void>;

	onRemarksChange: (id: string, value: string) => void;

	lineItemRemarks: Record<string, string>;
};

const SKELETON_ROWS = 5;

type TableColumnDefinition<T> = {
	id?: string;
	accessorKey?: string;
	header: ReactNode;
	enableSorting?: boolean;
	cell: (context: { row: { original: T; index: number } }) => ReactNode;
};

const getFileNameFromKey = (key?: string | null): string | null => {
	if (!key) return null;
	const fileName = key.split("/").pop()?.trim();
	return fileName || null;
};

const createMedicalClaimBillUploadValue = (
	bill: MedicalClaimBill,
): FileUploadValue | null => {
	const fileUrl = bill.fileUrl ?? bill.attachmentUrl;
	if (!fileUrl) return null;

	const fileName =
		bill.fileName ?? getFileNameFromKey(bill.s3Key) ?? "Medical claim bill";

	return createRemoteFileUploadValue({
		id: bill.id,
		url: fileUrl,
		name: fileName,
		type: bill.mimeType,
		size: bill.fileSize,
		fallbackName: fileName,
	});
};

const normalizeSavedClaim = (
	item: ClaimHeadRow | MedicalClaimBill,
): ClaimHeadRow => {
	const bill = item as MedicalClaimBill;
	const amount = String(bill.amount ?? "");

	return {
		...item,
		id: bill.id,
		claimHead: bill.claimHead,
		billNumber: bill.billNumber ?? bill.billNo ?? "",
		billName: bill.billName ?? "",
		billDate: bill.billDate ?? "",
		amount,
		file: "file" in item ? item.file : null,
		fileName: bill.fileName ?? getFileNameFromKey(bill.s3Key) ?? "Attachment",
		attachment: bill.attachment ?? createMedicalClaimBillUploadValue(bill),
		approvedClaimAmount: String(bill.approvedClaimAmount ?? amount),
		approvalStatus: bill.approvalStatus ?? "PENDING",
	} as ClaimHeadRow;
};

export const ClaimHeadEntryTable = ({
	items,
	savedItems,
	loading = false,
	editingId,
	savingId,
	deletingId,
	isViewMode = false,
	actorRole = "creator",
	canApproveLineItems = false,
	canEditClaimRows = false,
	errors,
	onChange,
	onSaveRow,
	onEditRow,
	onCancelEdit,
	onDeleteRow,
	onToggleLineItemStatus,
	onApproveLineItem,
	// onRemarksChange,
	// lineItemRemarks,
	onApprovedAmountChange,
}: ClaimHeadEntryTableProps) => {
	const [approvingId, setApprovingId] = useState<string | null>(null);
	const normalizedSavedItems = useMemo(
		() => savedItems.map(normalizeSavedClaim),
		[savedItems],
	);

	const handleApproveLineItem = useCallback(
		async (claim: ClaimHeadRow) => {
			if (!onApproveLineItem) {
				onToggleLineItemStatus(claim.id);
				return;
			}

			try {
				setApprovingId(claim.id);
				await onApproveLineItem({
					...claim,
					// approvalStatus: "APPROVED",
				});
				onToggleLineItemStatus(claim.id);
			} finally {
				setApprovingId(null);
			}
		},
		[onApproveLineItem, onToggleLineItemStatus],
	);

	const toDatePickerValue = (value?: string): Date | undefined => {
		if (!value) {
			return undefined;
		}

		const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);

		return Number.isNaN(date.getTime()) ? undefined : date;
	};

	const toDateString = (date: Date): string => {
		const year = date.getFullYear();

		const month = String(date.getMonth() + 1).padStart(2, "0");

		const day = String(date.getDate()).padStart(2, "0");

		return `${year}-${month}-${day}`;
	};

	const columns = useMemo<TableColumnDefinition<ClaimHeadRow>[]>(() => {
		const showsReviewColumn = actorRole === "approver";

		const showsApprovalAmounts = actorRole === "approver";

		const tableColumns: TableColumnDefinition<ClaimHeadRow>[] = [
			{
				id: "flag",

				header: "",

				enableSorting: false,

				cell: ({ row }) => {
					if (!showsReviewColumn) {
						return null;
					}

					const isApproved = row.original.approvalStatus === "APPROVED";

					return (
						<span
							aria-hidden="true"
							className={`block h-full min-h-6 w-1 rounded-full ${
								isApproved ? "bg-approved" : "bg-rejected"
							}`}
						/>
					);
				},
			},

			{
				id: "serialNumber",

				header: "S.No",

				enableSorting: false,

				cell: ({ row }) => row.index + 1,
			},

			{
				accessorKey: "claimHead",

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

			{
				accessorKey: "fileName",
				header: "Attachment",
				enableSorting: false,

				cell: ({ row }) => {
					const fileValue = row.original.attachment;

					if (!fileValue) {
						return <span className="text-iron">--</span>;
					}

					return (
						<div className="min-w-52">
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
		];

		if (showsApprovalAmounts) {
			tableColumns.push({
				id: "approvedClaimAmount",

				header: "Approved Claim Amount",

				enableSorting: false,

				cell: ({ row }) => {
					const claim = row.original;

					return (
						<div className="min-w-40">
							<FormInput
								value={claim.approvedClaimAmount}
								inputMode="decimal"
								disabled={
									loading ||
									!canApproveLineItems ||
									claim.approvalStatus === "APPROVED"
								}
								onChange={(event) =>
									onApprovedAmountChange(claim.id, event.target.value)
								}
								error={errors[`approvedClaimAmount-${claim.id}`]}
							/>
						</div>
					);
				},
			});
		}

		// if (showsReviewColumn) {
		// 	tableColumns.push({
		// 		id: "remarks",

		// 		header: "Remarks",

		// 		enableSorting: false,

		// 		cell: ({ row }) => {
		// 			const claim = row.original;

		// 			const isApproved = claim.approvalStatus === "APPROVED";

		// 			const isApproving = approvingId === claim.id;

		// 			const disabled = loading || isApproving || !canApproveLineItems;

		// 			return !isApproved ? (
		// 				<FormInput
		// 					placeholder="Remarks (optional)"
		// 					value={lineItemRemarks[claim.id] ?? ""}
		// 					disabled={disabled}
		// 					onChange={(event) =>
		// 						onRemarksChange(claim.id, event.target.value)
		// 					}
		// 					aria-label={`Remarks for bill ${claim.billNumber}`}
		// 				/>
		// 			) : null;
		// 		},
		// 	});
		// }

		if (showsReviewColumn) {
			tableColumns.push({
				id: "review",

				header: "Actions",

				enableSorting: false,

				cell: ({ row }) => {
					const claim = row.original;

					const isApproved = claim.approvalStatus === "APPROVED";

					const isApproving = approvingId === claim.id;

					const disabled = loading || isApproving || !canApproveLineItems;

					return (
						<div className="flex flex-col gap-1.5">
							<div className="flex items-center gap-1.5">
								<Checkbox
									name={`bill-approved-${claim.id}`}
									checked={isApproved || isApproving}
									disabled={disabled || isApproving}
									onChange={(checked) => {
										if (checked) {
											void handleApproveLineItem(claim);
											return;
										}

										onToggleLineItemStatus(claim.id);
									}}
									size={30}
								/>
							</div>
						</div>
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
		actorRole,
		approvingId,
		canApproveLineItems,
		canEditClaimRows,
		deletingId,
		errors,
		isViewMode,
		// lineItemRemarks,
		loading,
		onApprovedAmountChange,
		// onApproveLineItem,
		onDeleteRow,
		onEditRow,
		handleApproveLineItem,
		// onRemarksChange,
		onToggleLineItemStatus,
	]);

	const simpleColumns = useMemo<SimpleTableColumn<ClaimHeadRow>[]>(
		() =>
			columns.map((column, columnIndex) => ({
				key: column.id ?? column.accessorKey ?? `column-${columnIndex}`,
				header: column.header,
				render: (item, index) =>
					column.cell({ row: { original: item, index } }),
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
				? items.map((item, index) => {
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
											event.target.value.replace(/[^0-9.]/g, ""),
										)
									}
									error={errors[`amount-${item.id}`]}
								/>

								<FileUploadField
									label="Upload bill"
									kind="mediclaimDocument"
									value={item.attachment ?? null}
									onChange={(nextValue) => {
										onChange(item.id, "attachment", nextValue);

										onChange(item.id, "file", nextValue?.file ?? null);
									}}
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
										onClick={() => onSaveRow(item, index)}
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
				<div className="min-w-0 px-4">
					<SimpleViewTable<ClaimHeadRow>
						data={normalizedSavedItems}
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
