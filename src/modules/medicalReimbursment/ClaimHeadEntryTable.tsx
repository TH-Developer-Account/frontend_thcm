import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";

import Button from "../../components/common/Button";
import FormInput from "../../components/forms/FormInput";
import SelectInput from "../../components/forms/SelectInput";

import DataTable from "../..//components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../components/ui/tables/Skeletons/DataTableSkeleton";

import { CLAIM_HEAD_OPTIONS, PATIENT_OPTIONS } from "./claimHead.constants";

import type {
	ClaimHeadFormRow,
	ClaimHeadRow,
	ClaimHeadValidationErrors,
	ClaimHead,
} from "./reimbursementClaim.types";

type ClaimHeadEntryTableProps = {
	items: ClaimHeadFormRow[];

	savedItems: ClaimHeadRow[];

	loading?: boolean;

	editingId?: string | null;

	savingId?: string | null;

	deletingId?: string | null;

	isViewMode?: boolean;

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
	isViewMode = false,
	errors,
	onChange,
	onSaveRow,
	onEditRow,
	onCancelEdit,
	onDeleteRow,
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

	const columns = useMemo<ColumnDef<ClaimHeadRow>[]>(() => {
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
				header: "Bill Name",
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
				accessorKey: "patient",
				header: "Patient",
				cell: ({ row }) => {
					const option = PATIENT_OPTIONS.find(
						(item) => item.value === row.original.patient,
					);

					return option?.label ?? "--";
				},
			},
			{
				accessorKey: "billDate",
				header: "Bill Date",
				cell: ({ row }) => (
					<span className="whitespace-nowrap">
						{row.original.billDate || "--"}
					</span>
				),
			},
			{
				accessorKey: "amount",
				header: "Amount",
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

					return (
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

		if (!isViewMode) {
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
	}, [pageIndex, pageSize, deletingId, isViewMode, onDeleteRow, onEditRow]);

	return (
		<div className="flex flex-col gap-4">
			{errors.form ? (
				<p className="lead-entry-error-banner" role="alert">
					{errors.form}
				</p>
			) : null}

			{!isViewMode
				? items.map((item, index) => {
						const isSaving = savingId === item.id;

						return (
							<div
								key={item.id}
								className="grid grid-cols-1 gap-3 items-center bg-page p-4 xl:grid-cols-7"
							>
								<SelectInput
									placeholder="Claim Head"
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
									placeholder="Bill Number"
									onChange={(event) =>
										onChange(item.id, "billNumber", event.target.value)
									}
									error={errors[`billNumber-${item.id}`]}
								/>

								<FormInput
									value={item.billName}
									placeholder="Bill Name"
									onChange={(event) =>
										onChange(item.id, "billName", event.target.value)
									}
									error={errors[`billName-${item.id}`]}
								/>

								{/* <SelectInput
									placeholder="Patient"
									options={PATIENT_OPTIONS}
									value={
										PATIENT_OPTIONS.find(
											(option) => option.value === item.patient,
										) ?? null
									}
									onChange={(option) =>
										onChange(item.id, "patient", option?.value ?? "")
									}
									error={errors[`patient-${item.id}`]}
								/> */}

								<FormInput
									type="date"
									value={item.billDate}
									onChange={(event) =>
										onChange(item.id, "billDate", event.target.value)
									}
									error={errors[`billDate-${item.id}`]}
								/>

								<FormInput
									value={item.amount}
									inputMode="decimal"
									placeholder="0.00"
									onChange={(event) =>
										onChange(item.id, "amount", event.target.value)
									}
									error={errors[`amount-${item.id}`]}
								/>

								<div className="min-w-0">
									<input
										id={`attachment-${item.id}`}
										type="file"
										className="sr-only"
										accept=".pdf,.png,.jpg,.jpeg"
										onChange={(event) =>
											onChange(item.id, "file", event.target.files?.[0] ?? null)
										}
									/>

									<label
										htmlFor={`attachment-${item.id}`}
										className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm hover:border-brand"
									>
										<Upload size={16} />

										<span className="truncate" title={item.file?.name}>
											{item.file?.name ?? "Upload Attachment"}
										</span>
									</label>

									{errors[`file-${item.id}`] && (
										<p className="mt-1 text-xs text-rejected">
											{errors[`file-${item.id}`]}
										</p>
									)}
								</div>

								<div className="flex items-end gap-1.5">
									<Button
										type="button"
										Icon={editingId ? Save : Plus}
										appearance="icon"
										variant="outline"
										size="sm"
										disabled={isSaving}
										onClick={() => onSaveRow(item, index)}
										aria-label={editingId ? "Update Claim" : "Add Claim"}
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
						columns={isViewMode ? 8 : 9}
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
