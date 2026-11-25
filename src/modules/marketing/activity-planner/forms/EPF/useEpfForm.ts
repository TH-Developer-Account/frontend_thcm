// forms/EPF/useEpfForm.ts
// EPF form controller.
//
// ONE-CLICK SUBMIT (when `submitWithWorkflow` is set, i.e. in the wizard):
//
//   1. Save the EPF (create, or update if it already exists).
//   2. Preview the approval workflow that matches the EPC's zone and
//      `tataHitachiShare` (the Tata Hitachi share only, dealer share
//      excluded — not the full event cost; workflow-template matching is
//      scoped to what Tata Hitachi itself is on the hook for, and to the
//      EPC's zone first, then that amount).
//   3. A matching template was found → assign it, the EPC is now pending
//      on that workflow's first stage.
//      No matching template → nothing is assigned. The EPF stays saved;
//      clicking Submit again re-saves and retries only this step once an
//      administrator sets up a workflow for the zone/amount.
//
// The "Approval Workflow" section below the form previews this live, as
// the amount changes, so the creator can see before submitting whether a
// workflow will be found.
//
// DRAFT (create mode only): what the user types is autosaved locally (per EPC)
// so a refresh / Back doesn't lose it. Only user-entered fields are stored;
// CRF total, budgets and shares are always recomputed from live data.
//
// BUDGET LOADING: the budget info query is exposed separately
// (budgetLoading / budgetError / refetchBudget) so the form can render
// everything else immediately and let only the Budget Summary load / retry.
import React from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../../context/Auth/useAuth";
import { getWorkflowErrorMessage, workflowApi } from "../../../../workflows";

import type { LineItemOption } from "../../types/epc.types";
import type {
  EpfCrfData,
  EpfDetailResponse,
  EpfFormValues,
  EpfProduct,
  EpfStatus,
} from "../../types/epf.types";

import {
  calculateBudgetShares,
  calculateLineItemsTotal,
  calculateParticipantsTotal,
  getOverheadItemsMissingQuotation,
} from "./epf.calculations";

import {
  getCrfTotalFromData,
  initialEpfValues,
  mapBudgetInfoToFormValues,
  mapEpfLineItemsToFormItems,
  mapEpfProductsToOptions,
  mapEpfResponseToFormValues,
} from "./epf.mapper";

import { buildEpfCreatePayload, buildEpfUpdatePayload } from "./epf.payload";
import {
  mapWorkflowStagesToApprovalRows,
  validateEpfForm,
} from "../../utils/formatters";
import { getStoredAppId } from "../../utils/common";
import { clearEpfDraft, loadEpfDraft, saveEpfDraft } from "./epfDraft";

import { clearStoredEpcInfo, getStoredEpcInfo } from "../../utils/localstorage";

import {
  useCreateEpfMutation,
  useEpfBudgetInfoQuery,
  useEpfProductsQuery,
  useUpdateEpfMutation,
} from "../../queries/epf.queries";
import {
  epcKeys,
  useSubmitClarifiedUpdatedFormMutation,
} from "../../queries/epc.queries";

export type EpfFormMode = "create" | "edit";

export type EpfFormProps = {
  mode?: EpfFormMode;
  epcId?: string | null;
  crfId?: string | null;
  epfId?: string | null;
  initialData?: EpfDetailResponse | null;
  crfData?: EpfCrfData;
  budgetMasterId?: string | null;
  /**
   * The EPC's zone, as a region_code (not a Zone id) — resolved by the
   * caller (EpcFormsWizardPage) from `epcData.region_id` via master data,
   * the same way `budgetMasterId` is resolved before reaching this hook.
   * Workflow-template matching tries this first, then falls back to
   * budget-only matching (see templateMatchResolvers.EVENT_PROPOSAL
   * server-side). Optional and unresolved here on purpose: neither
   * `EpcDetailEpf` nor `CrfDetail` carries a zone code of its own, so
   * there is no further fallback chain to add, unlike budgetMasterId's.
   */
  epcZoneCode?: string | null;
  onSuccess?: (data?: any) => void | Promise<void>;
  onCancel?: () => void;
  isClarifiedUpdate?: boolean;
  activeWorkflowId?: string | null;
  /** Submit = save EPF → preview + assign the matching workflow. */
  submitWithWorkflow?: boolean;
  /** "Request workflow" clicked because none exists. Host navigates to listing. */
  onRequestWorkflow?: () => void | Promise<void>;
};

