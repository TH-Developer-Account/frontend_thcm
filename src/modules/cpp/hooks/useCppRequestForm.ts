// hooks/useCppRequestForm.ts — form, wizard steps, and the (mock) save / submit actions.
// Save draft / Submit only console.log the data for now; swap the two TODO
// lines for the real API calls once the CPP endpoints exist.
import { useCallback, useState } from "react";
import {
	useForm,
	type FieldErrors,
	type FieldPath,
	type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import { useToast } from "../../../context/Auth/AuthContext";
import type { CppFormValues, CppStepKey } from "../types/cpp.types";
import { CPP_CONDITIONS } from "../utils/cpp.constants";
import { cppSchema } from "../utils/cpp.schema";
import { CPP_STEPS, getDefaultValues } from "../utils/cpp.utils";

export const CPP_LISTING_PATH = "/cpp/requests";

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
	// STEP_FIELDS
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
	const { showToast } = useToast();
	const [stepIndex, setStepIndex] = useState(0);
	const [busy, setBusy] = useState(false);

	const form = useForm<CppFormValues>({
		defaultValues: getDefaultValues(),
		resolver: zodResolver(cppSchema) as unknown as Resolver<CppFormValues>,
		mode: "onSubmit",
		reValidateMode: "onChange",
	});

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

	const saveDraft = useCallback(async () => {
		setBusy(true);
		try {
			// TODO: replace with cppApi.saveDraft(values)
			console.log("[CPP] Save draft →", form.getValues());
			showToast({
				type: "success",
				title: "Draft saved",
				description: "Check the console for the saved data.",
			});
		} finally {
			setBusy(false);
		}
	}, [form, showToast]);

	const submit = form.handleSubmit(
		async (values) => {
			setBusy(true);
			try {
				// TODO: replace with cppApi.submit(values) (+ workflow attach)
				console.log("[CPP] Submit for approval →", values);
				const condition = CPP_CONDITIONS.find(
					(c) => c.value === values.condition,
				);
				showToast({
					type: "success",
					title: "Submitted",
					description: `${condition?.label ?? "CPP"} request sent for approval (mock).`,
				});
			} finally {
				setBusy(false);
			}
		},
		(errors) => {
			console.log("[CPP] Submit blocked — validation errors →", errors);
			const firstStep = getStepsWithErrors(errors)[0];
			if (firstStep) goToStep(firstStep);
			showToast({
				type: "error",
				title: "Fix the highlighted fields",
				description: "Some required details are missing or invalid.",
			});
		},
	);

	const cancel = useCallback(() => {
		console.log("[CPP] Cancel →", form.getValues());
		navigate(CPP_LISTING_PATH);
	}, [form, navigate]);

	return {
		form,
		step,
		isFirst,
		isLast,
		busy,
		goNext,
		goBack,
		saveDraft,
		submit,
		cancel,
	};
};
