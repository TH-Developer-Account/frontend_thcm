// hooks/useCppRequestForm.ts — form, wizard steps, and the real save flow.
//
// Save draft:  POST /cpp (first save) or PUT /cpp/:id
//              -> upload new files / delete removed files
//              -> re-fetch the detail, so the form shows what the server stored
//                 (attachments, derived fields).
// Submit:      validates every step, saves, then calls POST /cpp/:id/submit
//              (the server picks the approval band and starts the workflow).
import { useCallback, useEffect, useRef, useState } from "react";
import {
	useForm,
	type FieldErrors,
	type FieldPath,
	type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { useToast } from "../../../context/Auth/AuthContext";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { cppApi } from "../api/cpp.api";
import {
	detailToForm,
	formToPayload,
	pendingFileChanges,
} from "../helpers/cpp.mapper";
import type { CppDetail, CppFormValues, CppStepKey } from "../types/cpp.types";
import { cppKeys, useCppDetail, useCppMutations } from "./useCppMutations";
import { CPP_STATUS } from "../utils/cpp.constants";
import { cppSchema } from "../utils/cpp.schema";
import { CPP_STEPS, getDefaultValues } from "../utils/cpp.utils";

export const CPP_LISTING_PATH = "/cpp/listing";

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
		"workflow.plants",
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
	master: [],
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
	masterData: "master",
	other: "other",
	attachments: "attachments",
};

export const getStepsWithErrors = (
	errors: FieldErrors<CppFormValues>,
): CppStepKey[] => {
	const found = new Set<CppStepKey>();
	Object.keys(errors).forEach((key) => {
		const step = STEP_FOR_KEY[key];
		if (step) found.add(step);
	});
	return CPP_STEPS.map((step) => step.key).filter((key) => found.has(key));
};

const scrollToTop = () => {
	if (typeof window !== "undefined")
		window.scrollTo({ top: 0, behavior: "smooth" });
};

export const useCppRequestForm = () => {
	const navigate = useNavigate();
	const { id: routeId } = useParams<{ id: string }>();
	const { showToast } = useToast();
	const queryClient = useQueryClient();
	const {
		createMutation,
		updateMutation,
		uploadAttachmentMutation,
		deleteAttachmentMutation,
	} = useCppMutations();
	const [stepIndex, setStepIndex] = useState(0);
	const [busy, setBusy] = useState(false);

	/** What the server holds right now — needed for the file diff. */
	const serverRef = useRef<CppDetail | null>(null);
	const loadedIdRef = useRef<string | null>(null);

	const form = useForm<CppFormValues>({
		defaultValues: getDefaultValues(),
		resolver: zodResolver(cppSchema) as unknown as Resolver<CppFormValues>,
		mode: "onSubmit",
		reValidateMode: "onChange",
	});

	/* ---- editing an existing draft: load once, then the form owns the data ---- */
	const detailQuery = useCppDetail(routeId ?? "");
	useEffect(() => {
		const detail = detailQuery.data;
		if (!routeId || !detail || loadedIdRef.current === detail.id) return;
		if (detail.status !== CPP_STATUS.DRAFT) {
			navigate(`/cpp/${detail.id}/view`, { replace: true });
			return;
		}
		loadedIdRef.current = detail.id;
		serverRef.current = detail;
		form.reset(detailToForm(detail));
	}, [detailQuery.data, form, navigate, routeId]);

	const step = CPP_STEPS[stepIndex];
	const isFirst = stepIndex === 0;
	const isLast = stepIndex === CPP_STEPS.length - 1;

	const goToStep = useCallback((key: CppStepKey) => {
		const index = CPP_STEPS.findIndex((item) => item.key === key);
		if (index >= 0) {
			setStepIndex(index);
			scrollToTop();
		}
	}, []);

	const goBack = useCallback(() => {
		setStepIndex((index) => Math.max(index - 1, 0));
		scrollToTop();
	}, []);

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
		setStepIndex((index) => Math.min(index + 1, CPP_STEPS.length - 1));
		scrollToTop();
	}, [form, showToast, step.key]);

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
					title: "Draft saved",
					description: saved.referenceNumber,
				});
		} finally {
			setBusy(false);
		}
	}, [form, persist, showToast]);

	const submit = form.handleSubmit(
		async (values) => {
			setBusy(true);
			try {
				const saved = await persist(values);
				if (!saved) return;
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
			const firstStep = getStepsWithErrors(errors)[0];
			if (firstStep) goToStep(firstStep);
			showToast({
				type: "error",
				title: "Fix the highlighted fields",
				description: "Some required details are missing or invalid.",
			});
		},
	);

	const cancel = useCallback(() => navigate(CPP_LISTING_PATH), [navigate]);

	return {
		form,
		step,
		isFirst,
		isLast,
		busy,
		isEditing: Boolean(routeId),
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
