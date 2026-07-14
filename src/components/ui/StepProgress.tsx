import { Check } from "lucide-react";

type StepProgressStep = {
	id: number;
	label: string;
};

type StepProgressProps = {
	steps: StepProgressStep[];
	currentStep: number;
	className?: string;
	ariaLabel?: string;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

export function StepProgress({
	steps,
	currentStep,
	className = "",
	ariaLabel = "Progress",
}: StepProgressProps) {
	return (
		<nav
			className={joinClassNames("step-progress", className)}
			aria-label={ariaLabel}
		>
			<ol className="step-progress-list">
				{steps.map((step, index) => {
					const isDone = currentStep > step.id;
					const isActive = currentStep === step.id;
					const isLast = index === steps.length - 1;

					const stateClassName = isDone
						? "step-progress-item-done"
						: isActive
							? "step-progress-item-active"
							: "step-progress-item-wait";

					return (
						<li
							key={step.id}
							className={joinClassNames("step-progress-item", stateClassName)}
							aria-current={isActive ? "step" : undefined}
						>
							<div className="step-progress-step">
								<span className="step-progress-dot" aria-hidden="true">
									{isDone ? (
										<Check className="step-progress-check-icon" />
									) : (
										<span className="step-progress-number">{step.id}</span>
									)}
								</span>

								<span className="step-progress-label">{step.label}</span>
							</div>

							{!isLast ? <span className="step-progress-line" /> : null}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
