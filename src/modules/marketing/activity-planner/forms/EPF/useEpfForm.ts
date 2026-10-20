// forms/EPF/useEpfForm.ts
// EPF form controller.
//
// ONE-CLICK SUBMIT (when `submitWithWorkflow` is set, i.e. in the wizard):
//
//   Submit click
//     1. validate the form
//     2. preview the approval workflow for this budget  → none? STOP, save nothing
//     3. save the EPF (create, or update if it already exists)
//     4. assign the workflow (the real "submit")
//
// If step 4 fails the EPF stays saved (never the other way round), and the
// next click updates that same EPF and retries only the assignment.
//
// Without `submitWithWorkflow` (e.g. editing from the detail page after a
// clarification) the hook only saves, exactly as before.
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
	 * Submit = preview workflow → save EPF → assign workflow. Blocked (nothing
	 * saved) when no workflow exists for the budget.
	 */
	submitWithWorkflow?: boolean;
	/** "Request workflow" clicked because none exists. Host navigates to listing. */
	onRequestWorkflow?: () => void | Promise<void>;
};

export type EpfWorkflowPreview = {
	/** Only relevant when `submitWithWorkflow` is on. */
	enabled: boolean;
	loading: boolean;
	error: unknown;
	rows: any[];
	/** A workflow was found for the current budget. */
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
const PREVIEW_DEBOUNCE_MS = 500;

const workflowPreviewKey = (epcId: string | null, budget: number) =>
	["workflow-preview", SUBJECT_TYPE, epcId, budget] as const;

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

	const displayValues = React.useMemo<EpfFormValues>(() => {
		const budgetValues = calculateBudgetShares(values, eventCost);

		return {
			...values,
			totalParticipants: calculateParticipantsTotal(
				values.externalParticipants,
				values.internalParticipants,
			),
			...budgetValues,
		};
	}, [eventCost, values]);

	/* --------------------------- Workflow preview ---------------------------- */

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

	// Debounced so typing in the overheads table doesn't fire a request per key.
	const [previewBudget, setPreviewBudget] = React.useState(0);
	React.useEffect(() => {
		const timer = window.setTimeout(
			() => setPreviewBudget(eventCost),
			PREVIEW_DEBOUNCE_MS,
		);
		return () => window.clearTimeout(timer);
	}, [eventCost]);

	const previewEnabled =
		submitWithWorkflow &&
		Boolean(epcId) &&
		Boolean(workspaceId) &&
		Boolean(appId) &&
		previewBudget > 0;

	const previewQuery = useQuery({
		queryKey: workflowPreviewKey(epcId, previewBudget),
		queryFn: () => fetchPreviewRows(previewBudget),
		enabled: previewEnabled,
		staleTime: 60 * 1000,
		retry: 1,
	});

	const previewRows = previewQuery.data ?? [];

	const workflowPreview: EpfWorkflowPreview = {
		enabled: submitWithWorkflow,
		loading:
			submitWithWorkflow &&
			(previewBudget !== eventCost || previewQuery.isFetching),
		error: previewQuery.error,
		rows: previewRows,
		hasWorkflow: previewQuery.isSuccess && previewRows.length > 0,
	};

	/* --------------------------- Loading flags ------------------------------- */

	const budgetLoading = budgetQuery.isLoading;
	const budgetError = budgetQuery.isError;

	const refetchBudget = React.useCallback(() => {
		void budgetQuery.refetch();
	}, [budgetQuery]);

	// Used only to disable Reset / Save — NOT to blank the whole form.
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
				"Nothing was submitted. Ask your administrator to set up an approval workflow for this budget, then continue from the listing.",
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
				/* ── Step 1: preview the workflow. None → save NOTHING. ───────── */
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

					let rows: any[];
					try {
						// Always fresh, for exactly this budget.
						rows = await queryClient.fetchQuery({
							queryKey: workflowPreviewKey(epcId, eventCost),
							queryFn: () => fetchPreviewRows(eventCost),
							staleTime: 0,
						});
					} catch (previewError) {
						showToast({
							type: "error",
							title: "No workflow",
							description: getWorkflowErrorMessage(
								previewError,
								"Unable to find an approval workflow for this budget.",
							),
						});
						return;
					}

					if (rows.length === 0) {
						showToast({
							type: "error",
							title: "Cannot submit",
							description: "No approval workflow is assigned to this EPC yet.",
						});
						return;
					}
				}

				/* ── Step 2: save the EPF (create, or update if it exists). ───── */
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

				/* ── Step 3: attach the workflow — the actual submit. ─────────── */
				if (submitWithWorkflow) {
					setAssigning(true);
					try {
						await workflowApi.assignWorkflow({
							subjectType: SUBJECT_TYPE,
							subjectId: epcId,
							workspaceId: workspaceId as string,
							appId: appId as string,
							criteria: { budget: eventCost },
						});
					} catch (assignError) {
						console.error("Workflow assignment failed:", assignError);

						await queryClient.invalidateQueries({
							queryKey: epcKeys.detail(epcId),
						});

						showToast({
							type: "error",
							title: "EPF saved, not submitted",
							description: getWorkflowErrorMessage(
								assignError,
								"Unable to start the approval workflow.",
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
			eventCost,
			fetchPreviewRows,
			navigate,
			onSuccess,
			queryClient,
			showToast,
			submitWithWorkflow,
			submitting,
			updateEpfMutation,
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
		workflowPreview,
		handleChange,
		handleReset,
		handleSubmit,
		handleRequestWorkflow,
	};
};
