// forms/EPC/EpcFormFields.tsx
// EPC field grid shared by create, edit and view.
//
// mode="edit" (default) → interactive inputs, unchanged from before.
// mode="view"           → same layout, every field rendered read-only via the
//                         shared FormInput/SelectInput/TextareaInput `mode="view"`
//                         (ReadOnlyField), matching the vendor onboarding forms.
//
// DatePickerInput and PincodeAsyncSelect have no view mode, so in view mode
// they're swapped for ReadOnlyField directly.
//
// Zone ⇄ Branch are linked in both directions:
//   - choosing a Zone limits the Branch list to that zone's branches
//     (and clears the Branch if it doesn't belong to the new zone);
//   - choosing a Branch sets its Zone automatically.
import React from "react";
import type { SingleValue } from "react-select";

import FormInput from "../../../../../components/forms/FormInput";
import SelectInput from "../../../../../components/forms/SelectInput";
import TextareaInput from "../../../../../components/forms/TextareaInput";
import ReadOnlyField from "../../../../../components/forms/ReadOnlyField";
import type { FormFieldMode } from "../../../../../components/forms/input.types";
import DatePickerInput from "../../../../../components/common/DatePickerInput";
import PincodeAsyncSelect, {
  type PincodeOption,
} from "../../../../../components/forms/PincodeAsyncSelect";

import {
  formatDateOnly,
  parseDateOnly,
  toDateRange,
} from "../../../../../utils/format";
import {
  findOption,
  formatEventDateRange,
  getEventDateHelperText,
  getEventDateLabel,
  getOptionCode,
  resolveEventDateMode,
  type EpcOption as Option,
} from "./epc.utils";
import type { EpcFormValues } from "../../types/epc.types";
import type { ProfileLocked } from "./useEpcForm";
import { getZoneCodeForBranch, getZoneCodeForBudget } from "./epc.zonemap";

type EpcMasters = {
  regions?: Option[];
  branches?: Option[];
  departments?: Option[];
  vertical?: Option[];
  eventNames?: Option[];
  budgetMasters?: Option[];
};

/**
 * Display labels used in view mode when the matching master option can't be
 * found (masters still loading, inactive master, branch filtered out, etc.).
 * Taken straight from the EPC detail response relations.
 */
export type EpcReadOnlyLabels = Partial<{
  region: string;
  branch: string;
  department: string;
  vertical: string;
  eventName: string;
  budgetCode: string;
  budgetDescription: string;
}>;

type EpcFormFieldsProps = {
  values: EpcFormValues;
  errors?: Partial<Record<keyof EpcFormValues, string>>;
  masters?: EpcMasters;
  /** Not needed in view mode. */
  onChange?: (name: keyof EpcFormValues, value: string) => void;
  lockOrgFields?: boolean;
  mode?: FormFieldMode;
  readOnlyLabels?: EpcReadOnlyLabels;
  /** Fields filled from the user's profile — rendered read-only. */
  profileLocked?: ProfileLocked;
};

/**
 * false → once a zone is chosen, Budget Description lists ONLY that zone's
 * budget. true → head-office budgets (Retainers, Digital Marketing, …) are
 * listed alongside it.
 */
const SHOW_GENERAL_BUDGETS_WITH_ZONE = true;

const EMPTY_ERRORS: Partial<Record<keyof EpcFormValues, string>> = {};
const EMPTY_LOCKED: ProfileLocked = {};

