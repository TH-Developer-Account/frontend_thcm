import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "../../../../components/ui/PageHeader";
import {
	createEmptyLeadFormRow,
	mapLeadRowToFormRow,
} from "../helpers/lead.mapper";
import {
	buildLeadPayloadItem,
	buildUpdateLeadPayload,
} from "../helpers/lead.payload";
import {
	clearLeadRowErrors,
	validateLeadRow,
} from "../helpers/lead.validation";
import { getStoredLeadInfo } from "../helpers/lead.storage";
import {
	useCreateLeadsMutation,
	useDeleteLeadMutation,
	useUpdateLeadMutation,
	useLeadsImportMutation,
} from "../queries/useLeadMutations";
import { useLeadsByEpcQuery } from "../queries/useLeadQueries";
import type {
	LeadFormRow,
	LeadInfo,
	LeadValidationErrors,
} from "../types/leads.types";
import { LeadEntryTable } from "../components/LeadEntryTable";
import { LeadReferenceSummary } from "../components/LeadReferenceSummary";
import "../styles/leads.css";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import Button from "../../../../components/common/Button";
import { Download, FileUp, Save, X } from "lucide-react";
import { Modal } from "../../../../components/common/Modal";
import { FileUploadField } from "../../../../components/ui/FileUpload/FileUploadField";
import type {
	// FileUploadChangeMeta,
	FileUploadValue,
} from "../../../../components/ui/FileUpload/fileUpload.types";
import { downloadLeadImportTemplate } from "../utils/generateImportTemplate";
import { LeadExcelPreview } from "../components/LeadExcelPreview";
import SectionAccordion from "../../../../components/common/SectionAccordion";
import Card from "../../../../components/common/Card";

