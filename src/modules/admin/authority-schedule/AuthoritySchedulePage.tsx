// modules/admin/authority-schedule/AuthoritySchedulePage.tsx
//
// Admin screen for the Schedule of Authority (SOA) — lets a MAP admin
// create/edit the AuthorityLimit bands and assign which designations are
// Proposer / Checker / Approver for each band's Tata Hitachi share amount.
// This is the data modules/map/authorityLimit.helper.ts reads to gate EPC
// auto-approval (see epc.controller.ts's finalizeEventProposal).
//
// Checker is editable here even though nothing reads it yet — the schema
// (AuthorityRole.CHECKER) exists for a future requirement, and the admin
// should be able to record it now rather than this screen half-supporting
// the enum.
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RotateCcw, Save } from "lucide-react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import Checkbox from "../../../components/forms/Checkbox";
import FormInput from "../../../components/forms/FormInput";
import MultiSelectInput from "../../../components/forms/MultiSelectInput";
import type { Option } from "../../../components/forms/input.types";
import { useToast } from "../../../context/Auth/AuthContext";
import { useMasterData } from "../../../hooks/useMasterData";

import {
  AUTHORITY_SCHEDULE_QUERY_KEY,
  createAuthorityLimitApi,
  getAuthorityLimitsApi,
  replaceAuthorityLimitAssignmentsApi,
  updateAuthorityLimitApi,
} from "./authoritySchedule.api";
import type { AuthorityLimit, AuthorityRole } from "./authoritySchedule.types";

const ROLE_COLUMNS: { role: AuthorityRole; label: string }[] = [
  { role: "PROPOSER", label: "Proposed By" },
  { role: "CHECKER", label: "Checked By" },
  { role: "APPROVER", label: "Approved By" },
];

type RoleDesignationMap = Record<AuthorityRole, string[]>;

type BandDraft = {
  label: string;
  minAmount: string;
  maxAmount: string; // "" = unbounded
  isActive: boolean;
  roleDesignations: RoleDesignationMap;
};

const emptyRoleMap = (): RoleDesignationMap => ({
  PROPOSER: [],
  CHECKER: [],
  APPROVER: [],
});

const toRoleMap = (limit: AuthorityLimit): RoleDesignationMap => {
  const map = emptyRoleMap();
  for (const assignment of limit.assignments) {
    map[assignment.role] = [...map[assignment.role], assignment.designationId];
  }
  return map;
};

const toDraft = (limit: AuthorityLimit): BandDraft => ({
  label: limit.label,
  minAmount: String(limit.minAmount),
  maxAmount: limit.maxAmount === null ? "" : String(limit.maxAmount),
  isActive: limit.isActive,
  roleDesignations: toRoleMap(limit),
});

const EMPTY_NEW_DRAFT: BandDraft = {
  label: "",
  minAmount: "",
  maxAmount: "",
  isActive: true,
  roleDesignations: emptyRoleMap(),
};

const toAssignmentsPayload = (roleDesignations: RoleDesignationMap) =>
  ROLE_COLUMNS.flatMap(({ role }) =>
    roleDesignations[role].map((designationId) => ({ designationId, role })),
  );

const COLUMN_COUNT = 4 + ROLE_COLUMNS.length + 1;