export default function EpcFormFields({
  values,
  errors = EMPTY_ERRORS,
  masters,
  onChange,
  lockOrgFields = false,
  mode = "edit",
  readOnlyLabels,
  profileLocked = EMPTY_LOCKED,
}: EpcFormFieldsProps) {
  const isView = mode === "view";

  // Helper texts describe how to fill a field — irrelevant when read-only.
  const helper = (text: string) => (isView ? undefined : text);
  const emit = (name: keyof EpcFormValues, value: string) =>
    onChange?.(name, value);

  // Zone / Branch / Department are read-only when the EPC already exists or
  // when they were filled from the user's profile. They render as plain
  // values (not disabled dropdowns); a field the profile couldn't supply
  // stays an editable dropdown.
  type LockableField = "region" | "branch" | "department";

  const isLocked = (field: LockableField) =>
    lockOrgFields || Boolean(profileLocked[field]);

  const lockableMode = (field: LockableField): FormFieldMode =>
    isView || isLocked(field) ? "view" : mode;

  const lockableHelper = (field: LockableField, label: string, hint: string) =>
    helper(
      lockOrgFields
        ? `${label} cannot be changed after EPC creation`
        : profileLocked[field]
          ? `${label} is set from your profile`
          : hint,
    );

  const selectedDepartment = values.department || "";

  // Single-date vs From–To picker, driven by the chosen event name.
  const eventDateMode = React.useMemo(
    () =>
      resolveEventDateMode(
        masters?.eventNames,
        values.event_name,
        readOnlyLabels?.eventName,
      ),
    [masters?.eventNames, values.event_name, readOnlyLabels?.eventName],
  );
  const isSingleDate = eventDateMode === "single";

  /**
   * The zone (region option `value`) a branch belongs to.
   *
   * 1. Uses a region id supplied by the API on the branch, if there is one.
   * 2. Otherwise falls back to the code-based map in zoneBranchMap.ts
   *    (the master-data endpoint doesn't link branches to regions yet).
   *
   * Returns null for a branch that isn't mapped to any zone.
   */
  const resolveBranchRegionId = React.useCallback(
    (branch: Option): string | null => {
      const direct =
        branch.regionId ??
        branch.region_id ??
        branch.zoneId ??
        branch.zone_id ??
        (typeof branch.region === "string" ? branch.region : undefined);

      if (direct) {
        return findOption(masters?.regions, String(direct))?.value ?? null;
      }

      const zoneCode = getZoneCodeForBranch(getOptionCode(branch));
      if (!zoneCode) return null;

      return (
        (masters?.regions ?? []).find(
          (region) => getOptionCode(region) === zoneCode,
        )?.value ?? null
      );
    },
    [masters?.regions],
  );

  // Normalise whatever is stored in values.region (id, code or label) to the
  // region option's `value`, so it can be compared with resolveBranchRegionId.
  const selectedRegionId = React.useMemo(
    () => findOption(masters?.regions, values.region)?.value ?? "",
    [masters?.regions, values.region],
  );

  const filteredBranches = React.useMemo(() => {
    const branches = masters?.branches ?? [];

    // No zone chosen yet → every branch is selectable (picking one sets the zone).
    if (!selectedRegionId) return branches;

    return branches.filter(
      (branch) => resolveBranchRegionId(branch) === selectedRegionId,
    );
  }, [masters?.branches, selectedRegionId, resolveBranchRegionId]);

  const filteredVerticals = React.useMemo(() => {
    const verticals = masters?.vertical ?? [];

    if (!selectedDepartment) return verticals;

    return verticals.filter((vertical) => {
      const departmentValue =
        vertical.department ?? vertical.departmentId ?? vertical.department_id;

      if (!departmentValue) return true;

      return departmentValue === selectedDepartment;
    });
  }, [selectedDepartment, masters?.vertical]);

  const budgetCodeOptions = React.useMemo<Option[]>(() => {
    return (masters?.budgetMasters ?? []).map((budget) => ({
      ...budget,
      value: budget.value,
      label: budget.code || budget.label || budget.value,
    }));
  }, [masters?.budgetMasters]);

  /** Zone (region option `value`) a budget belongs to; null = head-office budget. */
  const resolveBudgetRegionId = React.useCallback(
    (budget: Option): string | null => {
      const zoneCode = getZoneCodeForBudget(budget.description ?? budget.label);
      if (!zoneCode) return null;

      return (
        (masters?.regions ?? []).find(
          (region) => getOptionCode(region) === zoneCode,
        )?.value ?? null
      );
    },
    [masters?.regions],
  );

  // With a zone chosen: only that zone's budget (head-office budgets too if
  // SHOW_GENERAL_BUDGETS_WITH_ZONE). No zone chosen: everything (picking a
  // zone budget sets the zone).
  const budgetDescriptionOptions = React.useMemo<Option[]>(() => {
    return (masters?.budgetMasters ?? [])
      .filter((budget) => {
        if (!selectedRegionId) return true;

        const budgetRegionId = resolveBudgetRegionId(budget);
        if (!budgetRegionId) return SHOW_GENERAL_BUDGETS_WITH_ZONE;
        return budgetRegionId === selectedRegionId;
      })
      .map((budget) => ({
        ...budget,
        value: budget.value,
        label:
          budget.description || budget.label || budget.code || budget.value,
      }));
  }, [masters?.budgetMasters, selectedRegionId, resolveBudgetRegionId]);

  const selectedBudgetCode = React.useMemo(() => {
    return findOption(budgetCodeOptions, values.budget_master_id);
  }, [budgetCodeOptions, values.budget_master_id]);

  const selectedBudgetDescription = React.useMemo(() => {
    return findOption(
      (masters?.budgetMasters ?? []).map((budget) => ({
        ...budget,
        label:
          budget.description || budget.label || budget.code || budget.value,
      })),
      values.budget_master_id,
    );
  }, [masters?.budgetMasters, values.budget_master_id]);

  /** Clear the budget if it doesn't fit the zone (head-office budgets stay only if allowed). */
  const clearBudgetIfOutsideZone = (regionId: string) => {
    const currentBudget = findOption(
      masters?.budgetMasters,
      values.budget_master_id,
    );
    if (!currentBudget) return;

    const budgetRegionId = resolveBudgetRegionId(currentBudget);
    const outsideZone = budgetRegionId
      ? budgetRegionId !== regionId
      : !SHOW_GENERAL_BUDGETS_WITH_ZONE;

    if (outsideZone) {
      emit("budget_master_id", "");
      emit("budgetDescription", "");
    }
  };

  /** Zone → Branch + Budget: keep the current branch / budget only if they fit the new zone. */
  const handleRegionChange = (option: SingleValue<Option>) => {
    const regionId = option?.value || "";

    emit("region", regionId);
    if (regionId) clearBudgetIfOutsideZone(regionId);

    const currentBranch = findOption(masters?.branches, values.branch);
    const branchStillValid =
      Boolean(regionId) &&
      Boolean(currentBranch) &&
      resolveBranchRegionId(currentBranch as Option) === regionId;

    if (!branchStillValid) {
      emit("branch", "");
    }
  };

  /** Branch → Zone: selecting a branch sets the zone it belongs to. */
  const handleBranchChange = (option: SingleValue<Option>) => {
    const branchId = option?.value || "";

    if (option) {
      const branchRegionId = resolveBranchRegionId(option);

      // Emit zone first so the EPC No is regenerated once both are set.
      if (branchRegionId && branchRegionId !== selectedRegionId) {
        emit("region", branchRegionId);
        clearBudgetIfOutsideZone(branchRegionId);
      }
    }

    emit("branch", branchId);
  };

  const handleDepartmentChange = (option: SingleValue<Option>) => {
    const departmentId = option?.value || "";

    emit("department", departmentId);
    emit("vertical", "");
  };

  const handleBudgetChange = (option: SingleValue<Option>) => {
    const budgetMasterId = option?.value || "";

    const selectedMaster = findOption(
      masters?.budgetMasters ?? [],
      budgetMasterId,
    );

    // A zone budget (North 1, South 2, …) also sets its zone; the branch is
    // cleared if it doesn't belong to that zone. Head-office budgets leave
    // the zone alone.
    const budgetRegionId = selectedMaster
      ? resolveBudgetRegionId(selectedMaster)
      : null;

    if (budgetRegionId && budgetRegionId !== selectedRegionId) {
      emit("region", budgetRegionId);

      const currentBranch = findOption(masters?.branches, values.branch);
      if (
        currentBranch &&
        resolveBranchRegionId(currentBranch) !== budgetRegionId
      ) {
        emit("branch", "");
      }
    }

    emit("budget_master_id", budgetMasterId);
    emit(
      "budgetDescription",
      selectedMaster?.description || selectedMaster?.label || "",
    );
  };

  const handleEventDateChange = (value: unknown) => {
    // Single mode → picker returns a Date; mirror it into both fields.
    if (value instanceof Date) {
      const iso = formatDateOnly(value);
      emit("event_from_date", iso);
      emit("event_to_date", iso);
      return;
    }

    if (value && typeof value === "object" && "from" in value) {
      const range = value as { from?: Date; to?: Date };

      emit("event_from_date", range.from ? formatDateOnly(range.from) : "");
      emit("event_to_date", range.to ? formatDateOnly(range.to) : "");
      return;
    }

    emit("event_from_date", "");
    emit("event_to_date", "");
  };

  const handleEventNameChange = (option: SingleValue<Option>) => {
    emit("event_name", option?.value || "");

    // Range → single: collapse to the start date so no stale "to" date remains.
    const nextMode = resolveEventDateMode(
      masters?.eventNames,
      option?.value,
      option?.label,
    );
    if (nextMode === "single" && values.event_from_date) {
      emit("event_to_date", values.event_from_date);
    }
  };

  const buildPincodeOptionFromValues = (
    values: EpcFormValues,
  ): PincodeOption | null => {
    if (!values.location || !values.locationMeta) return null;

    return {
      value: values.locationMeta.pincode,
      label: values.location,
      pincode: values.locationMeta.pincode,
      officeName: values.locationMeta.officeName,
      district: values.locationMeta.district,
      stateName: values.locationMeta.stateName,
      latitude: values.locationMeta.latitude ?? null,
      longitude: values.locationMeta.longitude ?? null,
    };
  };

  const selectedPincode = React.useMemo(
    () => buildPincodeOptionFromValues(values),
    [values],
  );

  const handlePincodeChange = (option: PincodeOption | null) => {
    if (!option) {
      emit("location", "");
      onChange?.("locationMeta", null as any);
      return;
    }

    emit("location", option.label);
    onChange?.("locationMeta", {
      pincode: option.pincode,
      officeName: option.officeName,
      district: option.district,
      stateName: option.stateName,
      latitude: option.latitude,
      longitude: option.longitude,
    } as any);
  };

  return (
    <form noValidate onSubmit={(event) => event.preventDefault()}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FormInput
          mode={mode}
          name="epfNo"
          label="EPC No"
          value={values.epfNo || values.proposal_number || ""}
          disabled
          className="w-full p-2 text-black"
          helperText={helper("EPC No. auto generated")}
        />

        <SelectInput
          mode={lockableMode("region")}
          name="region"
          label="Zone"
          value={findOption(masters?.regions ?? [], values.region)}
          readOnlyValue={readOnlyLabels?.region}
          options={masters?.regions || []}
          onChange={handleRegionChange}
          required
          helperText={lockableHelper(
            "region",
            "Zone",
            "Select zone to auto populate branches",
          )}
          error={errors.region}
          className="w-full"
        />

        <SelectInput
          mode={lockableMode("branch")}
          name="branch"
          label="Branch"
          options={filteredBranches}
          value={findOption(masters?.branches ?? [], values.branch)}
          readOnlyValue={readOnlyLabels?.branch}
          onChange={handleBranchChange}
          required
          helperText={lockableHelper(
            "branch",
            "Branch",
            "Branches are filtered by zone; selecting a branch sets its zone",
          )}
          error={errors.branch}
          className="w-full"
        />

        <SelectInput
          mode={lockableMode("department")}
          name="department"
          label="Department"
          value={findOption(masters?.departments ?? [], values.department)}
          readOnlyValue={readOnlyLabels?.department}
          options={masters?.departments || []}
          onChange={handleDepartmentChange}
          required
          helperText={lockableHelper(
            "department",
            "Department",
            "Select department to auto populate verticals",
          )}
          error={errors.department}
          className="w-full"
        />

        <SelectInput
          mode={mode}
          name="vertical"
          label="Vertical"
          value={findOption(filteredVerticals, values.vertical)}
          readOnlyValue={readOnlyLabels?.vertical}
          options={filteredVerticals}
          onChange={(option: SingleValue<Option>) =>
            emit("vertical", option?.value || "")
          }
          isDisabled={lockOrgFields || !selectedDepartment}
          required
          helperText={helper(
            lockOrgFields
              ? "Vertical cannot be changed after EPC creation"
              : "Verticals are filtered based on selected department",
          )}
          error={errors.vertical}
          className="w-full"
        />
        <div className="flex flex-col gap-1">
          {isView ? (
            <ReadOnlyField label="Location" value={values.location} />
          ) : (
            <PincodeAsyncSelect
              label="Location"
              value={selectedPincode}
              onChange={handlePincodeChange}
              error={errors.location}
              helperText="Search by pincode, office name, district, or state."
            />
          )}
        </div>
        <SelectInput
          mode={mode}
          name="budgetDescription"
          label="Budget Description"
          value={selectedBudgetDescription}
          readOnlyValue={readOnlyLabels?.budgetDescription}
          options={budgetDescriptionOptions}
          onChange={handleBudgetChange}
          required
          helperText={helper(
            "Shows the selected zone's budget plus general budgets; the budget code fills automatically",
          )}
          error={errors.budgetDescription || errors.budget_master_id}
          className="w-full"
        />

        <SelectInput
          mode={mode}
          name="budget_master_id"
          label="Budget Code"
          value={selectedBudgetCode}
          readOnlyValue={readOnlyLabels?.budgetCode}
          options={budgetCodeOptions}
          onChange={handleBudgetChange}
          isDisabled
          helperText={helper(
            "Auto-filled from the selected budget description",
          )}
          className="w-full"
        />
        <SelectInput
          mode={mode}
          name="event_name"
          label="Event Name"
          value={findOption(masters?.eventNames ?? [], values.event_name)}
          readOnlyValue={readOnlyLabels?.eventName}
          options={masters?.eventNames || []}
          onChange={handleEventNameChange}
          required
          helperText={helper(
            "Select from past events or create new by typing and pressing enter",
          )}
          error={errors.event_name}
          className="w-full"
        />
        {isView ? (
          <ReadOnlyField
            label={getEventDateLabel(eventDateMode)}
            value={formatEventDateRange(
              values.event_from_date,
              values.event_to_date,
              eventDateMode,
            )}
            required
          />
        ) : (
          <DatePickerInput
            key={eventDateMode} // remount so the picker's draft resets on mode change
            mode={eventDateMode}
            label={getEventDateLabel(eventDateMode)}
            value={
              isSingleDate
                ? parseDateOnly(values.event_from_date)
                : toDateRange(values.event_from_date, values.event_to_date)
            }
            onChange={handleEventDateChange}
            helperText={getEventDateHelperText(eventDateMode)}
            error={errors.event_from_date || errors.event_to_date}
            disablePast
          />
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <TextareaInput
            mode={mode}
            name="event_description"
            label="Event Description"
            value={values.event_description || ""}
            onChange={(event) => emit("event_description", event.target.value)}
            className="h-full w-full p-2"
            minLength={100}
            rows={4}
            helperText={helper(
              "Describe the purpose, audience, and expected outcome of this event.",
            )}
            error={errors.event_description}
          />
        </div>

        <div className="min-w-0">
          <TextareaInput
            mode={mode}
            name="event_objective"
            label="Objective"
            value={values.event_objective || ""}
            onChange={(event) => emit("event_objective", event.target.value)}
            minLength={100}
            rows={4}
            className="h-full w-full p-2"
            error={errors.event_objective}
            helperText={helper(
              "Mention the main goal of this event, such as brand awareness, lead generation, dealer engagement, product promotion, customer connect, or sales support.",
            )}
          />
        </div>
      </div>
    </form>
  );
}