export type EpfWorkflowPreview = {
  /** Only relevant when `submitWithWorkflow` is on. */
  enabled: boolean;
  /** True once a preview has been fetched for the CURRENT amount. */
  checked: boolean;
  loading: boolean;
  error: unknown;
  rows: any[];
  hasWorkflow: boolean;
};

type UseEpfFormResult = {
  values: EpfFormValues;
  eventCost: number;
  errors: Partial<Record<keyof EpfFormValues, string>>;
  /** Products or budget still loading — used to disable Reset / Save only. */
  loading: boolean;
  /** Budget info only — drives the Budget Summary's own loading state. */
  budgetLoading: boolean;
  budgetError: boolean;
  refetchBudget: () => void;
  submitting: boolean;
  options: LineItemOption[];
  costItems: LineItemOption[];
  setCostItems: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
  epcId: string | null;
  epfId: string | null;
  isEditMode: boolean;
  /** When the local draft was last written (create mode only), else null. */
  draftSavedAt: number | null;
  workflowPreview: EpfWorkflowPreview;
  handleChange: (name: keyof EpfFormValues, value: string) => void;
  handleReset: () => void;
  handleSubmit: (status: EpfStatus) => Promise<void>;
  handleRequestWorkflow: () => Promise<void>;
};

const SUBJECT_TYPE = "EVENT_PROPOSAL" as const;

const numericFields = new Set<keyof EpfFormValues>([
  "externalParticipants",
  "internalParticipants",
  "totalParticipants",
  "crfTotal",
  "eventBudget",
  "annualBudget",
  "availableBudget",
  "allotedBudget",
  "dealerPercent",
  "dealerShare",
  "tataHitachiPercent",
  "tataHitachiShare",
  "tataHitachiPoAmount",
]);

const DRAFT_DEBOUNCE_MS = 600;
const PREVIEW_DEBOUNCE_MS = 600;

const parseFieldValue = (name: keyof EpfFormValues, value: string) => {
  if (!numericFields.has(name)) return value;
  return value === "" ? "" : Number(value);
};

const getBudgetMasterId = ({
  budgetMasterId,
  initialData,
  crfData,
}: {
  budgetMasterId?: string | null;
  initialData?: any;
  crfData?: any;
}) => {
  return (
    budgetMasterId ??
    initialData?.epc?.budget_master_id ??
    initialData?.epc?.budgetMasterId ??
    initialData?.budget_master_id ??
    crfData?.epc?.budget_master_id ??
    null
  );
};

