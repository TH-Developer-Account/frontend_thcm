// modules/audit/shared/templates/AuditTemplateBuilder.tsx
//
// Shared 3-step template builder (Details → Build checklist → Review).
//
// Each step owns its own react-hook-form instance + zod schema, so a step
// validates only its own fields. Both forms are created here (not inside
// the step components) so values survive moving between steps without
// being copied into extra state.
//
// The builder knows nothing about Dealer vs Factory payloads — it emits
// AuditTemplateBuilderValues and the module's mapper does the rest.

import {
	useEffect,
	useMemo,
	useState,
	type FormEvent,
	type ReactNode,
} from "react";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Button from "../../../../components/common/Button";
import AuditConfirmModal from "../components/AuditConfirmModal";
import AuditTemplateBuildStep from "./AuditTemplateBuildStep";
import AuditTemplateDetailsStep from "./AuditTemplateDetailsStep";
import AuditTemplatePreview from "./AuditTemplatePreview";
import AuditTemplateStepper, {
	AUDIT_TEMPLATE_STEP_ORDER,
	type AuditTemplateBuilderStep,
} from "./AuditTemplateStepper";
import {
	createAuditTemplateBuildSchema,
	createAuditTemplateDetailsSchema,
} from "./audit-template.schemas";
import type {
	AuditTemplateBuildFormValues,
	AuditTemplateBuilderValues,
	AuditTemplateDetailsFormValues,
	AuditTemplateFieldConfig,
} from "./audit.template.types";
import { createEmptyBuilderValues } from "./audit-template.utils";

export interface AuditTemplateBuilderProps {
	/** Template-level fields (facility type, category, plant …). */
	detailFields: readonly AuditTemplateFieldConfig[];
	/** Parameter-level fields (function area, category, severity …). */
	parameterFields: readonly AuditTemplateFieldConfig[];
	/** Existing template (edit mode). Read once on mount — remount with a `key` to reload. */
	initialValues?: AuditTemplateBuilderValues;
	namePlaceholder?: string;

	/** Rendered above the stepper (e.g. "editing a published version" notice). */
	notice?: ReactNode;
	isSaving?: boolean;
	isPublishing?: boolean;
	lastSavedLabel?: string | null;

	onCancel: () => void;
	/**
	 * Persist a draft. Resolve with the server's version of the template
	 * so newly created ids are picked up; resolve `null` when saving failed
	 * (the hook has already shown the error) to keep the user's edits.
	 */
	onSaveDraft: (
		values: AuditTemplateBuilderValues,
	) => Promise<AuditTemplateBuilderValues | null>;
	onPublish: (values: AuditTemplateBuilderValues) => Promise<void>;
}