export default function LeadCreatePage() {
	const location = useLocation();
	const navigate = useNavigate();
	const routeLeadInfo = location.state?.leadInfo as LeadInfo | undefined;
	const routeMode = location.state?.mode as "create" | "view" | undefined;
	const isViewMode = routeMode === "view";

	const [leadInfo] = React.useState<LeadInfo | null>(
		() => routeLeadInfo || getStoredLeadInfo(),
	);
	const [items, setItems] = React.useState<LeadFormRow[]>(() =>
		routeMode === "view" ? [] : [createEmptyLeadFormRow()],
	);
	const [editingLeadId, setEditingLeadId] = React.useState<string | null>(null);
	const [savingRowId, setSavingRowId] = React.useState<string | null>(null);
	const [deletingId, setDeletingId] = React.useState<string | null>(null);
	const [errors, setErrors] = React.useState<LeadValidationErrors>({});
	const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
	const [importFile, setImportFile] = React.useState<FileUploadValue | null>(
		null,
	);
	const [importFileError, setImportFileError] = React.useState<string>();
	const [isImporting, setIsImporting] = React.useState(false);

	const { data: savedLeads = [], isLoading } = useLeadsByEpcQuery(
		leadInfo?.epcId,
	);
	const epcId = leadInfo?.epcId;
	const createLeadsMutation = useCreateLeadsMutation();
	const updateLeadMutation = useUpdateLeadMutation();
	const deleteLeadMutation = useDeleteLeadMutation();
	const importLeadsMutation = useLeadsImportMutation();

	// const handleAddRow = React.useCallback(() => {
	// 	setItems((prev) => [...prev, createEmptyLeadFormRow()]);
	// }, []);

	// const handleRemoveRow = React.useCallback((rowId: string) => {
	// 	setItems((prev) =>
	// 		prev.length === 1 ? prev : prev.filter((item) => item.id !== rowId),
	// 	);
	// 	setErrors((prev) => clearLeadRowErrors(prev, rowId));
	// }, []);

	const handleChange = React.useCallback(
		(rowId: string, field: keyof Omit<LeadFormRow, "id">, value: string) => {
			setItems((prev) =>
				prev.map((item) =>
					item.id === rowId ? { ...item, [field]: value } : item,
				),
			);
			setErrors((prev) => clearLeadRowErrors(prev, rowId));
		},
		[],
	);

	// const handleReset = React.useCallback(() => {
	// 	setItems([createEmptyLeadFormRow()]);
	// 	setEditingLeadId(null);
	// 	setErrors({});
	// }, []);

	const handleCancelEdit = React.useCallback(() => {
		setEditingLeadId(null);
		setItems([createEmptyLeadFormRow()]);
		setErrors({});
	}, []);

	const handleSaveRow = React.useCallback(
		async (row: LeadFormRow, rowIndex: number) => {
			const rowErrors = validateLeadRow({
				row,
				rowNumber: rowIndex + 1,
				epcId: leadInfo?.epcId,
			});
			if (Object.keys(rowErrors).length > 0 || !leadInfo?.epcId) {
				setErrors((prev) => ({ ...prev, ...rowErrors }));
				return;
			}

			try {
				setSavingRowId(row.id);

				if (editingLeadId) {
					await updateLeadMutation.mutateAsync({
						leadId: editingLeadId,
						payload: buildUpdateLeadPayload(leadInfo.epcId, row),
					});
				} else {
					await createLeadsMutation.mutateAsync({
						epcId: leadInfo.epcId,
						leads: [buildLeadPayloadItem(row)],
					});
				}

				setErrors((prev) => clearLeadRowErrors(prev, row.id));
				setEditingLeadId(null);
				setItems((prev) => {
					const remaining = prev.filter((item) => item.id !== row.id);
					return remaining.length > 0 ? remaining : [createEmptyLeadFormRow()];
				});
			} finally {
				setSavingRowId(null);
			}
		},
		[createLeadsMutation, editingLeadId, leadInfo?.epcId, updateLeadMutation],
	);

	const handleEditLead = React.useCallback(
		(lead: (typeof savedLeads)[number]) => {
			setEditingLeadId(lead.id);
			setItems([mapLeadRowToFormRow(lead)]);
			setErrors({});
		},
		[],
	);

	const handleDeleteLead = React.useCallback(
		async (leadId: string) => {
			try {
				setDeletingId(leadId);
				await deleteLeadMutation.mutateAsync({
					leadId,
					epcId: leadInfo?.epcId,
				});
				if (editingLeadId === leadId) handleCancelEdit();
			} finally {
				setDeletingId(null);
			}
		},
		[deleteLeadMutation, editingLeadId, handleCancelEdit, leadInfo?.epcId],
	);

	const handleOpenImportModal = React.useCallback(() => {
		setImportFileError(undefined);
		setIsImportModalOpen(true);
	}, []);

	const handleCloseImportModal = React.useCallback(() => {
		if (isImporting) return;

		setIsImportModalOpen(false);
		setImportFile(null);
		setImportFileError(undefined);
	}, [isImporting]);

	const handleImportFileChange = React.useCallback(
		(
			value: FileUploadValue | null,
			//  _meta: FileUploadChangeMeta
		) => {
			setImportFile(value);
			setImportFileError(undefined);
		},
		[],
	);

	const handleImportFile = async () => {
		const selectedFile = importFile?.file;
		const epcId = leadInfo?.epcId;

		if (!selectedFile) {
			setImportFileError("Please select an Excel file.");
			return;
		}

		if (!epcId) {
			setImportFileError("EPC reference is missing.");
			return;
		}

		try {
			setIsImporting(true);
			setImportFileError(undefined);

			const formData = new FormData();

			formData.append("file", selectedFile);
			formData.append("epcId", epcId);
			await importLeadsMutation.mutateAsync(formData);

			setIsImportModalOpen(false);
			setImportFile(null);
			navigate("/marketing/activity-planner/file-module/listing");
		} catch {
			setImportFileError(
				"Unable to import the selected file. Please try again.",
			);
		} finally {
			setIsImporting(false);
		}
	};

	if (!epcId) {
		return (
			<PageSectionLayout>
				<PageHeader
					headerText="Leads Entry"
					navigation={{
						variant: "breadcrumbs",
						ariaLabel: "Leads Import/Create",
						breadcrumbs: [
							{
								label: "Home Screen",
								href: "/",
							},
							{
								label: "Leads listing",
								href: "/marketing/activity-planner/leads/listing",
							},
							{ label: "Create lead" },
						],
						separator: "›",
					}}
				/>
				<Card className=" p-5 text-sm text-red-600 text-center">
					EPC reference missing. Please go back to{" "}
					<a href="/marketing/activity-planner/listing" className="underline">
						{" "}
						EPC listing{" "}
					</a>{" "}
					and click create lead again.
				</Card>
			</PageSectionLayout>
		);
	}

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Leads Entry"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Leads Import/Create",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Leads listing",
							href: "/marketing/activity-planner/leads/listing",
						},
						{ label: "Create lead" },
					],
					separator: "›",
				}}
			/>
			<Card
				className="leads-content-box"
				title="Selected EPC Reference"
				actions={
					<>
						<Button
							type="button"
							onClick={downloadLeadImportTemplate}
							size="sm"
							appearance="standard"
							variant="outline"
							Icon={Download}
							text={"Download Template"}
						/>
						{!isViewMode && (
							<div className="flex justify-end">
								<Button
									type="button"
									text="Import"
									Icon={FileUp}
									size="sm"
									appearance="standard"
									variant="brand"
									onClick={handleOpenImportModal}
								/>
							</div>
						)}
					</>
				}
			>
				<div className="leads-section-body">
					<SectionAccordion
						title="Leads Entry"
						className="mt-2 text-right"
						action={
							<p className="leads-reference-label uppercase-label-text">
								Total Leads:{" "}
								<span className="leads-reference-total">
									{savedLeads.length}
								</span>
							</p>
						}
					>
						<LeadReferenceSummary leadInfo={leadInfo} />

						<LeadEntryTable
							items={items}
							savedLeads={savedLeads}
							loading={isLoading}
							editingLeadId={editingLeadId}
							savingRowId={savingRowId}
							deletingId={deletingId}
							errors={errors}
							isViewMode={isViewMode}
							onChange={handleChange}
							onSaveRow={handleSaveRow}
							onEditLead={handleEditLead}
							onCancelEdit={handleCancelEdit}
							onDeleteLead={handleDeleteLead}
						/>
					</SectionAccordion>
				</div>
			</Card>

			<Modal
				open={isImportModalOpen}
				title="Import Leads"
				size="md"
				onClose={handleCloseImportModal}
				footer_actions={
					<>
						<Button
							type="button"
							text="Cancel"
							Icon={X}
							appearance="standard"
							variant="outline"
							size="sm"
							onClick={handleCloseImportModal}
							disabled={isImporting}
						/>
						<Button
							type="button"
							text={isImporting ? "Importing..." : "Save"}
							Icon={Save}
							appearance="standard"
							variant="brand"
							size="sm"
							onClick={handleImportFile}
							disabled={!importFile?.file || isImporting}
						/>
					</>
				}
			>
				<div className="p-5 flex flex-col gap-4">
					{/* Format hint */}
					<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
						<div className="flex items-center justify-between mb-2">
							<p className="text-xs font-medium text-zinc-600 uppercase tracking-wide">
								Expected Format
							</p>
							<Button
								type="button"
								onClick={downloadLeadImportTemplate}
								size="sm"
								appearance="standard"
								variant="outline"
								Icon={Download}
								text={"Download Template"}
							/>
						</div>

						<LeadExcelPreview />
					</div>

					{/* File upload */}
					<FileUploadField
						value={importFile}
						onChange={handleImportFileChange}
						kind="spreadsheet"
						label="Upload Excel File"
						description="Supported formats: XLSX, XLS and CSV"
						required
						error={importFileError}
						disabled={isImporting}
						heightClassName="h-[100px]"
					/>
				</div>
			</Modal>
		</PageSectionLayout>
	);
}
