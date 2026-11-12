// hooks/useCppRequestForm.ts — form, tabs, and the (mock) save / submit actions.
// Save draft / Submit only console.log the data for now; swap the two TODO
// lines for the real API calls once the CPP endpoints exist.
import { useCallback, useState } from "react";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import { useToast } from "../../../context/Auth/AuthContext";
import type { CppFormValues, CppTabKey } from "../types/cpp.types";
import { cppSchema } from "../utils/cpp.schema";
import { getDefaultValues } from "../utils/cpp.utils";

export const CPP_LISTING_PATH = "/cpp/requests";

// Which tab owns which top-level form key (for error dots + jump-to-first-error).
const TAB_FOR_KEY: Record<string, CppTabKey> = {
	suppliers: "purchasing",
	parts: "purchasing",
	other: "other",
	masterData: "master",
	financial: "financial",
	workflow: "workflow",
	amortisation: "amortisation",
};
const TAB_ORDER: CppTabKey[] = ["purchasing", "other", "master", "financial", "workflow", "tracker", "amortisation"];

export const getTabsWithErrors = (errors: FieldErrors<CppFormValues>): CppTabKey[] => {
	const found = new Set<CppTabKey>();
	Object.keys(errors).forEach((key) => {
		const tab = TAB_FOR_KEY[key];
		if (tab) found.add(tab);
	});
	return TAB_ORDER.filter((tab) => found.has(tab));
};

export const useCppRequestForm = () => {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const [activeTab, setActiveTab] = useState<CppTabKey>("purchasing");
	const [busy, setBusy] = useState(false);

	const form = useForm<CppFormValues>({
		defaultValues: getDefaultValues(),
		resolver: zodResolver(cppSchema) as unknown as Resolver<CppFormValues>,
		mode: "onSubmit",
		reValidateMode: "onChange",
	});

	const saveDraft = useCallback(async () => {
		setBusy(true);
		try {
			// TODO: replace with cppApi.saveDraft(values)
			console.log("[CPP] Save draft →", form.getValues());
			showToast({ type: "success", title: "Draft saved", description: "Check the console for the saved data." });
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
				showToast({
					type: "success",
					title: "Submitted",
					description: `Sent to ${values.workflow.authority} for approval (mock).`,
				});
			} finally {
				setBusy(false);
			}
		},
		(errors) => {
			console.log("[CPP] Submit blocked — validation errors →", errors);
			const firstTab = getTabsWithErrors(errors)[0];
			if (firstTab) setActiveTab(firstTab);
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

	return { form, activeTab, setActiveTab, busy, saveDraft, submit, cancel };
};