export default function AuditTemplateBuilder({
	detailFields,
	parameterFields,
	initialValues,
	namePlaceholder,
	notice,
	isSaving = false,
	isPublishing = false,
	lastSavedLabel,
	onCancel,
	onSaveDraft,
	onPublish,
}: AuditTemplateBuilderProps) {
	const [defaults] = useState<AuditTemplateBuilderValues>(
		() => initialValues ?? createEmptyBuilderValues(detailFields, parameterFields),
	);

	const [step, setStep] = useState<AuditTemplateBuilderStep>("details");
	// Existing templates were already valid once — let the user jump around.
	const [furthestStepIndex, setFurthestStepIndex] = useState(
		initialValues ? AUDIT_TEMPLATE_STEP_ORDER.length - 1 : 0,
	);
	const [isDiscardOpen, setIsDiscardOpen] = useState(false);

	const detailsSchema = useMemo(
		() => createAuditTemplateDetailsSchema(detailFields),
		[detailFields],
	);
	const buildSchema = useMemo(
		() => createAuditTemplateBuildSchema(parameterFields),
		[parameterFields],
	);

	const detailsForm = useForm<AuditTemplateDetailsFormValues>({
		resolver: zodResolver(detailsSchema),
		defaultValues: defaults.details,
		mode: "onTouched",
	});

	const buildForm = useForm<AuditTemplateBuildFormValues>({
		resolver: zodResolver(buildSchema),
		defaultValues: { sections: defaults.sections },
		mode: "onTouched",
	});

	const isBusy = isSaving || isPublishing;
	const stepIndex = AUDIT_TEMPLATE_STEP_ORDER.indexOf(step);
	const isDirty = detailsForm.formState.isDirty || buildForm.formState.isDirty;

	// Browser-level guard (refresh / tab close) while there are unsaved edits.
	useEffect(() => {
		if (!isDirty) return;
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isDirty]);

	const goToStep = (nextStep: AuditTemplateBuilderStep) => {
		const nextIndex = AUDIT_TEMPLATE_STEP_ORDER.indexOf(nextStep);
		setFurthestStepIndex((current) => Math.max(current, nextIndex));
		setStep(nextStep);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const collectValues = (): AuditTemplateBuilderValues => ({
		details: detailsForm.getValues(),
		sections: buildForm.getValues("sections"),
	});

	/** Validates the forms the user has reached; jumps to the first invalid one. */
	const validateReachedSteps = async (
		options: { requireBuild: boolean },
	): Promise<boolean> => {
		const isDetailsValid = await detailsForm.trigger(undefined, {
			shouldFocus: step === "details",
		});
		if (!isDetailsValid) {
			if (step !== "details") setStep("details");
			return false;
		}

		const shouldValidateBuild = options.requireBuild || furthestStepIndex >= 1;
		if (!shouldValidateBuild) return true;

		const isBuildValid = await buildForm.trigger(undefined, {
			shouldFocus: step === "build",
		});
		if (!isBuildValid) {
			if (step !== "build") setStep("build");
			return false;
		}
		return true;
	};

	const handleContinue = async () => {
		if (step === "details") {
			const isValid = await detailsForm.trigger(undefined, { shouldFocus: true });
			if (isValid) goToStep("build");
			return;
		}
		if (step === "build") {
			const isValid = await buildForm.trigger(undefined, { shouldFocus: true });
			if (isValid) goToStep("review");
		}
	};

	const handleSaveDraft = async () => {
		if (isBusy) return;
		const isValid = await validateReachedSteps({ requireBuild: false });
		if (!isValid) return;

		const savedValues = await onSaveDraft(collectValues());
		if (!savedValues) return;

		// Sync with server ids and clear the dirty flag.
		detailsForm.reset(savedValues.details);
		buildForm.reset({ sections: savedValues.sections });
	};

	const handleSaveAndContinue = async () => {
		if (isBusy) return;
		const isValid =
			step === "details"
				? await detailsForm.trigger(undefined, { shouldFocus: true })
				: await buildForm.trigger(undefined, { shouldFocus: true });
		if (!isValid) return;

		const savedValues = await onSaveDraft(collectValues());
		if (!savedValues) return;

		detailsForm.reset(savedValues.details);
		buildForm.reset({ sections: savedValues.sections });
		goToStep(step === "details" ? "build" : "review");
	};

	const handlePublish = async () => {
		if (isBusy) return;
		const isValid = await validateReachedSteps({ requireBuild: true });
		if (!isValid) return;
		await onPublish(collectValues());
	};

	const handleCancel = () => {
		if (isDirty) {
			setIsDiscardOpen(true);
			return;
		}
		onCancel();
	};

	const handleBack = () => {
		const previous = AUDIT_TEMPLATE_STEP_ORDER[Math.max(stepIndex - 1, 0)];
		setStep(previous);
	};

	const handleStepSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		void handleContinue();
	};

	return (
		<div className="pb-24">
			{notice ? <div className="mb-4">{notice}</div> : null}

			<AuditTemplateStepper
				currentStep={step}
				furthestStepIndex={furthestStepIndex}
				onStepSelect={(nextStep) => {
					// Moving forward via the stepper still validates the current step.
					const nextIndex = AUDIT_TEMPLATE_STEP_ORDER.indexOf(nextStep);
					if (nextIndex > stepIndex) {
						void handleContinue();
						return;
					}
					setStep(nextStep);
				}}
			/>

			{step === "details" ? (
				<AuditTemplateDetailsStep
					form={detailsForm}
					detailFields={detailFields}
					namePlaceholder={namePlaceholder}
					disabled={isBusy}
					onSubmit={handleStepSubmit}
				/>
			) : null}

			{step === "build" ? (
				<AuditTemplateBuildStep
					form={buildForm}
					parameterFields={parameterFields}
					disabled={isBusy}
					onSubmit={handleStepSubmit}
				/>
			) : null}

			{step === "review" ? (
				<AuditTemplatePreview
					values={collectValues()}
					detailFields={detailFields}
					parameterFields={parameterFields}
				/>
			) : null}

			<footer
				className="fixed inset-x-0 bottom-0 z-20 border-t border-(--color-border-default) bg-(--color-bg-surface) px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:sticky sm:mt-6 sm:rounded-xl sm:border"
				aria-label="Template builder actions"
			>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex items-center gap-3">
						{step === "details" ? (
							<Button
								text="Cancel"
								variant="outline"
								disabled={isBusy}
								onClick={handleCancel}
							/>
						) : (
							<Button
								text="Back"
								variant="outline"
								Icon={ArrowLeft}
								disabled={isBusy}
								onClick={handleBack}
							/>
						)}
						<span
							className="hidden text-xs text-(--color-text-secondary) sm:inline"
							aria-live="polite"
						>
							{isSaving
								? "Saving…"
								: isDirty
									? "Unsaved changes"
									: lastSavedLabel ?? ""}
						</span>
					</div>

					<div className="flex items-center gap-2">
						<Button
							text="Save draft"
							variant="outline"
							Icon={Save}
							loading={isSaving}
							disabled={isBusy}
							onClick={() => void handleSaveDraft()}
						/>
						{step === "review" ? (
							<Button
								text="Publish"
								variant="brand"
								Icon={Check}
								loading={isPublishing}
								disabled={isBusy}
								onClick={() => void handlePublish()}
							/>
						) : (
							<Button
								text="Save & continue"
								variant="brand"
								Icon={ArrowRight}
								iconPosition="right"
								disabled={isBusy}
								onClick={() => void handleSaveAndContinue()}
							/>
						)}
					</div>
				</div>
			</footer>

			<AuditConfirmModal
				open={isDiscardOpen}
				title="Discard changes?"
				warningTitle="You have unsaved changes"
				warningDescription="Leaving now will discard everything you changed since the last save."
				confirmLabel="Discard & leave"
				tone="warning"
				onClose={() => setIsDiscardOpen(false)}
				onConfirm={() => {
					setIsDiscardOpen(false);
					onCancel();
				}}
			/>
		</div>
	);
}
