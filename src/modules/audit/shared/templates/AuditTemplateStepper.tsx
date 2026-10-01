// modules/audit/shared/templates/AuditTemplateStepper.tsx
import { Check } from "lucide-react";

export type AuditTemplateBuilderStep = "details" | "build" | "review";

export const AUDIT_TEMPLATE_STEP_ORDER: readonly AuditTemplateBuilderStep[] = [
	"details",
	"build",
	"review",
];

const STEP_LABEL: Record<AuditTemplateBuilderStep, string> = {
	details: "Details",
	build: "Build checklist",
	review: "Review & publish",
};

type Props = {
	currentStep: AuditTemplateBuilderStep;
	/** Highest step the user has validly reached; later steps are locked. */
	furthestStepIndex: number;
	onStepSelect: (step: AuditTemplateBuilderStep) => void;
};

export default function AuditTemplateStepper({
	currentStep,
	furthestStepIndex,
	onStepSelect,
}: Props) {
	const currentIndex = AUDIT_TEMPLATE_STEP_ORDER.indexOf(currentStep);

	return (
		<nav aria-label="Template builder progress" className="mb-5">
			<ol className="flex items-center">
				{AUDIT_TEMPLATE_STEP_ORDER.map((step, index) => {
					const isCurrent = step === currentStep;
					const isComplete = index < currentIndex;
					const isReachable = index <= furthestStepIndex;

					return (
						<li key={step} className="flex flex-1 items-center last:flex-none">
							<button
								type="button"
								onClick={() => onStepSelect(step)}
								disabled={!isReachable || isCurrent}
								aria-current={isCurrent ? "step" : undefined}
								className={`flex items-center gap-2 text-sm font-semibold disabled:cursor-default ${
									isCurrent
										? "text-(--color-brand)"
										: isReachable
											? "text-(--color-text-primary)"
											: "text-(--color-text-secondary)"
								}`}
							>
								<span
									className={`grid size-7 place-items-center rounded-full border text-xs font-bold ${
										isCurrent
											? "border-(--color-brand) bg-(--color-brand) text-white"
											: isComplete
												? "border-(--color-success) bg-(--color-success) text-white"
												: "border-(--color-border-default) bg-(--color-bg-surface)"
									}`}
									aria-hidden="true"
								>
									{isComplete ? <Check size={14} /> : index + 1}
								</span>
								<span className={isCurrent ? "" : "hidden sm:inline"}>
									{STEP_LABEL[step]}
								</span>
							</button>
							{index < AUDIT_TEMPLATE_STEP_ORDER.length - 1 ? (
								<span
									className="mx-3 h-px flex-1 bg-(--color-border-default)"
									aria-hidden="true"
								/>
							) : null}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
