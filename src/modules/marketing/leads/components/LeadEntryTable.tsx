import { Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";

import Button from "../../../../components/common/Button";
import FormInput from "../../../../components/forms/FormInput";
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

export const LeadEntryTable = ({
	items,
	savedLeads,
	loading = false,
	editingLeadId,
	savingRowId,
	deletingId,
	errors,
	isViewMode,
	onChange,
	onSaveRow,
	onEditLead,
	onCancelEdit,
	onDeleteLead,
}: LeadEntryTableProps) => {
	return (
		<div className="lead-entry-table-shell">
			{errors.form && <p className="lead-entry-error-banner">{errors.form}</p>}

			<div className="lead-entry-table-wrap scrollbar-sleek">
				<table className="lead-entry-table">
					<thead className="lead-entry-table-head">
						<tr>
							<th className="lead-entry-th-sno">S.No</th>
							<th className="lead-entry-th-name">Lead Name</th>
							<th className="lead-entry-th-email">Lead Email</th>
							<th className="lead-entry-th-phone">Phone Number</th>
							<th className="lead-entry-th-notes">Notes</th>
							<th className="lead-entry-th-action">Action</th>
						</tr>
					</thead>

					<tbody className="lead-entry-table-body">
						{!isViewMode &&
							items.map((item, index) => (
								<tr key={item.id} className="lead-entry-row">
									<td className="lead-entry-td-muted">
										{editingLeadId ? "Edit" : index + 1}
									</td>

									<td className="lead-entry-td-field">
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

									<td className="lead-entry-td-field">
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

									<td className="lead-entry-td-field">
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

									<td className="lead-entry-td-field">
										<FormInput
											value={item.notes}
											disabled={isViewMode}
											onChange={(event) =>
												onChange(item.id, "notes", event.target.value)
											}
											placeholder="Enter remarks"
										/>
									</td>

									<td className="lead-entry-action-cell">
										<div className="lead-entry-action-group">
											<Button
												type="button"
												Icon={editingLeadId ? Save : Plus}
												appearance="icon"
												variant="outline"
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
												appearance="icon"
												variant="outline"
												size="sm"
												disabled={savingRowId === item.id}
												onClick={onCancelEdit}
												aria-label="Cancel edit"
											/>
										</div>
									</td>
								</tr>
							))}

						{loading ? (
							<tr>
								<td colSpan={6} className="lead-entry-empty-cell">
									Loading leads...
								</td>
							</tr>
						) : savedLeads.length > 0 ? (
							savedLeads.map((lead, index) => (
								<tr key={lead.id} className="lead-entry-row">
									<td className="lead-entry-td-muted">
										{items.length + index + 1}
									</td>

									<td className="lead-entry-td-value" title={lead.name || "--"}>
										{lead.name || "--"}
									</td>

									<td className="lead-entry-td-text" title={lead.email || "--"}>
										{lead.email || "--"}
									</td>

									<td className="lead-entry-td-text" title={lead.phone || "--"}>
										{lead.phone || "--"}
									</td>

									<td
										className="lead-entry-td-notes"
										title={lead.notes || "--"}
									>
										{lead.notes || "--"}
									</td>

									<td className="lead-entry-action-cell">
										<div className="lead-entry-action-group">
											<Button
												type="button"
												Icon={Pencil}
												appearance="icon"
												variant="outline"
												size="sm"
												onClick={() => onEditLead(lead)}
												aria-label="Edit lead"
											/>

											<Button
												type="button"
												Icon={Trash2}
												appearance="icon"
												variant="outline"
												size="sm"
												onClick={() => onDeleteLead(lead.id)}
												disabled={deletingId === lead.id}
												aria-label="Remove customer"
											/>
										</div>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={6} className="lead-entry-empty-cell">
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
