// hooks/useCppRequestForm.ts — form, wizard steps, and the real save flow.
//
// Save draft:  POST /cpp (first save) or PUT /cpp/:id
//              -> upload new files / delete removed files
//              -> re-fetch the detail, so the form shows what the server stored
//                 (attachments, summary sheet parts, derived fields).
// Next:        validates ONLY the current step (utils/cpp.steps.ts), shows the
//              inline errors and focuses the first invalid field of the step.
// Submit:      validates every step. On failure it opens the step that holds the
//              FIRST invalid field (step order, then screen order) and focuses
//              that field. Otherwise saves, then POST /cpp/:id/submit.
// Resubmit:    same page, opened on a CLARIFICATION_REQUESTED request by the
//              proposer. "Resubmit" validates, saves (PUT /cpp/:id), then calls
//              POST /cpp/:id/resubmit (the server picks the band again).
//
// Who may open this page: only the proposer, and only for a draft or a request
// sent back for clarification (helpers/cpp.permissions.ts). Anyone else is sent
// to the view page.
//
// Steps are dynamic: the Amortisation step is only there when the pricing
// condition is PB50 (getCppSteps).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
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
import type { CppDetail, CppFormValues, CppStepKey } from "../types/cpp.types";
import { cppKeys, useCppDetail, useCppMutations } from "./useCppMutations";
import {
	useCppPermissions,
	type CppPermissionRecord,
} from "./useCppPermissions";
import { cppSchema } from "../utils/cpp.schema";
import { CPP_CLARIFICATION_STATUS } from "../helpers/cpp.permissions";
import { getCppSteps, getDefaultValues } from "../utils/cpp.utils";
import {
	firstErrorPath,
	focusField,
	stepOfPath,
	stepTriggerPaths,
} from "../utils/cpp.steps";

export const CPP_LISTING_PATH = "/cpp/listing";

type ResubmitResponse = {
	success: boolean;
	message?: string;
	data: { workflowId: string; ruleId: string; stages: number };
};

/** Wait for the step to render (and the summary to settle) before focusing. */
const FOCUS_DELAY_MS = 120;

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

	/* ---- resubmit: restart the SAME workflow at stage 1 after a clarification ---- */
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
	/** Field to focus once its step is on screen. */
	const [focusTarget, setFocusTarget] = useState<{ path: string } | null>(
		null,
	);

	/** What the server holds right now — needed for the file diff. */
	const serverRef = useRef<CppDetail | null>(null);
	const loadedIdRef = useRef<string | null>(null);

	const form = useForm<CppFormValues>({
		defaultValues: getDefaultValues(),
		resolver: zodResolver(cppSchema) as unknown as Resolver<CppFormValues>,
		mode: "onSubmit",
		reValidateMode: "onChange",
		// Focus is handled by focusTarget below, after the right step renders.
		shouldFocusError: false,
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
	const permissions = useCppPermissions(
		detailQuery.data as unknown as CppPermissionRecord | undefined,
	);
	useEffect(() => {
		const detail = detailQuery.data;
		if (!routeId || !detail || loadedIdRef.current === detail.id) return;
		// The proposer check needs the signed-in user, so wait for it.
		if (!user?.id) return;

		// Only the proposer edits, and only a draft or a request sent back for
		// clarification. Everyone else is sent to the view page.
		if (!permissions.canEdit) {
			navigate(`/cpp/${detail.id}/view`, { replace: true });
			return;
		}

		loadedIdRef.current = detail.id;
		serverRef.current = detail;
		setIsResubmit(String(detail.status) === CPP_CLARIFICATION_STATUS);
		form.reset(detailToForm(detail));
	}, [
		detailQuery.data,
		form,
		navigate,
		permissions.canEdit,
		routeId,
		user?.id,
	]);

	const step = steps[safeIndex];
	const isFirst = safeIndex === 0;
	const isLast = safeIndex === steps.length - 1;

	/* ---- focus the requested field once its step has rendered ---- */
	useEffect(() => {
		if (!focusTarget) return;
		const timer = window.setTimeout(() => {
			if (!focusField(focusTarget.path)) scrollToTop();
			setFocusTarget(null);
		}, FOCUS_DELAY_MS);
		return () => window.clearTimeout(timer);
	}, [focusTarget, step.key]);

	const goToStep = useCallback(
		(key: CppStepKey) => {
			const index = steps.findIndex((item) => item.key === key);
			if (index >= 0) setStepIndex(index);
			return index >= 0;
		},
		[steps],
	);

	/** Opens the step that owns `path` and focuses the field. */
	const showField = useCallback(
		(path: string) => {
			const key = stepOfPath(path);
			if (key) goToStep(key);
			setFocusTarget({ path });
		},
		[goToStep],
	);

	const goBack = useCallback(() => {
		setStepIndex((index) => Math.max(Math.min(index, steps.length - 1) - 1, 0));
		scrollToTop();
	}, [steps.length]);

	const goNext = useCallback(async () => {
		const fields = stepTriggerPaths(step.key);
		const valid = fields.length
			? await form.trigger(fields, { shouldFocus: false })
			: true;
		if (!valid) {
			const path = firstErrorPath(form.formState.errors, steps, step.key);
			if (path) setFocusTarget({ path });
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
	}, [form, showToast, step.key, steps]);

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
				// exactly what the server stored (incl. the parts read from the summary sheet).
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
			const path = firstErrorPath(errors, steps);
			if (path) showField(path);
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
		goToStep,
		showField,
		saveDraft,
		submit,
		cancel,
	};
};
