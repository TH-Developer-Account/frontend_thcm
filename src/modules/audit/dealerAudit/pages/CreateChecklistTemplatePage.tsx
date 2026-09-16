import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, ChevronLeft } from "lucide-react";

import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { PageHeader } from "../../../../components/ui/PageHeader";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";

import type {
	ChecklistTemplateFormValues,
	ChecklistTemplateSection,
} from "../dealer-audit.types";
import {
	createEmptySection,
	mapTemplateToFormValues,
} from "../dealer-audit.utils";
import { getMockChecklistTemplateById } from "../checklist-library.constants";
import ChecklistTemplateDetailsStep from "../components/ChecklistTemplateDetailsStep";
import ChecklistTemplateBuildStep from "../components/ChecklistTemplateBuildStep";
import ChecklistTemplateReviewStep from "../components/ChecklistTemplateReviewStep";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";

type BuilderStep = "details" | "build" | "review";

const STEP_ORDER: BuilderStep[] = ["details", "build", "review"];
const STEP_LABEL: Record<BuilderStep, string> = {
	details: "Details",
	build: "Build checklist",
	review: "Review & publish",
};

const EMPTY_DETAILS: ChecklistTemplateFormValues = {
	name: "",
	description: "",
	auditCategory: "Dealer audit",
	facilityType: undefined,
	sections: [],
};

type LoadState = "idle" | "loading" | "loaded" | "not-found";

export default function CreateChecklistTemplatePage() {
	const navigate = useNavigate();
	const { templateId } = useParams<{ templateId: string }>();
	const isEditMode = Boolean(templateId);

	const [step, setStep] = useState<BuilderStep>("details");
	const [details, setDetails] = useState(EMPTY_DETAILS);
	const [sections, setSections] = useState<ChecklistTemplateSection[]>([
		createEmptySection(0),
	]);
	const [loadState, setLoadState] = useState<LoadState>(
		isEditMode ? "loading" : "idle",
	);

	// Load existing template into form/section state when editing.
	// TODO (Day 8-9): replace the mock lookup with
	// dealerAuditTemplateApi.getTemplate(templateId) via TanStack Query,
	// and drop this effect in favor of query-driven initial state.
	useEffect(() => {
		if (!templateId) {
			setLoadState("idle");
			return;
		}

		setLoadState("loading");
		const template = getMockChecklistTemplateById(templateId);

		if (!template) {
			setLoadState("not-found");
			return;
		}

		const formValues = mapTemplateToFormValues(template);
		setDetails(formValues);
		setSections(formValues.sections);
		setLoadState("loaded");
	}, [templateId]);

	const stepIndex = STEP_ORDER.indexOf(step);

	const goBackToLibrary = () => navigate(DEALER_AUDIT_ROUTES.template.list);

	const goNext = () => {
		const nextIndex = stepIndex + 1;
		if (nextIndex < STEP_ORDER.length) setStep(STEP_ORDER[nextIndex]);
	};

	const goPrevious = () => {
		const prevIndex = stepIndex - 1;
		if (prevIndex >= 0) setStep(STEP_ORDER[prevIndex]);
	};

	const handlePublish = () => {
		if (isEditMode && templateId) {
			// TODO (Day 8-9): dealerAuditTemplateApi.updateTemplate(templateId, {...details, sections})
		} else {
			// TODO (Day 8-9): dealerAuditTemplateApi.createTemplate({...details, sections})
		}
		goBackToLibrary();
	};

	const handleSaveDraft = () => {
		// TODO (Day 8-9): save with status: "draft"
		goBackToLibrary();
	};

	if (isEditMode && loadState === "loading") {
		return (
			<PageSectionLayout className="dealer-audit-page">
				<Card variant="outlined" padding="default" className="text-center">
					<p className="text-sm text-slate-500">Loading checklist template…</p>
				</Card>
			</PageSectionLayout>
		);
	}

	if (isEditMode && loadState === "not-found") {
		return (
			<PageSectionLayout className="dealer-audit-page">
				<Card variant="outlined" padding="default" className="text-center">
					<h2 className="text-base font-semibold text-slate-900">
						Checklist template not found
					</h2>
					<p className="mt-1 text-sm text-slate-500">
						It may have been removed or the link is outdated.
					</p>
					<Button
						text="Back to checklist library"
						variant="brand"
						className="mt-4"
						onClick={goBackToLibrary}
					/>
				</Card>
			</PageSectionLayout>
		);
	}

	return (
		<PageSectionLayout className="dealer-audit-page">
			<PageHeader>
				<div className="flex items-center gap-3">
					<Button
						appearance="icon"
						variant="secondary"
						Icon={ChevronLeft}
						aria-label="Back to checklist library"
						onClick={goBackToLibrary}
					/>
					<div>
						<span className="text-eyebrow text-(--color-brand)">
							{isEditMode ? "Edit template" : "New template"}
						</span>
						<h1 className="text-page-title text-(--color-text-primary)">
							{isEditMode ? "Edit checklist" : "Create checklist"}
						</h1>
					</div>
					<div className="ml-auto flex gap-2">
						<Button
							text="Save draft"
							variant="outline"
							onClick={handleSaveDraft}
						/>
						{step === "review" ? (
							<Button
								text="Publish checklist"
								variant="brand"
								Icon={Check}
								onClick={handlePublish}
							/>
						) : (
							<Button text="Continue" variant="brand" onClick={goNext} />
						)}
					</div>
				</div>
			</PageHeader>

			<nav
				aria-label="Checklist builder progress"
				className="mb-6 flex items-center"
			>
				{STEP_ORDER.map((s, index) => (
					<div key={s} className="flex flex-1 items-center last:flex-none">
						<button
							type="button"
							onClick={() => index <= stepIndex && setStep(s)}
							disabled={index > stepIndex}
							className={`flex items-center gap-2 text-sm font-semibold ${
								s === step
									? "text-(--color-brand)"
									: index < stepIndex
										? "text-slate-700"
										: "text-slate-400"
							}`}
						>
							<span
								className={`grid size-7 place-items-center rounded-full border text-xs font-bold ${
									s === step
										? "border-(--color-brand) bg-(--color-brand) text-white"
										: index < stepIndex
											? "border-slate-300 bg-white text-slate-700"
											: "border-slate-200 bg-white text-slate-400"
								}`}
							>
								{index + 1}
							</span>
							{STEP_LABEL[s]}
						</button>
						{index < STEP_ORDER.length - 1 ? (
							<span className="mx-3 h-px flex-1 bg-slate-200" />
						) : null}
					</div>
				))}
			</nav>

			{step === "details" ? (
				<ChecklistTemplateDetailsStep values={details} onChange={setDetails} />
			) : null}

			{step === "build" ? (
				<ChecklistTemplateBuildStep
					sections={sections}
					onChange={setSections}
				/>
			) : null}

			{step === "review" ? (
				<ChecklistTemplateReviewStep details={details} sections={sections} />
			) : null}

			<div className="mt-6 flex justify-between sm:hidden">
				<Button
					text="Back"
					variant="outline"
					disabled={stepIndex === 0}
					onClick={goPrevious}
				/>
				{step === "review" ? (
					<Button text="Publish" variant="brand" onClick={handlePublish} />
				) : (
					<Button text="Continue" variant="brand" onClick={goNext} />
				)}
			</div>
		</PageSectionLayout>
	);
}
