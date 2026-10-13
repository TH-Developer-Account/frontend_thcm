import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";

import Button from "../../../../components/common/Button";
import FormInput from "../../../../components/forms/FormInput";
import SelectInput, {
  type BaseOption,
} from "../../../../components/forms/SelectInput";
import DataTable from "../../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../../components/ui/tables/Skeletons/DataTableSkeleton";

import {
  CONFIG_KEY_TO_FORM_FIELD,
  FIELD_INPUT_KIND,
  FIELD_LABELS,
  orderFields,
} from "../helpers/lead.fieldConfig";
import { getLeadFieldErrorKey } from "../helpers/lead.validation";
import { buildLeadColumns } from "../columns/leadCustomerColumns";

import type {
  LeadFormFieldKey,
  LeadFormRow,
  LeadRow,
  LeadValidationErrors,
  ParticipantType,
  ParticipantStatus,
} from "../types/leads.types";
import {
  PARTICIPANT_STATUS_LABELS,
  PARTICIPANT_TYPE_LABELS,
} from "../types/leads.types";

type LeadEntryTableProps = {
  items: LeadFormRow[];
  savedLeads: LeadRow[];
  fields: LeadFormFieldKey[];
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

const participantTypeOptions: BaseOption[] = Object.entries(
  PARTICIPANT_TYPE_LABELS,
).map(([value, label]) => ({ value, label }));
const participantStatusOptions: BaseOption[] = Object.entries(
  PARTICIPANT_STATUS_LABELS,
).map(([value, label]) => ({ value, label }));

export const LeadEntryTable = ({
  items,
  savedLeads,
  fields,
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
  const orderedFields = useMemo(() => orderFields(fields), [fields]);

  useEffect(() => {
    setPageIndex((currentPageIndex) =>
      Math.min(currentPageIndex, pageCount - 1),
    );
  }, [pageCount]);

  const paginatedLeads = useMemo(() => {
    const startIndex = pageIndex * pageSize;
    return savedLeads.slice(startIndex, startIndex + pageSize);
  }, [pageIndex, pageSize, savedLeads]);

  const columns = useMemo<ColumnDef<LeadRow>[]>(() => {
    const leadColumns = buildLeadColumns(orderedFields);

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
  }, [deletingId, isViewMode, onDeleteLead, onEditLead, orderedFields]);

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPageIndex(0);
  };

  const renderField = (item: LeadFormRow, configKey: LeadFormFieldKey) => {
    const formField = CONFIG_KEY_TO_FORM_FIELD[configKey];
    const label = FIELD_LABELS[configKey];
    const kind = FIELD_INPUT_KIND[configKey];
    const error = errors[getLeadFieldErrorKey(formField, item.id)];
    const value = item[formField] as string;

    if (kind === "select") {
      const options =
        configKey === "participantType"
          ? participantTypeOptions
          : participantStatusOptions;
      const selected = options.find((option) => option.value === value) ?? null;

      return (
        <SelectInput
          key={configKey}
          label={label}
          placeholder={`Select ${label.toLowerCase()}`}
          options={options}
          value={selected}
          onChange={(option) =>
            onChange(
              item.id,
              formField,
              (option as BaseOption | null)?.value ?? "",
            )
          }
          error={error}
        />
      );
    }

    return (
      <FormInput
        key={configKey}
        label={label}
        type={
          kind === "email"
            ? "email"
            : kind === "mobile"
              ? "mobile"
              : kind === "date"
                ? "date"
                : kind === "number"
                  ? "number"
                  : "text"
        }
        min={kind === "number" ? 0 : undefined}
        value={value}
        onChange={(event) => onChange(item.id, formField, event.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
        required={configKey === "name"}
        error={error}
      />
    );
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
                className="flex min-w-0 flex-wrap items-end gap-3 rounded-md p-3"
              >
                {orderedFields.map((configKey) => (
                  <div key={configKey} className="min-w-[200px] flex-1">
                    {renderField(item, configKey)}
                  </div>
                ))}

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
            columns={
              isViewMode ? orderedFields.length : orderedFields.length + 1
            }
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
