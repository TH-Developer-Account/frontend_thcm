// forms/EPF/useEpfForm.ts
// EPF form controller.
//
// ONE-CLICK SUBMIT (when `submitWithWorkflow` is set, i.e. in the wizard)
// is now a strict three-step gate, in order:
//
//   1. CHECK AUTHORITY (manual — the "Check Authority" button). Calls the
//      Schedule of Authority (SOA) for the live, UNSAVED `tataHitachiShare`.
//      Must be re-run any time that amount changes — a result only counts
//      for the exact amount it was checked against (see `authorityCheck`
//      below). Not authorized to even propose this amount → Submit stays
//      disabled, no matter what; there is no escalation path for an amount
//      you aren't authorized to create in the first place.
//   2. PREVIEW WORKFLOW (manual — only shown/relevant when authorized to
//      propose but NOT auto-approved, i.e. a workflow is actually needed).
//      Must find a template for the same amount before Submit unlocks.
//   3. SUBMIT — only reachable once 1 (and 2, if it applies) have passed
//      for the CURRENT amount. Only then do we:
//        a. save the EPF (create, or update if it already exists)
//        b. finalize the EPC — the server-side SOA decision is still the
//           authoritative one (see epc.controller.ts's
//           finalizeEventProposal); the checks above are a frontend
//           courtesy so the EPF is never saved as SUBMITTED for an amount
//           the creator isn't authorized for, but the backend enforces the
//           same rule independently.
//        c. not auto-approved → assign the workflow previewed in step 2.
//
// WHY THE GATE MOVED BEFORE SAVING: previously Submit saved the EPF with
// status SUBMITTED FIRST and only found out via finalize whether that was
// allowed. When it wasn't, the EPF/EPC was left stuck at status SUBMITTED
// with no active workflow — "pending on proposer" with no way to resolve
// it short of lowering the amount. Checking authority before saving
// anything avoids ever reaching that state in the normal flow.
//
// BUDGET USED FOR SOA / TEMPLATE MATCHING: `tataHitachiShare` (the Tata
// Hitachi share only, dealer share excluded) — not the full event cost.
// SOA authority and workflow-template bands are both scoped to what Tata
// Hitachi itself is on the hook for, so this must be the same amount
// `authorityLimit.helper.ts` / `evaluateBudget` (budgetMap) will see.
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
  onSuccess?: (data?: any) => void | Promise<void>;
  onCancel?: () => void;
  isClarifiedUpdate?: boolean;
  activeWorkflowId?: string | null;
  /**
   * Submit = Check Authority → (if needed) Preview Workflow → save EPF →
   * Schedule of Authority finalize → (if not bypassed) assign the
   * previewed workflow. See this file's header for the full gate order.
   */
  submitWithWorkflow?: boolean;
  /** "Request workflow" clicked because none exists. Host navigates to listing. */
  onRequestWorkflow?: () => void | Promise<void>;
};

/** Result of the manual "Check Authority" action, pinned to the amount it
 *  was run against — see `EpfAuthorityCheck.checked` for why that matters. */
type AuthorityCheckState = {
  amount: number;
  eligible: boolean;
  proposerEligible: boolean;
  authorityLimitLabel: string | null;
};

export type EpfAuthorityCheck = {
  /** Only relevant when `submitWithWorkflow` is on. */
  enabled: boolean;
  /** True only once a check has been run AND the amount hasn't changed
   *  since. False here means "stale or never run" — re-run before relying
   *  on `eligible` / `proposerEligible` / `needsWorkflow`. */
  checked: boolean;
  checking: boolean;
  /** Eligible APPROVER → auto-approved, no workflow needed. Meaningless
   *  unless `checked` is true. */
  eligible: boolean;
  /** Eligible PROPOSER → authorized to submit this amount at all. False
   *  is a hard rejection, never a signal to preview a workflow instead.
   *  Meaningless unless `checked` is true. */
  proposerEligible: boolean;
  authorityLimitLabel: string | null;
  /** Authorized to propose, but not auto-approved — a workflow preview is
   *  required before Submit unlocks. Meaningless unless `checked` is true. */
  needsWorkflow: boolean;
  run: () => Promise<void>;
};

