import { useEffect, useMemo, useState, type MouseEvent } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
	CheckCircle2,
	Eye,
	FileText,
	Pencil,
	Plus,
	RotateCcw,
	Save,
	Trash2,
	XCircle,
} from "lucide-react";

import Button from "../../../components/common/Button";
import { Modal } from "../../../components/common/Modal";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";

import DataTable from "../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../components/ui/tables/Skeletons/DataTableSkeleton";

import { CLAIM_HEAD_OPTIONS } from "../utils/claimHead.constants";

import type {
	ClaimHeadFormRow,
	ClaimHeadRow,
	ClaimHeadValidationErrors,
	ClaimHead,
	ReimbursementClaimActor,
} from "../types/reimbursementClaim.types";

import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";

import {
	isImageUpload,
	isPdfUpload,
} from "../../../components/ui/FileUpload/fileUpload.helpers";

import DatePickerInput from "../../../components/common/DatePickerInput";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import { formatDate } from "../../../utils/format";

type ClaimHeadEntryTableProps = {
	items: ClaimHeadFormRow[];

	savedItems: ClaimHeadRow[];

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

	onRemarksChange: (id: string, value: string) => void;

	lineItemRemarks: Record<string, string>;
};

const DEFAULT_PAGE_SIZE = 5;

const SKELETON_ROWS = 5;

