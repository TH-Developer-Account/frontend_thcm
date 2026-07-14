import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";

import Button from "../../../../components/common/Button";
import FormInput from "../../../../components/forms/FormInput";
import DataTable from "../../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../../components/ui/tables/Skeletons/DataTableSkeleton";

import type {
	LeadFormRow,
	LeadRow,
	LeadValidationErrors,
} from "../types/leads.types";

type LeadEntryTableProps = {
	items: LeadFormRow[];
	savedLeads: LeadRow[];
	loading?: boolean;
	editingLeadId?: string | null;
	savingRowId?: string | null;
	deletingId?: string | null;
	isViewMode?: boolean;
	errors: LeadValidationErrors;
	onChange: (
		rowId: string,
		field: keyof Omit<LeadFormRow, "id">,
		value: string,
	) => void;
	onSaveRow: (row: LeadFormRow, rowIndex: number) => void;
	onEditLead: (lead: LeadRow) => void;
	onCancelEdit: () => void;
	onDeleteLead: (leadId: string) => void;
};

const DEFAULT_PAGE_SIZE = 5;
const SKELETON_ROWS = 5;

export const LeadEntryTable = ({
	items,
	savedLeads,
	loading = false,
	editingLeadId,
	savingRowId,
	deletingId,
	errors,
	isViewMode = false,
	onChange,
	onSaveRow,
	onEditLead,
	onCancelEdit,
	onDeleteLead,
}: LeadEntryTableProps) => {
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

	const pageCount = Math.max(1, Math.ceil(savedLeads.length / pageSize));

	useEffect(() => {
		setPageIndex((currentPageIndex) =>
			Math.min(currentPageIndex, pageCount - 1),
		);
	}, [pageCount]);

	const paginatedLeads = useMemo(() => {
		const startIndex = pageIndex * pageSize;
		const endIndex = startIndex + pageSize;

		return savedLeads.slice(startIndex, endIndex);
	}, [pageIndex, pageSize, savedLeads]);

	const columns = useMemo<ColumnDef<LeadRow>[]>(() => {
		const leadColumns: ColumnDef<LeadRow>[] = [
			{
				id: "serialNumber",
				header: "S.No",
				enableSorting: false,
				cell: ({ row }) => pageIndex * pageSize + row.index + 1,
			},
			{
				accessorKey: "name",
				header: "Lead Name",
				cell: ({ row }) => {
					const value = row.original.name || "--";

					return (
						<span className="block max-w-52 truncate font-medium" title={value}>
							{value}
						</span>
					);
				},
			},
			{
				accessorKey: "email",
				header: "Lead Email",
				cell: ({ row }) => {
					const value = row.original.email || "--";

					return (
						<span className="block max-w-60 truncate" title={value}>
							{value}
						</span>
					);
				},
			},
			{
				accessorKey: "phone",
				header: "Phone Number",
				cell: ({ row }) => (
					<span className="whitespace-nowrap">
						{row.original.phone || "--"}
					</span>
				),
			},
			{
				accessorKey: "notes",
				header: "Notes",
				cell: ({ row }) => {
					const value = row.original.notes || "--";

					return (
						<span className="block max-w-72 truncate" title={value}>
							{value}
						</span>
					);
				},
			},
		];

		if (!isViewMode) {
			leadColumns.push({
				id: "actions",
				header: "Actions",
				enableSorting: false,
				cell: ({ row }) => {
					const lead = row.original;
					const isDeleting = deletingId === lead.id;

					return (
						<div className="flex items-center gap-1.5">
							<Button
								type="button"
								Icon={Pencil}
								appearance="icon"
								variant="outline"
								size="sm"
								onClick={() => onEditLead(lead)}
								aria-label={`Edit ${lead.name || "lead"}`}
							/>

							<Button
								type="button"
								Icon={Trash2}
								appearance="icon"
								variant="outline"
								size="sm"
								disabled={isDeleting}
								onClick={() => onDeleteLead(lead.id)}
								aria-label={`Remove ${lead.name || "lead"}`}
							/>
						</div>
					);
				},
			});
		}

		return leadColumns;
	}, [deletingId, isViewMode, onDeleteLead, onEditLead, pageIndex, pageSize]);

	const handlePageSizeChange = (nextPageSize: number) => {
		setPageSize(nextPageSize);
		setPageIndex(0);
	};

	return (
		<div className="flex min-w-0 flex-col gap-4">
			{errors.form ? (
				<p className="lead-entry-error-banner" role="alert">
					{errors.form}
				</p>
			) : null}

			{!isViewMode
				? items.map((item, index) => {
						const isSaving = savingRowId === item.id;

						return (
							<div
								key={item.id}
								className="grid min-w-0 grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2 xl:grid-cols-[1.1fr_1.2fr_1fr_1.2fr_auto]"
							>
								<FormInput
									value={item.leadName}
									onChange={(event) =>
										onChange(item.id, "leadName", event.target.value)
									}
									placeholder="Enter lead name"
									required
									error={errors[`leadName-${item.id}`]}
								/>

								<FormInput
									value={item.leadEmail}
									type="email"
									onChange={(event) =>
										onChange(item.id, "leadEmail", event.target.value)
									}
									placeholder="Enter email"
									error={errors[`leadEmail-${item.id}`]}
								/>

								<FormInput
									type="mobile"
									value={item.leadPhoneNumber}
									onChange={(event) =>
										onChange(item.id, "leadPhoneNumber", event.target.value)
									}
									placeholder="Enter phone number"
									error={errors[`leadPhoneNumber-${item.id}`]}
								/>

								<FormInput
									value={item.notes}
									onChange={(event) =>
										onChange(item.id, "notes", event.target.value)
									}
									placeholder="Enter remarks"
								/>

								<div className="flex items-end gap-1.5">
									<Button
										type="button"
										Icon={editingLeadId ? Save : Plus}
										appearance="icon"
										variant="outline"
										size="sm"
										disabled={isSaving}
										onClick={() => onSaveRow(item, index)}
										aria-label={editingLeadId ? "Update lead" : "Add lead"}
									/>

									<Button
										type="button"
										Icon={RotateCcw}
										appearance="icon"
										variant="outline"
										size="sm"
										disabled={isSaving}
										onClick={onCancelEdit}
										aria-label={
											editingLeadId ? "Cancel edit" : "Reset lead form"
										}
									/>
								</div>
							</div>
						);
					})
				: null}

			<section className="min-w-0" aria-label="Saved leads" aria-busy={loading}>
				{loading ? (
					<DataTableSkeleton
						rows={SKELETON_ROWS}
						columns={isViewMode ? 5 : 6}
						showPagination
					/>
				) : (
					<div className="max-h-[420px] min-w-0 overflow-auto scrollbar-sleek">
						<DataTable<LeadRow>
							data={paginatedLeads}
							columns={columns}
							manualPagination
							pageIndex={pageIndex}
							pageSize={pageSize}
							pageCount={pageCount}
							onPageChange={setPageIndex}
							onPageSizeChange={handlePageSizeChange}
							scrollTargetId="saved-leads-table-scroll"
							emptyTitle="No leads added yet"
							emptyDescription={
								isViewMode
									? "No leads are available for this EPC."
									: "Add a lead manually or import leads using the Excel template."
							}
						/>
					</div>
				)}
			</section>
		</div>
	);
};
