import { Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import Button from "../../../../../components/common/Button";
import FormInput from "../../../../../components/forms/FormInput";
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
	// onAddRow: () => void;
	// onRemoveRow: (rowId: string) => void;
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

export const LeadEntryTable = ({
	items,
	savedLeads,
	loading = false,
	editingLeadId,
	savingRowId,
	deletingId,
	errors,
	isViewMode,
	// onAddRow,
	// onRemoveRow,
	onChange,
	onSaveRow,
	onEditLead,
	onCancelEdit,
	onDeleteLead,
}: LeadEntryTableProps) => {
	return (
		<div>
			{/*<div className="leads-table-toolbar">
				 <div>
					<h3 className="leads-table-title">Lead Items</h3>
					<p className="leads-table-subtitle">
						Add all lead details for this selected EPC. Each row is saved
						individually.
					</p>
				</div> */}

			{/* {!editingLeadId && !isViewMode && (
					<Button
						type="button"
						text="Add Customer"
						Icon={Plus}
						status="outline"
						size="sm"
						onClick={onAddRow}
					/>
				)} 
			</div>*/}

			{errors.form && <p className="leads-error-banner">{errors.form}</p>}

			<div className="leads-table-wrap">
				<table className="leads-table">
					<thead className="leads-table-head">
						<tr>
							<th className="leads-th-sno">S.No</th>
							<th className="leads-th">Lead Name</th>
							<th className="leads-th">Lead Email</th>
							<th className="leads-th">Phone Number</th>
							<th className="leads-th">Notes</th>
							<th className="leads-th-action">Action</th>
						</tr>
					</thead>

					<tbody className="leads-tbody scrollbar-sleek">
						{!isViewMode &&
							items.map((item, index) => (
								<tr key={item.id} className="leads-row">
									<td className="leads-td-muted">
										{editingLeadId ? "Edit" : index + 1}
									</td>
									<td className="leads-td">
										<FormInput
											value={item.leadName}
											onChange={(event) =>
												onChange(item.id, "leadName", event.target.value)
											}
											placeholder="Enter lead name"
											disabled={isViewMode}
											required
											error={errors[`leadName-${item.id}`]}
										/>
									</td>
									<td className="leads-td">
										<FormInput
											value={item.leadEmail}
											type="email"
											disabled={isViewMode}
											onChange={(event) =>
												onChange(item.id, "leadEmail", event.target.value)
											}
											placeholder="Enter email"
											error={errors[`leadEmail-${item.id}`]}
										/>
									</td>
									<td className="leads-td">
										<FormInput
											type="mobile"
											value={item.leadPhoneNumber}
											disabled={isViewMode}
											onChange={(event) =>
												onChange(item.id, "leadPhoneNumber", event.target.value)
											}
											placeholder="Enter phone number"
											error={errors[`leadPhoneNumber-${item.id}`]}
										/>
									</td>
									<td className="leads-td">
										<FormInput
											value={item.notes}
											disabled={isViewMode}
											onChange={(event) =>
												onChange(item.id, "notes", event.target.value)
											}
											placeholder="Enter remarks"
										/>
									</td>
									<td className="leads-action-cell">
										{!isViewMode && (
											<div className="leads-action-group">
												<Button
													type="button"
													Icon={editingLeadId ? Save : Plus}
													status="outline"
													size="sm"
													disabled={savingRowId === item.id}
													onClick={() => onSaveRow(item, index)}
													aria-label={
														editingLeadId ? "Update lead" : "Add customer"
													}
												/>

												<Button
													type="button"
													Icon={RotateCcw}
													status="outline"
													size="sm"
													disabled={savingRowId === item.id}
													onClick={onCancelEdit}
													aria-label="Cancel edit"
												/>
											</div>
										)}
									</td>
								</tr>
							))}

						{loading ? (
							<tr>
								<td colSpan={6} className="leads-empty-cell">
									Loading leads...
								</td>
							</tr>
						) : savedLeads.length > 0 ? (
							savedLeads.map((lead, index) => (
								<tr key={lead.id} className="leads-row">
									<td className="leads-td-muted">{items.length + index + 1}</td>
									<td className="leads-td-value">{lead.name || "--"}</td>
									<td className="leads-td-text">{lead.email || "--"}</td>
									<td className="leads-td-text">{lead.phone || "--"}</td>
									<td className="leads-td-notes">{lead.notes || "--"}</td>
									<td className="leads-action-cell">
										<div className="leads-action-group">
											<Button
												type="button"
												Icon={Pencil}
												status="outline"
												size="sm"
												onClick={() => onEditLead(lead)}
												aria-label="Edit lead"
											/>
											<Button
												Icon={Trash2}
												iconSize="14"
												type="button"
												onClick={() => onDeleteLead(lead.id)}
												disabled={deletingId === lead.id}
												aria-label="Remove customer"
												status="outline"
											/>
										</div>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={6} className="leads-empty-cell">
									No leads added yet.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};