export const useEpfForm = ({
  mode = "create",
  epcId: propEpcId,
  crfId: propCrfId,
  epfId: propEpfId,
  initialData,
  crfData,
  budgetMasterId: propBudgetMasterId,
  epcZoneCode: propEpcZoneCode,
  onSuccess,
  submitWithWorkflow = false,
  onRequestWorkflow,
  isClarifiedUpdate = false,
  activeWorkflowId = null,
}: EpfFormProps = {}): UseEpfFormResult => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { workspaceId } = useAuth();
  const appId = React.useMemo(() => getStoredAppId(), []);

  const storedInfo = React.useMemo(() => getStoredEpcInfo(), []);

  const epcId = propEpcId ?? storedInfo?.epcId ?? null;
  const crfId = propCrfId ?? storedInfo?.crfId ?? null;
  const epfId = propEpfId ?? storedInfo?.epfId ?? null;
  // No fallback chain here (unlike budgetMasterId above) — confirmed neither
  // EpcDetailEpf nor CrfDetail carries a zone code, so the caller is the
  // only source.
  const epcZoneCode = propEpcZoneCode ?? null;

  const isEditMode = mode === "edit" || Boolean(epfId);

  /** Id of an EPF this form created during this session (see retry note above). */
  const createdEpfIdRef = React.useRef<string | null>(null);

  const initialCrfTotal = React.useMemo(() => {
    return getCrfTotalFromData(crfData);
  }, [crfData]);

  /* ------------------------------- Draft ---------------------------------- */

  // Read once on mount. Only used when creating a new EPF — once an EPF exists
  // on the server, the server copy is the single source of truth.
  const draft = React.useMemo(
    () => (!initialData && epcId ? loadEpfDraft(epcId) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /** Set after a successful save so a pending autosave can't recreate the draft. */
  const savedRef = React.useRef(false);
  const [draftSavedAt, setDraftSavedAt] = React.useState<number | null>(
    draft?.savedAt ?? null,
  );

  const [values, setValues] = React.useState<EpfFormValues>(() => {
    if (initialData) {
      return mapEpfResponseToFormValues(initialData, initialCrfTotal);
    }

    return {
      ...initialEpfValues,
      ...(draft?.values ?? {}),
      // Always live, never from the draft.
      crfTotal: initialCrfTotal,
    };
  });

  const [costItems, setCostItems] = React.useState<LineItemOption[]>(() => {
    if (draft) return draft.costItems;
    return mapEpfLineItemsToFormItems(initialData?.lineItems ?? []);
  });

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof EpfFormValues, string>>
  >({});

  const [assigning, setAssigning] = React.useState(false);

  const budgetMasterId = getBudgetMasterId({
    budgetMasterId: propBudgetMasterId,
    initialData,
    crfData,
  });

  const productsQuery = useEpfProductsQuery();
  const budgetQuery = useEpfBudgetInfoQuery(budgetMasterId);

  const createEpfMutation = useCreateEpfMutation();
  const updateEpfMutation = useUpdateEpfMutation();

  const clarifiedResubmitMutation = useSubmitClarifiedUpdatedFormMutation();

  const options = React.useMemo(() => {
    return mapEpfProductsToOptions((productsQuery.data ?? []) as EpfProduct[]);
  }, [productsQuery.data]);

  React.useEffect(() => {
    if (initialData) {
      setValues(mapEpfResponseToFormValues(initialData, initialCrfTotal));
      setCostItems(mapEpfLineItemsToFormItems(initialData.lineItems ?? []));
      setErrors({});
      return;
    }

    setValues((prev) => ({
      ...prev,
      crfTotal: initialCrfTotal,
    }));
  }, [initialData, initialCrfTotal]);

  React.useEffect(() => {
    if (!crfData) return;

    const crfTotal = getCrfTotalFromData(crfData);

    setValues((prev) => ({
      ...prev,
      crfTotal,
    }));
  }, [crfData]);

  React.useEffect(() => {
    if (!budgetQuery.data) return;

    setValues((prev) => ({
      ...prev,
      ...mapBudgetInfoToFormValues(budgetQuery.data),
    }));
  }, [budgetQuery.data]);

  /* ---------------------------- Draft autosave ----------------------------- */

  React.useEffect(() => {
    if (initialData || !epcId || savedRef.current) return;

    const timer = window.setTimeout(() => {
      if (savedRef.current) return;
      const savedAt = saveEpfDraft(epcId, values, costItems);
      if (savedAt) setDraftSavedAt(savedAt);
    }, DRAFT_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [initialData, epcId, values, costItems]);

  /** Event cost = overheads + CRF total. Saved as the EPF's event budget. */
  const eventCost = React.useMemo(() => {
    const overheadTotal = calculateLineItemsTotal(costItems);
    return overheadTotal + Number(values.crfTotal || 0);
  }, [costItems, values.crfTotal]);

  /** Dealer/Tata Hitachi split of `eventCost`. Workflow-template matching
   *  is scoped to `tataHitachiShare` (see file header). */
  const budgetShares = React.useMemo(
    () => calculateBudgetShares(values, eventCost),
    [values, eventCost],
  );
  const tataHitachiShare = Number(budgetShares.tataHitachiShare) || 0;

  const displayValues = React.useMemo<EpfFormValues>(() => {
    return {
      ...values,
      totalParticipants: calculateParticipantsTotal(
        values.externalParticipants,
        values.internalParticipants,
      ),
      ...budgetShares,
    };
  }, [values, budgetShares]);

  /* ------------------------- Approval Workflow preview ---------------------- */
  // Automatic: re-previewed any time `tataHitachiShare` settles on a new
  // value (debounced the same way the draft autosave is), so the creator
  // can see the approval chain — or find out none exists yet — before
  // hitting Submit. Submit re-fetches this itself rather than trusting a
  // possibly-stale value, so there's no race between typing and clicking.

  const fetchPreviewRows = React.useCallback(
    async (budget: number) => {
      const response = await workflowApi.previewWorkflow({
        subjectType: SUBJECT_TYPE,
        workspaceId: workspaceId as string,
        appId: appId as string,
        criteria: { budget, zone: epcZoneCode ?? undefined },
      });

      return (
        mapWorkflowStagesToApprovalRows(response?.stages ?? [], {
          showOnlyCurrentStageStatus: false,
        }) ?? []
      );
    },
    [appId, workspaceId, epcZoneCode],
  );

  const [livePreview, setLivePreview] = React.useState<{
    amount: number;
    rows: any[];
    error: unknown;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  React.useEffect(() => {
    if (
      !submitWithWorkflow ||
      !(tataHitachiShare > 0) ||
      !workspaceId ||
      !appId
    ) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPreviewLoading(true);
      fetchPreviewRows(tataHitachiShare)
        .then((rows) => {
          if (cancelled) return;
          setLivePreview({ amount: tataHitachiShare, rows, error: null });
        })
        .catch((error) => {
          if (cancelled) return;
          setLivePreview({ amount: tataHitachiShare, rows: [], error });
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false);
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    submitWithWorkflow,
    tataHitachiShare,
    workspaceId,
    appId,
    fetchPreviewRows,
  ]);

  const previewChecked =
    livePreview !== null && livePreview.amount === tataHitachiShare;

  const workflowPreview: EpfWorkflowPreview = {
    enabled: submitWithWorkflow,
    checked: previewChecked,
    loading: previewLoading,
    error: previewChecked ? livePreview!.error : null,
    rows: previewChecked ? livePreview!.rows : [],
    hasWorkflow:
      previewChecked && !livePreview!.error && livePreview!.rows.length > 0,
  };

  /* --------------------------- Loading flags ------------------------------- */

  const budgetLoading = budgetQuery.isLoading;
  const budgetError = budgetQuery.isError;

  const refetchBudget = React.useCallback(() => {
    void budgetQuery.refetch();
  }, [budgetQuery]);

  // Used only to disable Reset / Save only — NOT to blank the whole form.
  const loading = productsQuery.isLoading || budgetLoading;

  const submitting =
    createEpfMutation.isPending ||
    updateEpfMutation.isPending ||
    assigning ||
    clarifiedResubmitMutation.isPending;

  const handleChange = React.useCallback(
    (name: keyof EpfFormValues, value: string) => {
      setValues((prev) => {
        const parsedValue = parseFieldValue(name, value);

        const updated = {
          ...prev,
          [name]: parsedValue,
        };

        if (
          name === "externalParticipants" ||
          name === "internalParticipants"
        ) {
          return {
            ...updated,
            totalParticipants: calculateParticipantsTotal(
              updated.externalParticipants,
              updated.internalParticipants,
            ),
          };
        }

        return updated;
      });

      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    },
    [errors],
  );

  const handleReset = React.useCallback(() => {
    if (initialData) {
      setValues(mapEpfResponseToFormValues(initialData, initialCrfTotal));
      setCostItems(mapEpfLineItemsToFormItems(initialData.lineItems ?? []));
    } else {
      setValues({
        ...initialEpfValues,
        crfTotal: initialCrfTotal,
      });
      setCostItems([]);

      // Reset means "start over" — drop the saved draft too.
      if (epcId) clearEpfDraft(epcId);
      setDraftSavedAt(null);
    }

    setErrors({});
  }, [epcId, initialData, initialCrfTotal]);

  const handleRequestWorkflow = React.useCallback(async () => {
    showToast({
      type: "success",
      title: "Workflow needed",
      description:
        "Nothing was submitted. Ask your administrator to set up an approval workflow for this amount, then continue from the listing.",
    });

    await onRequestWorkflow?.();
  }, [onRequestWorkflow, showToast]);

  const handleSubmit = React.useCallback(
    async (status: EpfStatus) => {
      if (submitting) return;

      try {
        if (!epcId) {
          showToast({
            type: "error",
            title: "Error",
            description: "EPC ID not found.",
          });
          return;
        }

        const validation = validateEpfForm(displayValues);

        if (status === "SUBMITTED" && !validation.isValid) {
          setErrors(validation.errors);

          showToast({
            type: "error",
            title: "Validation Error",
            description: "Please fill all required EPF details.",
          });

          return;
        }

        if (status === "SUBMITTED") {
          const overheadItemsMissingQuotation =
            getOverheadItemsMissingQuotation(costItems);

          if (overheadItemsMissingQuotation.length > 0) {
            showToast({
              type: "error",
              title: "Quotation Required",
              description:
                "Upload a quotation for each event cost overhead item above ₹25,000.",
            });
            return;
          }
        }
        if (isClarifiedUpdate && !activeWorkflowId) {
          showToast({
            type: "error",
            title: "Cannot resubmit",
            description:
              "The active approval workflow for this EPC could not be found.",
          });
          return;
        }

        /* ── Basic guards for the one-click submit path. ──────────── */
        if (submitWithWorkflow) {
          if (!(eventCost > 0)) {
            showToast({
              type: "error",
              title: "Cannot submit",
              description: "Event budget must be greater than zero.",
            });
            return;
          }

          if (!workspaceId || !appId) {
            showToast({
              type: "error",
              title: "Cannot submit",
              description: !workspaceId
                ? "Workspace not found."
                : "Application ID not found.",
            });
            return;
          }
        }

        /* ── Step 1: save the EPF (create, or update if it exists). ───── */
        const currentEpfId = epfId ?? createdEpfIdRef.current;

        const payloadArgs = {
          values: displayValues,
          status,
          epcId,
          crfId,
          eventCost,
          costItems,
        };

        const savedData: any = currentEpfId
          ? await updateEpfMutation.mutateAsync({
              epcId,
              epfId: currentEpfId,
              payload: buildEpfUpdatePayload(payloadArgs),
            })
          : await createEpfMutation.mutateAsync({
              epcId,
              payload: buildEpfCreatePayload(payloadArgs),
            });

        if (!currentEpfId) {
          createdEpfIdRef.current =
            savedData?.id ?? savedData?.data?.id ?? null;
        }

        // Saved on the server → the local draft is obsolete. Mark it first so
        // a pending autosave can't write it back.
        savedRef.current = true;
        clearEpfDraft(epcId);
        setDraftSavedAt(null);

        /* ── Step 2: preview + assign the matching workflow. ──────────── */
        // Always re-fetched fresh here rather than trusting the live
        // preview's state — avoids a race if the amount just settled.
        if (submitWithWorkflow) {
          setAssigning(true);
          try {
            const rows = await fetchPreviewRows(tataHitachiShare);

            if (rows.length === 0) {
              showToast({
                type: "error",
                title: "EPF saved, not submitted",
                description:
                  "No approval workflow is assigned to this amount yet. Ask your administrator to set one up, then submit again.",
              });
              return;
            }

            await workflowApi.assignWorkflow({
              subjectType: SUBJECT_TYPE,
              subjectId: epcId,
              workspaceId: workspaceId as string,
              appId: appId as string,
              criteria: {
                budget: tataHitachiShare,
                zone: epcZoneCode ?? undefined,
              },
            });
          } catch (assignError) {
            console.error("EPC workflow assignment failed:", assignError);

            await queryClient.invalidateQueries({
              queryKey: epcKeys.detail(epcId),
            });

            showToast({
              type: "error",
              title: "EPF saved, not submitted",
              description: getWorkflowErrorMessage(
                assignError,
                "Unable to submit the EPC.",
              ),
            });
            return; // EPF stays saved; clicking Submit again retries only this step
          } finally {
            setAssigning(false);
          }

          await Promise.all([
            queryClient.invalidateQueries({ queryKey: epcKeys.detail(epcId) }),
            queryClient.invalidateQueries({ queryKey: epcKeys.lists() }),
          ]);
        }
        /* ── Clarified resubmit: restart the SAME workflow at stage 1. ── */
        // Same call the detail page's "Submit updated form" uses. If it fails
        // the EPF edits stay saved; clicking Resubmit again re-saves and
        // retries only this step.
        if (isClarifiedUpdate && !submitWithWorkflow) {
          try {
            await clarifiedResubmitMutation.mutateAsync({
              workflowId: activeWorkflowId as string,
              epcId,
            });
          } catch (resubmitError) {
            console.error("Clarified resubmit failed:", resubmitError);

            await queryClient.invalidateQueries({
              queryKey: epcKeys.detail(epcId),
            });

            showToast({
              type: "error",
              title: "Changes saved, not resubmitted",
              description: getWorkflowErrorMessage(
                resubmitError,
                "Unable to restart the approval workflow.",
              ),
            });
            return;
          }

          await Promise.all([
            queryClient.invalidateQueries({ queryKey: epcKeys.detail(epcId) }),
            queryClient.invalidateQueries({ queryKey: epcKeys.lists() }),
          ]);
        }
        clearStoredEpcInfo();

        showToast({
          type: "success",
          title: "Success",
          description: isClarifiedUpdate
            ? "Resubmitted. Approval restarts from the first stage."
            : submitWithWorkflow
              ? "Submitted. The approval workflow has started."
              : currentEpfId
                ? "EPF updated successfully."
                : "EPF saved successfully.",
        });

        if (onSuccess) {
          await onSuccess(savedData);
          return;
        }

        navigate(`/marketing/activity-planner/${epcId}`);
      } catch (error: any) {
        console.error("EPF save failed:", error);

        showToast({
          type: "error",
          title: "Error",
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to save EPF.",
        });
      }
    },
    [
      appId,
      costItems,
      createEpfMutation,
      crfId,
      displayValues,
      epcId,
      epfId,
      epcZoneCode,
      eventCost,
      fetchPreviewRows,
      navigate,
      onSuccess,
      queryClient,
      showToast,
      submitWithWorkflow,
      submitting,
      tataHitachiShare,
      updateEpfMutation,
      workspaceId,
      isClarifiedUpdate,
      activeWorkflowId,
      clarifiedResubmitMutation,
    ],
  );

  return {
    values: displayValues,
    eventCost,
    errors,
    loading,
    budgetLoading,
    budgetError,
    refetchBudget,
    submitting,
    options,
    costItems,
    setCostItems,
    epcId,
    epfId,
    isEditMode,
    draftSavedAt: isEditMode ? null : draftSavedAt,
    workflowPreview,
    handleChange,
    handleReset,
    handleSubmit,
    handleRequestWorkflow,
  };
};
