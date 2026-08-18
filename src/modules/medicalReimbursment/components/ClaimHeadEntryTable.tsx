import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
	CheckCircle2,
	Pencil,
	Plus,
	RotateCcw,
	Save,
	Trash2,
} from "lucide-react";

import Button from "../../../components/common/Button";
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
	approvingId?: string | null;

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
	onApproveRow: (id: string) => void | Promise<void>;
};

const DEFAULT_PAGE_SIZE = 5;

const SKELETON_ROWS = 5;

export const ClaimHeadEntryTable = ({
	items,
	savedItems,
	loading = false,
	editingId,
	savingId,
	deletingId,
	approvingId,
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
	onApprovedAmountChange,
	onApproveRow,
}: ClaimHeadEntryTableProps) => {
	const [pageIndex, setPageIndex] = useState(0);

	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

	const pageCount = Math.max(1, Math.ceil(savedItems.length / pageSize));

	useEffect(() => {
		setPageIndex((current) => Math.min(current, pageCount - 1));
	}, [pageCount]);

	const paginatedItems = useMemo(() => {
		const start = pageIndex * pageSize;

		return savedItems.slice(start, start + pageSize);
	}, [savedItems, pageIndex, pageSize]);

	const handlePageSizeChange = (nextPageSize: number) => {
		setPageSize(nextPageSize);

		setPageIndex(0);
	};
	const toDatePickerValue = (value?: string): Date | undefined => {
		if (!value) return undefined;

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
		const showsApprovalAmounts = actorRole !== "creator";
		const tableColumns: ColumnDef<ClaimHeadRow>[] = [
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
			// {
			// 	accessorKey: "patient",
			// 	header: "Patient",
			// 	cell: ({ row }) => {
			// 		const option = PATIENT_OPTIONS.find(
			// 			(item) => item.value === row.original.patient,
			// 		);

			// 		return option?.label ?? "--";
			// 	},
			// },
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
					const fileName =
						row.original.fileName ?? row.original.file?.name ?? "--";
					const fileUrl = row.original.attachment?.url;

					return fileUrl ? (
						<a
							className="block max-w-52 truncate text-brand underline-offset-2 hover:underline"
							href={fileUrl}
							target="_blank"
							rel="noreferrer"
							title={`Open ${fileName}`}
						>
							{fileName}
						</a>
					) : (
						<span
							className="block max-w-52 truncate text-brand"
							title={fileName}
						>
							{fileName}
						</span>
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
					const isApproving = approvingId === claim.id;
					return (
						<div className="min-w-40">
							<FormInput
								value={claim.approvedAmount || claim.amount}
								inputMode="decimal"
								disabled={
									loading ||
									isApproving ||
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

		if (actorRole === "approver") {
			tableColumns.push({
				id: "approvalAction",
				header: "Action",
				enableSorting: false,
				cell: ({ row }) => {
					const claim = row.original;
					const approved = claim.approvalStatus === "APPROVED";
					const isApproving = approvingId === claim.id;
					return (
						<Button
							type="button"
							text={
								approved ? "Approved" : isApproving ? "Approving..." : "Approve"
							}
							Icon={CheckCircle2}
							appearance="standard"
							variant={approved ? "outline" : "brand"}
							size="sm"
							disabled={
								loading || approved || isApproving || !canApproveLineItems
							}
							onClick={() => void onApproveRow(claim.id)}
							aria-label={
								canApproveLineItems
									? `Approve claim line ${claim.billNumber}`
									: "Line-item approval action is not configured"
							}
						/>
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
		loading,
		onApproveRow,
		onApprovedAmountChange,
		onDeleteRow,
		onEditRow,
		pageIndex,
		pageSize,
	]);

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
								className="grid grid-cols-1 gap-3 items-center bg-page p-4 xl:grid-cols-7"
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

								<div className="flex items-end gap-1.5 sm:mt-5 mt-1">
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
								? 9
								: actorRole === "externalApprover"
									? 8
									: isViewMode
										? 7
										: 8
						}
						showPagination
					/>
				) : (
					<div className="max-h-[500px] min-w-0 overflow-auto scrollbar-sleek px-4">
						<DataTable<ClaimHeadRow>
							data={paginatedItems}
							columns={columns}
							// manualPagination
							// pageIndex={pageIndex}
							// pageSize={pageSize}
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
		</div>
	);
};

export default ClaimHeadEntryTable;
