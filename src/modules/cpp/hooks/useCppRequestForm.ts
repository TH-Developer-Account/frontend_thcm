// hooks/useCppRequestForm.ts — form, wizard steps, and the real save flow.
//
// Save draft:  POST /cpp (first save) or PUT /cpp/:id
//              -> upload new files / delete removed files
//              -> re-fetch the detail, so the form shows what the server stored
//                 (attachments, derived fields).
// Submit:      validates every step, saves, then calls POST /cpp/:id/submit
//              (the server picks the approval band and starts the workflow).
// Resubmit:    same page, opened on a CLARIFICATION_REQUESTED request by the
//              proposer. Every step is editable; "Resubmit" validates every step,
//              saves (PUT /cpp/:id), then calls POST /cpp/:id/resubmit (the server
//              picks the band again from the edited data and restarts the workflow).
//
// Steps are dynamic: the Amortisation step is only there when the pricing
// condition is PB50 (getCppSteps). The pricing condition is picked in step 1,
// so the steps after it never change under the user's feet.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	useForm,
	useWatch,
	type FieldErrors,
	type FieldPath,
	type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth, useToast } from "../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../services/ServerAxios";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { cppApi } from "../api/cpp.api";
import {
	detailToForm,
	formToPayload,
	pendingFileChanges,
} from "../helpers/cpp.mapper";
import type {
	CppDetail,
	CppFormValues,
	CppStep,
	CppStepKey,
} from "../types/cpp.types";
import { cppKeys, useCppDetail, useCppMutations } from "./useCppMutations";
import { CPP_STATUS } from "../utils/cpp.constants";
import { cppSchema } from "../utils/cpp.schema";
import { getCppSteps, getDefaultValues } from "../utils/cpp.utils";

export const CPP_LISTING_PATH = "/cpp/listing";

const CLARIFICATION_STATUS = "CLARIFICATION_REQUESTED";

type ResubmitResponse = {
	success: boolean;
	message?: string;
	data: { workflowId: string; ruleId: string; stages: number };
};

// Fields each step owns — "Next" validates exactly these.
const STEP_FIELDS: Record<CppStepKey, FieldPath<CppFormValues>[]> = {
	basic: [
		"category",
		"plant",
		"condition",
		"materialType",
		"effects",
		"reason",
		"justification",
		"priceType",
		"workflow.models",
		"workflow.pricingCondition",
	],
	purchasing: [
		"suppliers.existing.name",
		"suppliers.recommended.name",
		"purchasingFile",
		"approvalValues.partValue",
		"approvalValues.variationPct",
		"approvalValues.amount",
	],
	amortisation: ["amortisation"],
	// Optional tables — only number format is checked.
	volumes: ["volumes", "perMachineImpact", "costTracker"],
	master: ["masterData.plantDetails"],
	other: [],
	attachments: [],
	workflow: [],
};

// Which step owns which top-level form key (for jump-to-first-error on submit).
const STEP_FOR_KEY: Record<string, CppStepKey> = {
	category: "basic",
	plant: "basic",
	condition: "basic",
	materialType: "basic",
	effects: "basic",
	reason: "basic",
	justification: "basic",
	priceType: "basic",
	workflow: "basic",
	suppliers: "purchasing",
	purchasingFile: "purchasing",
	approvalValues: "purchasing",
	amortisation: "amortisation",
	volumes: "volumes",
	perMachineImpact: "volumes",
	costTracker: "volumes",
	masterData: "master",
	other: "other",
	attachments: "attachments",
};

export const getStepsWithErrors = (
	errors: FieldErrors<CppFormValues>,
	steps: CppStep[],
): CppStepKey[] => {
	const found = new Set<CppStepKey>();
	Object.keys(errors).forEach((key) => {
		const step = STEP_FOR_KEY[key];
		if (step) found.add(step);
	});
	return steps.map((step) => step.key).filter((key) => found.has(key));
};

const scrollToTop = () => {
	if (typeof window !== "undefined")
		window.scrollTo({ top: 0, behavior: "smooth" });
};