export type EpfWorkflowPreview = {
  /** Only worth showing once the authority check says a workflow is
   *  actually needed (`authorityCheck.needsWorkflow`). */
  visible: boolean;
  /** True only once a preview has been run AND the amount hasn't changed
   *  since (same staleness rule as the authority check). */
  checked: boolean;
  loading: boolean;
  error: unknown;
  rows: any[];
  hasWorkflow: boolean;
  run: () => Promise<void>;
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
  authorityCheck: EpfAuthorityCheck;
  workflowPreview: EpfWorkflowPreview;
  /** True while `submitWithWorkflow` and the gate above isn't satisfied yet
   *  for the current amount — the host disables Submit on this. */
  authorityBlocksSubmit: boolean;
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

  /** Dealer/Tata Hitachi split of `eventCost`. SOA and workflow-template
   *  matching are both scoped to `tataHitachiShare` (see file header). */
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

  /* ----------------------- Step 1: Check Authority -------------------------- */
  // Manual, pre-save, EPC-agnostic: checks the live `tataHitachiShare`
  // directly, so the creator finds out BEFORE saving/submitting anything.
  // Pinned to the amount it ran against — any later change to the amount
  // makes `checked` false again until re-run (see EpfAuthorityCheck's doc
  // comment). This is a frontend courtesy; finalizeEpc (step 3b) remains
  // the authoritative server-side decision.

  const [authorityCheckState, setAuthorityCheckState] =
    React.useState<AuthorityCheckState | null>(null);
  const [checkingAuthority, setCheckingAuthority] = React.useState(false);

  const authorityChecked =
    authorityCheckState !== null &&
    authorityCheckState.amount === tataHitachiShare;

  const needsWorkflow =
    authorityChecked &&
    authorityCheckState!.proposerEligible &&
    !authorityCheckState!.eligible;

  const handleCheckAuthority = React.useCallback(async () => {
    if (!(tataHitachiShare > 0)) {
      showToast({
        type: "error",
        title: "Cannot check authority",
        description:
          "Add event cost items first so there's an amount to check.",
      });
      return;
    }

    setCheckingAuthority(true);
    try {
      const result =
        await workflowApi.checkAuthorityForAmount(tataHitachiShare);
      setAuthorityCheckState({ amount: tataHitachiShare, ...result });
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not check authority",
        description: getWorkflowErrorMessage(
          error,
          "Unable to check your Schedule of Authority eligibility.",
        ),
      });
    } finally {
      setCheckingAuthority(false);
    }
  }, [showToast, tataHitachiShare]);

  const authorityCheck: EpfAuthorityCheck = {
    enabled: submitWithWorkflow,
    checked: authorityChecked,
    checking: checkingAuthority,
    eligible: authorityChecked ? authorityCheckState!.eligible : false,
    proposerEligible: authorityChecked
      ? authorityCheckState!.proposerEligible
      : false,
    authorityLimitLabel: authorityChecked
      ? authorityCheckState!.authorityLimitLabel
      : null,
    needsWorkflow,
    run: handleCheckAuthority,
  };

  /* ----------------------- Step 2: Preview Workflow -------------------------- */
  // Manual, only meaningful once Step 1 says a workflow is actually needed.
  // Same staleness rule as the authority check: a result only counts for
  // the exact amount it was fetched for.

  const fetchPreviewRows = React.useCallback(
    async (budget: number) => {
      const response = await workflowApi.previewWorkflow({
        subjectType: SUBJECT_TYPE,
        workspaceId: workspaceId as string,
        appId: appId as string,
        criteria: { budget },
      });

      return (
        mapWorkflowStagesToApprovalRows(response?.stages ?? [], {
          showOnlyCurrentStageStatus: false,
        }) ?? []
      );
    },
    [appId, workspaceId],
  );

  const [workflowPreviewState, setWorkflowPreviewState] = React.useState<{
    amount: number;
    rows: any[];
    error: unknown;
  } | null>(null);
  const [previewingWorkflow, setPreviewingWorkflow] = React.useState(false);

  const previewChecked =
    workflowPreviewState !== null &&
    workflowPreviewState.amount === tataHitachiShare;

  const handlePreviewWorkflow = React.useCallback(async () => {
    if (!(tataHitachiShare > 0) || !workspaceId || !appId) return;

    setPreviewingWorkflow(true);
    try {
      const rows = await fetchPreviewRows(tataHitachiShare);
      setWorkflowPreviewState({ amount: tataHitachiShare, rows, error: null });
    } catch (error) {
      setWorkflowPreviewState({ amount: tataHitachiShare, rows: [], error });
    } finally {
      setPreviewingWorkflow(false);
    }
  }, [appId, fetchPreviewRows, tataHitachiShare, workspaceId]);

  const previewRows = previewChecked ? workflowPreviewState!.rows : [];
  const previewError = previewChecked ? workflowPreviewState!.error : null;

  const workflowPreview: EpfWorkflowPreview = {
    visible: submitWithWorkflow && needsWorkflow,
    checked: previewChecked,
    loading: previewingWorkflow,
    error: previewError,
    rows: previewRows,
    hasWorkflow: previewChecked && !previewError && previewRows.length > 0,
    run: handlePreviewWorkflow,
  };

  /** Submit stays disabled until the gate above is satisfied for the
   *  CURRENT amount. Edit-only saves (no `submitWithWorkflow`) skip this
   *  entirely — SOA only gates the one-click wizard submit. */
  const authorityBlocksSubmit =
    submitWithWorkflow &&
    (!authorityCheck.checked ||
      !authorityCheck.proposerEligible ||
      (authorityCheck.needsWorkflow &&
        (!workflowPreview.checked || !workflowPreview.hasWorkflow)));

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

          /* ── Schedule of Authority gate — BEFORE anything is saved.
           * Nothing gets written as SUBMITTED unless the creator is
           * authorized for the CURRENT amount, and (if a workflow is
           * needed) a template has been previewed for it. See this
           * file's header for why this moved ahead of the save. ── */
          if (authorityBlocksSubmit) {
            if (!authorityCheck.checked) {
              showToast({
                type: "error",
                title: "Check authority first",
                description:
                  'Click "Check Authority" for the current amount before submitting.',
              });
            } else if (!authorityCheck.proposerEligible) {
              showToast({
                type: "error",
                title: "Cannot submit",
                description: authorityCheck.authorityLimitLabel
                  ? `You are not authorized to submit an amount in the "${authorityCheck.authorityLimitLabel}" band. This exceeds your assigned limit.`
                  : "You are not authorized to submit an Event Proposal for this amount.",
              });
            } else {
              showToast({
                type: "error",
                title: "Preview workflow first",
                description: !workflowPreview.checked
                  ? 'Click "Preview Workflow" to see the approval flow for this amount before submitting.'
                  : "No approval workflow is assigned to this amount yet. Ask your administrator to set one up, then check again.",
              });
            }
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

        /* ── Step 2: Schedule of Authority finalize — the real submit. ──
         * Always tries SOA auto-approval first, against the amount just
         * saved. Only when it declines (`bypassed === false`) do we fall
         * back to assigning the workflow already previewed above —
         * reusing those rows rather than re-fetching, since we already
         * confirmed one exists as part of the gate. */
        let bypassedBySOA = false;

        if (submitWithWorkflow) {
          setAssigning(true);
          try {
            const finalizeResult = await workflowApi.finalizeEpc(epcId);
            bypassedBySOA = Boolean(finalizeResult.data.bypassed);

            if (!bypassedBySOA) {
              let rows = previewChecked ? workflowPreviewState!.rows : [];

              if (rows.length === 0) {
                try {
                  rows = await fetchPreviewRows(tataHitachiShare);
                } catch (previewError) {
                  showToast({
                    type: "error",
                    title: "EPF saved, not submitted",
                    description: getWorkflowErrorMessage(
                      previewError,
                      "Unable to find an approval workflow for this amount.",
                    ),
                  });
                  return;
                }
              }

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
                criteria: { budget: tataHitachiShare },
              });
            }
          } catch (finalizeError) {
            console.error("EPC finalize/assign failed:", finalizeError);

            await queryClient.invalidateQueries({
              queryKey: epcKeys.detail(epcId),
            });

            showToast({
              type: "error",
              title: "EPF saved, not submitted",
              description: getWorkflowErrorMessage(
                finalizeError,
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
              ? bypassedBySOA
                ? "Submitted. EPC auto-approved under the Schedule of Authority — no workflow was required."
                : "Submitted. The approval workflow has started."
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
      authorityBlocksSubmit,
      authorityCheck.authorityLimitLabel,
      authorityCheck.checked,
      authorityCheck.proposerEligible,
      costItems,
      createEpfMutation,
      crfId,
      displayValues,
      epcId,
      epfId,
      eventCost,
      fetchPreviewRows,
      navigate,
      onSuccess,
      previewChecked,
      queryClient,
      showToast,
      submitWithWorkflow,
      submitting,
      tataHitachiShare,
      updateEpfMutation,
      workflowPreview.checked,
      workflowPreviewState,
      workspaceId,
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
    authorityCheck,
    workflowPreview,
    authorityBlocksSubmit,
    handleChange,
    handleReset,
    handleSubmit,
    handleRequestWorkflow,
  };
};