type PreviewTarget = FileUploadValue;

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
	onRemarksChange,
	lineItemRemarks,
	onApprovedAmountChange,
}: ClaimHeadEntryTableProps) => {
	const [pageIndex, setPageIndex] = useState(0);

	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

	const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(
		null,
	);

	const pageCount = Math.max(1, Math.ceil(savedItems.length / pageSize));

	useEffect(() => {
		setPageIndex((current) => Math.min(current, pageCount - 1));
	}, [pageCount]);

	const handlePageSizeChange = (nextPageSize: number) => {
		setPageSize(nextPageSize);
		setPageIndex(0);
	};

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

	const columns = useMemo<ColumnDef<ClaimHeadRow>[]>(() => {
		const showsReviewColumn = actorRole === "approver";

		const showsApprovalAmounts = actorRole === "approver";

		const tableColumns: ColumnDef<ClaimHeadRow>[] = [
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

				cell: ({ row }) => pageIndex * pageSize + row.index + 1,
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
					const claim = row.original;

					/**
					 * `attachment` is the normalized source
					 * for both local and remote files.
					 */
					const attachment = claim.attachment;

					const fileName = claim.fileName ?? attachment?.name ?? "--";

					if (!attachment?.url || fileName === "--") {
						return (
							<span
								className="block max-w-52 truncate text-iron"
								title={fileName}
							>
								{fileName}
							</span>
						);
					}

					const openPreview = (event: MouseEvent) => {
						event.preventDefault();
						event.stopPropagation();

						setPreviewTarget(attachment);
					};

					return (
						<div className="flex max-w-52 items-center gap-1.5">
							<button
								type="button"
								className="min-w-0 flex-1 truncate text-left text-brand underline-offset-2 hover:underline"
								title={`View ${fileName}`}
								onClick={openPreview}
							>
								<span className="truncate">{fileName}</span>
							</button>

							<button
								type="button"
								className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:border-brand hover:text-brand"
								title={`View ${fileName}`}
								aria-label={`View ${fileName}`}
								onClick={openPreview}
							>
								<Eye className="size-3.5" aria-hidden="true" />
							</button>
						</div>
					);
				},
			},
		];

		if (showsApprovalAmounts) {
			tableColumns.push({
				id: "approvedAmount",

				header: "Approved Claim Amount",

				enableSorting: false,

				cell: ({ row }) => {
					const claim = row.original;

					return (
						<div className="min-w-40">
							<FormInput
								value={claim.approvedAmount || claim.amount}
								inputMode="decimal"
								disabled={
									loading ||
									!canApproveLineItems ||
									claim.approvalStatus === "APPROVED"
								}
								onChange={(event) =>
									onApprovedAmountChange(claim.id, event.target.value)
								}
								error={errors[`approvedAmount-${claim.id}`]}
							/>
						</div>
					);
				},
			});
		}

		if (showsReviewColumn) {
			tableColumns.push({
				id: "remarks",

				header: "Remarks",

				enableSorting: false,

				cell: ({ row }) => {
					const claim = row.original;

					const isApproved = claim.approvalStatus === "APPROVED";

					const disabled = loading || !canApproveLineItems;

					return !isApproved ? (
						<FormInput
							placeholder="Remarks (optional)"
							value={lineItemRemarks[claim.id] ?? ""}
							disabled={disabled}
							onChange={(event) =>
								onRemarksChange(claim.id, event.target.value)
							}
							aria-label={`Remarks for bill ${claim.billNumber}`}
						/>
					) : null;
				},
			});
		}

		if (showsReviewColumn) {
			tableColumns.push({
				id: "review",

				header: "Actions",

				enableSorting: false,

				cell: ({ row }) => {
					const claim = row.original;

					const isApproved = claim.approvalStatus === "APPROVED";

					const disabled = loading || !canApproveLineItems;

					return (
						<div className="flex flex-col gap-1.5">
							<div className="flex items-center gap-1.5">
								<Button
									type="button"
									text="OK"
									Icon={CheckCircle2}
									appearance="standard"
									variant={isApproved ? "brand" : "outline"}
									size="sm"
									disabled={disabled || isApproved}
									onClick={() => onToggleLineItemStatus(claim.id)}
									aria-label={`Mark bill ${claim.billNumber} as OK`}
								/>

								<Button
									type="button"
									text="Cancel"
									Icon={XCircle}
									appearance="standard"
									variant={!isApproved ? "brand" : "outline"}
									size="sm"
									disabled={disabled || !isApproved}
									onClick={() => onToggleLineItemStatus(claim.id)}
									aria-label={`Mark bill ${claim.billNumber} as not OK`}
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
		canApproveLineItems,
		canEditClaimRows,
		deletingId,
		errors,
		isViewMode,
		lineItemRemarks,
		loading,
		onApprovedAmountChange,
		onDeleteRow,
		onEditRow,
		onRemarksChange,
		onToggleLineItemStatus,
		pageIndex,
		pageSize,
	]);

	const isImagePreview = previewTarget ? isImageUpload(previewTarget) : false;

	const isPdfPreview = previewTarget ? isPdfUpload(previewTarget) : false;

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
				{loading ? (
					<DataTableSkeleton
						rows={SKELETON_ROWS}
						columns={
							actorRole === "approver"
								? 10
								: actorRole === "externalApprover"
									? 8
									: isViewMode
										? 8
										: 9
						}
						showPagination
					/>
				) : (
					<div className="max-h-[500px] min-w-0 overflow-auto scrollbar-sleek px-4">
						<DataTable<ClaimHeadRow>
							data={savedItems}
							columns={columns}
							enablePagination
							pageIndex={pageIndex}
							pageSize={pageSize}
							pageCount={pageCount}
							onPageChange={setPageIndex}
							onPageSizeChange={handlePageSizeChange}
							scrollTargetId="claim-head-table-scroll"
							emptyTitle="No claim heads added"
							emptyDescription={
								isViewMode
									? "No claim heads are available for this claim."
									: "Add a claim head using the form above."
							}
						/>
					</div>
				)}
			</section>

			<Modal
				open={Boolean(previewTarget)}
				title={previewTarget?.name ?? "File preview"}
				size="xl"
				className="file-upload-preview-modal"
				onClose={() => setPreviewTarget(null)}
				ariaLabel="Claim bill attachment preview"
			>
				{previewTarget ? (
					<div className="file-upload-preview-modal-content">
						{isImagePreview ? (
							<img
								src={previewTarget.url}
								alt={previewTarget.name}
								className="file-upload-preview-modal-image"
							/>
						) : isPdfPreview ? (
							<iframe
								src={previewTarget.url}
								title={previewTarget.name}
								className="file-upload-preview-modal-frame"
							/>
						) : (
							<div className="file-upload-preview-modal-fallback">
								<FileText aria-hidden="true" />

								<p>This file type cannot be previewed in the browser.</p>

								<a
									href={previewTarget.url}
									target="_blank"
									rel="noopener noreferrer"
									className="file-upload-preview-modal-link"
								>
									Open file
								</a>
							</div>
						)}
					</div>
				) : null}
			</Modal>
		</div>
	);
};

export default ClaimHeadEntryTable;