export const useCppRequestForm = () => {
	const navigate = useNavigate();
	const { id: routeId } = useParams<{ id: string }>();
	const { user } = useAuth();
	const { showToast } = useToast();
	const queryClient = useQueryClient();
	const {
		createMutation,
		updateMutation,
		uploadAttachmentMutation,
		deleteAttachmentMutation,
	} = useCppMutations();

	/* ---- resubmit: restart the SAME workflow at stage 1 after a clarification ----
	 * The server re-picks the band and approvers from the saved data, so no
	 * workflow id or template is sent from the browser. */
	const resubmitMutation = useMutation({
		mutationFn: async (id: string) => {
			const { data } = await ServerAxios.post<ResubmitResponse>(
				`/cpp/${encodeURIComponent(id)}/resubmit`,
			);
			return data;
		},
		onSuccess: async (response, id) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: cppKeys.detail(id) }),
				queryClient.invalidateQueries({ queryKey: cppKeys.lists() }),
			]);
			showToast({
				type: "success",
				title: "Resubmitted",
				description:
					response.message ?? "Approval restarts from the first stage.",
			});
		},
		onError: (error) =>
			showToast({
				type: "error",
				title: "Changes saved, not resubmitted",
				description: getApiErrorMessage(
					error,
					"Unable to restart the approval. Please try again.",
				),
			}),
	});

	/** Resolves true when the request is back in approval (toast already shown). */
	const resubmit = useCallback(
		async (id: string): Promise<boolean> => {
			try {
				await resubmitMutation.mutateAsync(id);
				return true;
			} catch {
				return false;
			}
		},
		[resubmitMutation],
	);
	const [stepIndex, setStepIndex] = useState(0);
	const [busy, setBusy] = useState(false);
	/** True while editing a request the approver sent back for clarification. */
	const [isResubmit, setIsResubmit] = useState(false);

	/** What the server holds right now — needed for the file diff. */
	const serverRef = useRef<CppDetail | null>(null);
	const loadedIdRef = useRef<string | null>(null);

	const form = useForm<CppFormValues>({
		defaultValues: getDefaultValues(),
		resolver: zodResolver(cppSchema) as unknown as Resolver<CppFormValues>,
		mode: "onSubmit",
		reValidateMode: "onChange",
	});

	/* ---- steps follow the pricing condition (PB50 adds Amortisation) ---- */
	const pricingCondition = useWatch({
		control: form.control,
		name: "workflow.pricingCondition",
	});
	const steps = useMemo(
		() => getCppSteps(pricingCondition ?? ""),
		[pricingCondition],
	);
	const safeIndex = Math.min(stepIndex, steps.length - 1);

	/* ---- editing an existing request: load once, then the form owns the data ---- */
	const detailQuery = useCppDetail(routeId ?? "");
	useEffect(() => {
		const detail = detailQuery.data;
		if (!routeId || !detail || loadedIdRef.current === detail.id) return;

		// Only drafts and clarification requests are editable, and only by the
		// proposer (same rule as the approval flow in the other modules).
		const status = String(detail.status);
		const detailRecord = detail as unknown as {
			initiatedById?: string;
			initiatedBy?: { id?: string } | null;
		};
		const ownerId = detailRecord.initiatedById ?? detailRecord.initiatedBy?.id;
		const isClarification = status === CLARIFICATION_STATUS;
		const isDraft = status === CPP_STATUS.DRAFT;
		const notOwner = Boolean(ownerId && user?.id && ownerId !== user.id);

		if ((!isDraft && !isClarification) || (isClarification && notOwner)) {
			navigate(`/cpp/${detail.id}/view`, { replace: true });
			return;
		}
		loadedIdRef.current = detail.id;
		serverRef.current = detail;
		setIsResubmit(isClarification);
		form.reset(detailToForm(detail));
	}, [detailQuery.data, form, navigate, routeId, user?.id]);

	const step = steps[safeIndex];
	const isFirst = safeIndex === 0;
	const isLast = safeIndex === steps.length - 1;

	const goToStep = useCallback(
		(key: CppStepKey) => {
			const index = steps.findIndex((item) => item.key === key);
			if (index >= 0) {
				setStepIndex(index);
				scrollToTop();
			}
		},
		[steps],
	);

	const goBack = useCallback(() => {
		setStepIndex((index) => Math.max(Math.min(index, steps.length - 1) - 1, 0));
		scrollToTop();
	}, [steps.length]);

	const goNext = useCallback(async () => {
		const fields = STEP_FIELDS[step.key];
		const valid = fields.length ? await form.trigger(fields) : true;
		if (!valid) {
			showToast({
				type: "error",
				title: "Fix the highlighted fields",
				description: "Complete this step before moving on.",
			});
			return;
		}
		setStepIndex((index) =>
			Math.min(Math.min(index, steps.length - 1) + 1, steps.length - 1),
		);
		scrollToTop();
	}, [form, showToast, step.key, steps.length]);

	/**
	 * Saves everything and returns the fresh server copy (or null on failure —
	 * the toast has already been shown).
	 */
	const persist = useCallback(
		async (values: CppFormValues): Promise<CppDetail | null> => {
			try {
				let current = serverRef.current;
				if (!current) {
					const created = await createMutation.mutateAsync(
						formToPayload(values),
					);
					current = created.data;
				} else {
					const updated = await updateMutation.mutateAsync({
						id: current.id,
						payload: formToPayload(values),
					});
					current = updated.data;
				}

				// Files: one request each; re-read the detail at the end so the form shows
				// exactly what the server stored.
				let filesChanged = false;
				for (const change of pendingFileChanges(values, current.attachments)) {
					filesChanged = true;
					if (change.kind === "delete")
						await deleteAttachmentMutation.mutateAsync({
							id: current.id,
							attachmentId: change.attachmentId,
						});
					else
						await uploadAttachmentMutation.mutateAsync({
							id: current.id,
							file: change.file,
							type: change.slot,
						});
				}
				const fresh = filesChanged ? await cppApi.getById(current.id) : current;

				serverRef.current = fresh;
				queryClient.setQueryData(cppKeys.detail(fresh.id), fresh);
				loadedIdRef.current = fresh.id;
				form.reset(detailToForm(fresh), { keepErrors: true });
				if (!routeId) navigate(`/cpp/${fresh.id}/edit`, { replace: true });
				return fresh;
			} catch (error) {
				showToast({
					type: "error",
					title: "Could not save",
					description: getApiErrorMessage(error, "Please try again."),
				});
				return null;
			}
		},
		[
			createMutation,
			deleteAttachmentMutation,
			form,
			navigate,
			queryClient,
			routeId,
			showToast,
			updateMutation,
			uploadAttachmentMutation,
		],
	);

	const saveDraft = useCallback(async () => {
		setBusy(true);
		try {
			const saved = await persist(form.getValues());
			if (saved)
				showToast({
					type: "success",
					title: isResubmit ? "Changes saved" : "Draft saved",
					description: saved.referenceNumber,
				});
		} finally {
			setBusy(false);
		}
	}, [form, isResubmit, persist, showToast]);

	const submit = form.handleSubmit(
		async (values) => {
			setBusy(true);
			try {
				const saved = await persist(values);
				if (!saved) return;

				// Clarification: the changes are saved; now restart the approval.
				// resubmit() shows its own success / error toast and refreshes
				// the detail and listing. On failure the user stays here with the
				// changes saved and can press Resubmit again.
				if (isResubmit) {
					const ok = await resubmit(saved.id);
					if (ok) navigate(`/cpp/${saved.id}/view`, { replace: true });
					return;
				}

				try {
					await cppApi.submit(saved.id);
					void queryClient.invalidateQueries({ queryKey: cppKeys.lists() });
					void queryClient.invalidateQueries({
						queryKey: cppKeys.detail(saved.id),
					});
					showToast({
						type: "success",
						title: "Submitted for approval",
						description: saved.referenceNumber,
					});
					navigate(`/cpp/${saved.id}/view`, { replace: true });
				} catch (error) {
					// The draft is saved; the message says what blocks the approval
					// (for example a role with nobody assigned in the approval matrix).
					showToast({
						type: "error",
						title: "Saved, but could not submit",
						description: getApiErrorMessage(error, "Please try again."),
					});
				}
			} finally {
				setBusy(false);
			}
		},
		(errors) => {
			const firstStep = getStepsWithErrors(errors, steps)[0];
			if (firstStep) goToStep(firstStep);
			showToast({
				type: "error",
				title: "Fix the highlighted fields",
				description: "Some required details are missing or invalid.",
			});
		},
	);

	const cancel = useCallback(
		() =>
			navigate(
				isResubmit && serverRef.current
					? `/cpp/${serverRef.current.id}/view`
					: CPP_LISTING_PATH,
			),
		[isResubmit, navigate],
	);

	return {
		form,
		steps,
		step,
		isFirst,
		isLast,
		busy,
		isEditing: Boolean(routeId),
		/** Editing a request sent back for clarification — show "Resubmit". */
		isResubmit,
		isLoading: Boolean(routeId) && detailQuery.isLoading,
		loadError: detailQuery.isError
			? getApiErrorMessage(detailQuery.error, "Unable to load this request.")
			: null,
		referenceNumber: serverRef.current?.referenceNumber ?? null,
		goNext,
		goBack,
		saveDraft,
		submit,
		cancel,
	};
};
