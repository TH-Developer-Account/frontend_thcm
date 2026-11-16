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
//
// Nothing is sent to the server while moving between Details and Build:
// "Continue" only validates the current step and keeps the values in the
// forms. The API is called from the Review step only (Save draft / Publish).

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
import Card from "../../../../components/common/Card";
import { StepProgress } from "../../../../components/ui/StepProgress";
import type { ServerFieldError } from "../audit-error.utils";
import AuditConfirmModal from "../components/AuditConfirmModal";
import AuditTemplateBuildStep from "./AuditTemplateBuildStep";
import AuditTemplateDetailsStep from "./AuditTemplateDetailsStep";
import AuditTemplatePreview from "./AuditTemplatePreview";
import {
	AUDIT_TEMPLATE_PROGRESS_STEPS,
	AUDIT_TEMPLATE_STEP_ORDER,
	type AuditTemplateBuilderStep,
} from "./audit-template.steps";
import {
	createAuditTemplateBuildSchema,
	createAuditTemplateDetailsSchema,
	type AuditTemplateLayout,
	type AuditTemplatePhotoUploader,
} from "./audit-template.schemas";
import type {
	AuditTemplateBuildFormValues,
	AuditTemplateBuilderValues,
	AuditTemplateDetailsFormValues,
	AuditTemplateFieldConfig,
} from "./audit.template.types";
import { createEmptyBuilderValues } from "./audit-template.utils";

/** Where each server validation message belongs in the two builder forms. */
export interface MappedServerFieldErrors {
	details: ReadonlyArray<{ name: string; message: string }>;
	build: ReadonlyArray<{ name: string; message: string }>;
}

/** Handed to onSaveDraft / onPublish so the hook can report 422 field errors. */
export type ApplyServerFieldErrors = (errors: ServerFieldError[]) => void;

export interface AuditTemplateBuilderProps {
	/** Template-level fields (facility type, category, plant …). */
	detailFields: readonly AuditTemplateFieldConfig[];
	/** Parameter-level fields (function area, category, severity …). */
	parameterFields: readonly AuditTemplateFieldConfig[];
	/**
	 * "sections" (default) groups parameters into named sections.
	 * "flat" hides sections: one parameter list, grouped by the first
	 * parameter field (Function) in the review.
	 */
	layout?: AuditTemplateLayout;
	/** Existing template (edit mode). Read once on mount — remount with a `key` to reload. */
	initialValues?: AuditTemplateBuilderValues;
	namePlaceholder?: string;

	/**
	 * Uploads a parameter's reference image and resolves with its storage
	 * key + URL. Passing it shows the optional "Reference image" field on
	 * every parameter; leave it out (Factory Audit) to hide the field.
	 */
	onUploadReferencePhoto?: AuditTemplatePhotoUploader;

	/** Rendered above the step progress (e.g. "editing a published version" notice). */
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
		applyServerErrors: ApplyServerFieldErrors,
	) => Promise<AuditTemplateBuilderValues | null>;
	onPublish: (
		values: AuditTemplateBuilderValues,
		applyServerErrors: ApplyServerFieldErrors,
	) => Promise<unknown>;
	/**
	 * Translates the server's `{ path, message }` validation errors (payload
	 * paths like "parameters.2.title") into form field names. Without it,
	 * server errors are only shown in the toast.
	 */
	mapServerErrors?: (
		errors: readonly ServerFieldError[],
		values: AuditTemplateBuilderValues,
	) => MappedServerFieldErrors;
}

