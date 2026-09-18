// modules/audit/shared/AuditTemplateBuilder.tsx
import { useState } from "react";
import { Check } from "lucide-react";
import Button from "../../../../components/common/Button";
import AuditTemplateDetailsStep, {
	type AuditTemplateDetailsValues,
} from "./AuditTemplateDetailsStep";
import AuditTemplateBuildStep from "./AuditTemplateBuildStep";
import AuditTemplateReviewStep from "./AuditTemplateReviewStep";
import type { AuditModuleKey, ChecklistSection } from "../shared.audit.types";

type BuilderStep = "details" | "build" | "review";
const STEP_ORDER: BuilderStep[] = ["details", "build", "review"];
const STEP_LABEL: Record<BuilderStep, string> = {
	details: "Details",
	build: "Build checklist",
	review: "Review & publish",
};

export interface AuditTemplateBuilderProps {
	auditModule: AuditModuleKey;
	facilityTypeOptions: Array<{ value: string; label: string }>;
	initialDetails?: AuditTemplateDetailsValues;
	initialSections?: ChecklistSection[];
	isSaving?: boolean;
	onSaveDraft: (
		details: AuditTemplateDetailsValues,
		sections: ChecklistSection[],
	) => void;
	onPublish: (
		details: AuditTemplateDetailsValues,
		sections: ChecklistSection[],
	) => void;
}

const EMPTY_DETAILS: AuditTemplateDetailsValues = {
	name: "",
	description: "",
	facilityType: undefined,
};

export default function AuditTemplateBuilder({
	auditModule,
	facilityTypeOptions,
	initialDetails = EMPTY_DETAILS,
	initialSections,
	isSaving = false,
	onSaveDraft,
	onPublish,
}: AuditTemplateBuilderProps) {
	const [step, setStep] = useState<BuilderStep>("details");
	const [details, setDetails] = useState(initialDetails);
	const [sections, setSections] = useState<ChecklistSection[]>(
		initialSections ?? [],
	);

	const stepIndex = STEP_ORDER.indexOf(step);
	const goNext = () =>
		setStep(STEP_ORDER[Math.min(stepIndex + 1, STEP_ORDER.length - 1)]);
	const goPrevious = () => setStep(STEP_ORDER[Math.max(stepIndex - 1, 0)]);

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<nav
					aria-label="Checklist builder progress"
					className="flex flex-1 items-center"
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

				<div className="ml-4 flex gap-2">
					<Button
						text="Save draft"
						variant="outline"
						disabled={isSaving}
						onClick={() => onSaveDraft(details, sections)}
					/>
					{step === "review" ? (
						<Button
							text="Publish checklist"
							variant="brand"
							Icon={Check}
							loading={isSaving}
							onClick={() => onPublish(details, sections)}
						/>
					) : (
						<Button text="Continue" variant="brand" onClick={goNext} />
					)}
				</div>
			</div>

			{step === "details" ? (
				<AuditTemplateDetailsStep
					values={details}
					onChange={setDetails}
					facilityTypeOptions={facilityTypeOptions}
					auditModule={auditModule}
				/>
			) : null}

			{step === "build" ? (
				<AuditTemplateBuildStep sections={sections} onChange={setSections} />
			) : null}

			{step === "review" ? (
				<AuditTemplateReviewStep details={details} sections={sections} />
			) : null}

			<div className="mt-6 flex justify-between sm:hidden">
				<Button
					text="Back"
					variant="outline"
					disabled={stepIndex === 0}
					onClick={goPrevious}
				/>
				{step === "review" ? (
					<Button
						text="Publish"
						variant="brand"
						onClick={() => onPublish(details, sections)}
					/>
				) : (
					<Button text="Continue" variant="brand" onClick={goNext} />
				)}
			</div>
		</div>
	);
}
