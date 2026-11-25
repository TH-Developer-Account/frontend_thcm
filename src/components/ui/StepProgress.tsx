// StepProgress — where the user is in a multi-step form.
//
// By default, steps before `currentStep` show as complete and steps after it
// as upcoming (the original behaviour). A consumer that knows more about the
// form, such as a step with validation errors or one that was skipped,
// passes `status` on that step. The component never invents completion on
// its own: "complete" only ever comes from position or from the consumer.
//
// All props added in the design-system revamp are optional.
import type { ReactNode } from "react";
import { AlertCircle, Check, Minus } from "lucide-react";

export type StepStatus =
	| "upcoming"
	| "current"
	| "complete"
	| "invalid"
	| "skipped"
	| "disabled";

export type StepProgressStep = {
	id: number;
	label: string;
	/** One line under the summary when this step is current. */
	description?: string;
	/** Overrides the status worked out from `currentStep`. */
	status?: StepStatus;
};

type StepProgressProps = {
	steps: readonly StepProgressStep[];
	currentStep: number;
	className?: string;
	ariaLabel?: string;
	/**
	 * Shows "Step 2 of 5 · Purchasing details" (and the current step's
	 * description) above the track. On phones, where the other step labels are
	 * hidden, the summary always shows.
	 */
	showSummary?: boolean;
	/**
	 * Makes steps the user may go back to clickable. By default these are
	 * complete, invalid and skipped steps; pass `isStepClickable` to change that.
	 */
	onStepClick?: (stepId: number) => void;
	isStepClickable?: (step: StepProgressStep, status: StepStatus) => boolean;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

/** Classes from before the revamp, kept so module overrides still match. */
const LEGACY_CLASS: Record<StepStatus, string> = {
	upcoming: "step-progress-item-wait",
	current: "step-progress-item-active",
	complete: "step-progress-item-done",
	invalid: "step-progress-item-wait",
	skipped: "step-progress-item-wait",
	disabled: "step-progress-item-wait",
};

const STATUS_TEXT: Record<StepStatus, string> = {
	upcoming: "not started",
	current: "current step",
	complete: "completed",
	invalid: "needs attention",
	skipped: "skipped",
	disabled: "not available",
};

const resolveStatus = (
	step: StepProgressStep,
	currentStep: number,
): StepStatus => {
	if (step.status) return step.status;
	if (step.id === currentStep) return "current";
	return step.id < currentStep ? "complete" : "upcoming";
};

const defaultClickable = (_: StepProgressStep, status: StepStatus) =>
	status === "complete" || status === "invalid" || status === "skipped";

const StepMarker = ({ status, number }: { status: StepStatus; number: number }) => {
	let content: ReactNode = <span className="step-progress-number">{number}</span>;

	if (status === "complete") {
		content = <Check className="step-progress-check-icon" />;
	} else if (status === "invalid") {
		content = <AlertCircle className="step-progress-check-icon" />;
	} else if (status === "skipped") {
		content = <Minus className="step-progress-check-icon" />;
	}

	return (
		<span className="step-progress-dot" aria-hidden="true">
			{content}
		</span>
	);
};

export function StepProgress({
	steps,
	currentStep,
	className = "",
	ariaLabel = "Progress",
	showSummary = false,
	onStepClick,
	isStepClickable = defaultClickable,
}: StepProgressProps) {
	const resolved = steps.map((step) => ({
		step,
		status: resolveStatus(step, currentStep),
	}));

	const currentIndex = steps.findIndex((step) => step.id === currentStep);
	const current = currentIndex >= 0 ? steps[currentIndex] : undefined;
	const invalidCount = resolved.filter((entry) => entry.status === "invalid").length;

	return (
		<nav
			className={joinClassNames(
				"step-progress",
				onStepClick && "step-progress-interactive",
				className,
			)}
			aria-label={ariaLabel}
		>
			{current ? (
				<div
					className={joinClassNames(
						"step-progress-summary",
						!showSummary && "step-progress-summary-mobile",
					)}
				>
					<p className="step-progress-summary-line">
						<span className="step-progress-summary-count">
							Step {currentIndex + 1} of {steps.length}
						</span>
						<span className="step-progress-summary-title">{current.label}</span>
						{invalidCount > 0 ? (
							<span className="step-progress-summary-alert">
								<AlertCircle aria-hidden="true" />
								{invalidCount === 1
									? "1 step needs attention"
									: `${invalidCount} steps need attention`}
							</span>
						) : null}
					</p>
					{current.description ? (
						<p className="step-progress-summary-description">
							{current.description}
						</p>
					) : null}
				</div>
			) : null}

			<ol className="step-progress-list">
				{resolved.map(({ step, status }, index) => {
					const isCurrent = step.id === currentStep;
					const isLast = index === resolved.length - 1;
					const clickable =
						Boolean(onStepClick) && !isCurrent && isStepClickable(step, status);

					const body = (
						<>
							<StepMarker status={status} number={index + 1} />
							<span className="step-progress-label">
								{step.label}
								<span className="sr-only">, {STATUS_TEXT[status]}</span>
							</span>
						</>
					);

					return (
						<li
							key={step.id}
							className={joinClassNames(
								"step-progress-item",
								`step-progress-item-${status}`,
								LEGACY_CLASS[status],
								isCurrent && status !== "current" && "step-progress-item-current",
							)}
							aria-current={isCurrent ? "step" : undefined}
						>
							{clickable ? (
								<button
									type="button"
									className="step-progress-step step-progress-step-button"
									onClick={() => onStepClick?.(step.id)}
								>
									{body}
								</button>
							) : (
								<div className="step-progress-step">{body}</div>
							)}

							{!isLast ? <span className="step-progress-line" aria-hidden="true" /> : null}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}

export default StepProgress;