export default function AuditTemplateBuilder({
	detailFields,
	parameterFields,
	layout = "sections",
	initialValues,
	namePlaceholder,
	onUploadReferencePhoto,
	notice,
	isSaving = false,
	isPublishing = false,
	lastSavedLabel,
	onCancel,
	onSaveDraft,
	onPublish,
	mapServerErrors,
}: AuditTemplateBuilderProps) {
	const [defaults] = useState<AuditTemplateBuilderValues>(
		() =>
			initialValues ?? createEmptyBuilderValues(detailFields, parameterFields),
	);

	const [step, setStep] = useState<AuditTemplateBuilderStep>("details");
	// Existing templates were already valid once, so validation covers every
	// step on save/publish even though navigation is Back / Continue only.
	const [furthestStepIndex, setFurthestStepIndex] = useState(
		initialValues ? AUDIT_TEMPLATE_STEP_ORDER.length - 1 : 0,
	);
	const [isDiscardOpen, setIsDiscardOpen] = useState(false);

	const detailsSchema = useMemo(
		() => createAuditTemplateDetailsSchema(detailFields),
		[detailFields],
	);
	const buildSchema = useMemo(
		() => createAuditTemplateBuildSchema(parameterFields, layout),
		[parameterFields, layout],
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
	const validateReachedSteps = async (options: {
		requireBuild: boolean;
	}): Promise<boolean> => {
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

	/**
	 * Puts the server's field messages next to the fields they belong to and
	 * jumps to the first step that has one (Details wins over Build).
	 */
	const applyServerErrors: ApplyServerFieldErrors = (errors) => {
		if (!mapServerErrors || errors.length === 0) return;
		const mapped = mapServerErrors(errors, collectValues());

		mapped.details.forEach(({ name, message }) =>
			detailsForm.setError(name as never, { type: "server", message }),
		);
		mapped.build.forEach(({ name, message }) =>
			buildForm.setError(name as never, { type: "server", message }),
		);

		if (mapped.details.length > 0) setStep("details");
		else if (mapped.build.length > 0) setStep("build");
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleContinue = async () => {
		if (step === "details") {
			const isValid = await detailsForm.trigger(undefined, {
				shouldFocus: true,
			});
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

		const savedValues = await onSaveDraft(collectValues(), applyServerErrors);
		if (!savedValues) return;

		// Sync with server ids and clear the dirty flag.
		detailsForm.reset(savedValues.details);
		buildForm.reset({ sections: savedValues.sections });
	};

	const handlePublish = async () => {
		if (isBusy) return;
		const isValid = await validateReachedSteps({ requireBuild: true });
		if (!isValid) return;
		await onPublish(collectValues(), applyServerErrors);
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

	const isReviewStep = step === "review";
	// Wireframe: Details → Cancel · Build → Back · Review → Cancel + Back.
	const showCancel = step !== "build";
	const showBack = step !== "details";

	const footerContent = (
		<div className="flex w-full flex-wrap items-center justify-between gap-2">
			<div className="flex items-center gap-3">
				{showCancel ? (
					<Button
						text="Cancel"
						variant="outline"
						disabled={isBusy}
						onClick={handleCancel}
					/>
				) : null}
				{showBack ? (
					<Button
						text="Back"
						variant="outline"
						Icon={ArrowLeft}
						disabled={isBusy}
						onClick={handleBack}
					/>
				) : null}
				<span
					className="hidden text-xs text-(--color-text-secondary) sm:inline"
					aria-live="polite"
				>
					{isSaving
						? "Saving…"
						: isDirty
							? "Unsaved changes"
							: (lastSavedLabel ?? "")}
				</span>
			</div>

			<div className="flex items-center gap-2">
				{isReviewStep ? (
					<>
						<Button
							text="Save draft"
							variant="outline"
							Icon={Save}
							loading={isSaving}
							disabled={isBusy}
							onClick={() => void handleSaveDraft()}
						/>
						<Button
							text="Publish checklist"
							variant="brand"
							Icon={Check}
							iconPosition="right"
							loading={isPublishing}
							disabled={isBusy}
							onClick={() => void handlePublish()}
						/>
					</>
				) : (
					<Button
						text="Continue"
						variant="brand"
						Icon={ArrowRight}
						iconPosition="right"
						disabled={isBusy}
						onClick={() => void handleContinue()}
					/>
				)}
			</div>
		</div>
	);

	return (
		<div className="">
			{notice ? <div className="mb-4">{notice}</div> : null}
			<StepProgress
				className="mb-5"
				steps={AUDIT_TEMPLATE_PROGRESS_STEPS}
				currentStep={stepIndex + 1}
				ariaLabel="Template builder progress"
			/>

			{isReviewStep ? (
				// Wireframe: group cards and the summary sit on the page, and the
				// action bar is its own card underneath.
				<div className="space-y-4">
					<AuditTemplatePreview
						variant="review"
						values={collectValues()}
						detailFields={detailFields}
						parameterFields={parameterFields}
						layout={layout}
					/>
					<Card variant="outlined" padding="compact">
						{footerContent}
					</Card>
				</div>
			) : (
				<Card footer={footerContent}>
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
							layout={layout}
							disabled={isBusy}
							onUploadReferencePhoto={onUploadReferencePhoto}
							onSubmit={handleStepSubmit}
						/>
					) : null}
				</Card>
			)}

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