export default function AuthoritySchedulePage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: masterData } = useMasterData();

  const designationOptions: Option[] = useMemo(
    () =>
      (masterData?.designations ?? []).map((designation) => ({
        value: designation.value,
        label: designation.label,
      })),
    [masterData?.designations],
  );

  const limitsQuery = useQuery({
    queryKey: AUTHORITY_SCHEDULE_QUERY_KEY,
    queryFn: getAuthorityLimitsApi,
  });

  const limits = limitsQuery.data ?? [];

  // Per-row drafts, keyed by band id, plus one for the "add new band" row.
  const [drafts, setDrafts] = useState<Record<string, BandDraft>>({});
  const [newDraft, setNewDraft] = useState<BandDraft>({ ...EMPTY_NEW_DRAFT });
  const [savingId, setSavingId] = useState<string | null>(null);

  // Seeds a row's draft from the server once, the first time it appears.
  // Never overwrites a draft that already exists — that would stomp
  // whatever the admin is mid-edit on every background refetch.
  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };
      for (const limit of limits) {
        if (!next[limit.id]) {
          next[limit.id] = toDraft(limit);
        }
      }
      return next;
    });
  }, [limits]);

  const resetRow = (limit: AuthorityLimit) =>
    setDrafts((current) => ({ ...current, [limit.id]: toDraft(limit) }));

  const updateDraftField = (
    id: string,
    field: "label" | "minAmount" | "maxAmount",
    value: string,
  ) =>
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));

  const updateDraftActive = (id: string, isActive: boolean) =>
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], isActive },
    }));

  const updateDraftRole = (
    id: string,
    role: AuthorityRole,
    selected: Option[],
  ) =>
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        roleDesignations: {
          ...current[id].roleDesignations,
          [role]: selected.map((option) => option.value),
        },
      },
    }));

  const saveMutation = useMutation({
    mutationFn: async ({ id, draft }: { id: string; draft: BandDraft }) => {
      const minAmount = Number(draft.minAmount);
      const maxAmount =
        draft.maxAmount.trim() === "" ? null : Number(draft.maxAmount);

      await updateAuthorityLimitApi(id, {
        label: draft.label.trim(),
        minAmount,
        maxAmount,
        isActive: draft.isActive,
      });

      await replaceAuthorityLimitAssignmentsApi(
        id,
        toAssignmentsPayload(draft.roleDesignations),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: AUTHORITY_SCHEDULE_QUERY_KEY,
      });
      showToast({
        type: "success",
        title: "Saved",
        description: "Band updated.",
      });
    },
    onError: (error: any) => {
      showToast({
        type: "error",
        title: "Could not save",
        description: error?.response?.data?.message ?? "Please try again.",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (draft: BandDraft) => {
      const minAmount = Number(draft.minAmount);
      const maxAmount =
        draft.maxAmount.trim() === "" ? null : Number(draft.maxAmount);

      const created = await createAuthorityLimitApi({
        label: draft.label.trim(),
        minAmount,
        maxAmount,
        isActive: draft.isActive,
      });

      const assignments = toAssignmentsPayload(draft.roleDesignations);
      if (assignments.length) {
        await replaceAuthorityLimitAssignmentsApi(created.id, assignments);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: AUTHORITY_SCHEDULE_QUERY_KEY,
      });
      setNewDraft({ ...EMPTY_NEW_DRAFT });
      showToast({
        type: "success",
        title: "Added",
        description: "New band created.",
      });
    },
    onError: (error: any) => {
      showToast({
        type: "error",
        title: "Could not create band",
        description: error?.response?.data?.message ?? "Please try again.",
      });
    },
  });

  const handleSaveRow = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    try {
      await saveMutation.mutateAsync({ id, draft });
    } finally {
      setSavingId(null);
    }
  };

  const canAddNew =
    newDraft.label.trim() !== "" && newDraft.minAmount.trim() !== "";

  console.log({ canAddNew, newDraft });

  const selectedOptionsFor = (ids: string[]): Option[] =>
    designationOptions.filter((option) => ids.includes(option.value));

  return (
    <Card
      title="Schedule of Authority"
      subtitle="Set the Tata Hitachi share bands and which designations may propose, check, or approve an EPC at each band."
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div className="overflow-x-auto scrollbar-sleek">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                <th className="w-40 px-2 py-2">Label</th>
                <th className="w-32 px-2 py-2">Min Amount</th>
                <th className="w-32 px-2 py-2">Max Amount</th>
                <th className="w-20 px-2 py-2">Active</th>
                {ROLE_COLUMNS.map((column) => (
                  <th key={column.role} className="min-w-[200px] px-2 py-2">
                    {column.label}
                  </th>
                ))}
                <th className="w-28 px-2 py-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {limitsQuery.isLoading ? (
                <tr>
                  <td
                    colSpan={COLUMN_COUNT}
                    className="px-2 py-4 text-[var(--color-text-muted)]"
                  >
                    Loading...
                  </td>
                </tr>
              ) : limits.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMN_COUNT}
                    className="px-2 py-4 text-[var(--color-text-muted)]"
                  >
                    No bands configured yet.
                  </td>
                </tr>
              ) : (
                limits.map((limit) => {
                  const draft = drafts[limit.id] ?? toDraft(limit);
                  const isSaving = savingId === limit.id;

                  return (
                    <tr
                      key={limit.id}
                      className="border-b border-[var(--color-border)] align-top"
                    >
                      <td className="px-2 py-2">
                        <FormInput
                          name={`label-${limit.id}`}
                          value={draft.label}
                          disabled={isSaving}
                          onChange={(event) =>
                            updateDraftField(
                              limit.id,
                              "label",
                              event.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <FormInput
                          type="number"
                          name={`min-${limit.id}`}
                          value={draft.minAmount}
                          disabled={isSaving}
                          onChange={(event) =>
                            updateDraftField(
                              limit.id,
                              "minAmount",
                              event.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <FormInput
                          type="number"
                          name={`max-${limit.id}`}
                          value={draft.maxAmount}
                          placeholder="Unbounded"
                          disabled={isSaving}
                          onChange={(event) =>
                            updateDraftField(
                              limit.id,
                              "maxAmount",
                              event.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Checkbox
                          checked={draft.isActive}
                          disabled={isSaving}
                          onChange={() =>
                            updateDraftActive(limit.id, !draft.isActive)
                          }
                        />
                      </td>
                      {ROLE_COLUMNS.map((column) => (
                        <td key={column.role} className="px-2 py-2">
                          <MultiSelectInput
                            name={`${column.role}-${limit.id}`}
                            options={designationOptions}
                            value={selectedOptionsFor(
                              draft.roleDesignations[column.role],
                            )}
                            isDisabled={isSaving}
                            placeholder="Select designations..."
                            onValueChange={({ value }) =>
                              updateDraftRole(limit.id, column.role, value)
                            }
                          />
                        </td>
                      ))}
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            appearance="icon"
                            variant="outline"
                            Icon={RotateCcw}
                            aria-label="Reset row"
                            disabled={isSaving}
                            onClick={() => resetRow(limit)}
                          />
                          <Button
                            type="button"
                            size="sm"
                            appearance="icon"
                            variant="outline"
                            Icon={Save}
                            aria-label="Save row"
                            disabled={isSaving}
                            onClick={() => void handleSaveRow(limit.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* ── Add new band ─────────────────────────────────────────── */}
              <tr className="align-top">
                <td className="px-2 py-2">
                  <FormInput
                    name="new-label"
                    placeholder="e.g. Limit 1"
                    value={newDraft.label}
                    disabled={createMutation.isPending}
                    onChange={(event) =>
                      setNewDraft((current) => ({
                        ...current,
                        label: event.target.value,
                      }))
                    }
                  />
                </td>
                <td className="px-2 py-2">
                  <FormInput
                    type="number"
                    name="new-min"
                    placeholder="Min"
                    value={newDraft.minAmount}
                    disabled={createMutation.isPending}
                    onChange={(event) =>
                      setNewDraft((current) => ({
                        ...current,
                        minAmount: event.target.value,
                      }))
                    }
                  />
                </td>
                <td className="px-2 py-2">
                  <FormInput
                    type="number"
                    name="new-max"
                    placeholder="Unbounded"
                    value={newDraft.maxAmount}
                    disabled={createMutation.isPending}
                    onChange={(event) =>
                      setNewDraft((current) => ({
                        ...current,
                        maxAmount: event.target.value,
                      }))
                    }
                  />
                </td>
                <td className="px-2 py-2">
                  <Checkbox
                    checked={newDraft.isActive}
                    disabled={createMutation.isPending}
                    onChange={() =>
                      setNewDraft((current) => ({
                        ...current,
                        isActive: !current.isActive,
                      }))
                    }
                  />
                </td>
                {ROLE_COLUMNS.map((column) => (
                  <td key={column.role} className="px-2 py-2">
                    <MultiSelectInput
                      name={`new-${column.role}`}
                      options={designationOptions}
                      value={selectedOptionsFor(
                        newDraft.roleDesignations[column.role],
                      )}
                      isDisabled={createMutation.isPending}
                      placeholder="Select designations..."
                      onValueChange={({ value }) =>
                        setNewDraft((current) => ({
                          ...current,
                          roleDesignations: {
                            ...current.roleDesignations,
                            [column.role]: value.map((option) => option.value),
                          },
                        }))
                      }
                    />
                  </td>
                ))}
                <td className="px-2 py-2">
                  <Button
                    type="button"
                    size="sm"
                    appearance="standard"
                    variant="brand"
                    Icon={Plus}
                    disabled={!canAddNew || createMutation.isPending}
                    onClick={() => void createMutation.mutateAsync(newDraft)}
                  >
                    {createMutation.isPending ? "Adding..." : "Add"}
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-[var(--color-text-muted)]">
          Approver eligibility inherits upward — a designation assigned as
          Approver on a higher band is automatically eligible for every lower
          band too. Proposer and Checker assignments are exact-match only.
        </p>
      </div>
    </Card>
  );
}
