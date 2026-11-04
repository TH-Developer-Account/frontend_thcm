import { useId } from "react";

import Card from "../common/Card";

export type NextStep = {
	title: string;
	description: string;
};

type NextStepsPanelProps = {
	steps: readonly NextStep[];
	/** Panel heading. Defaults to "What happens next". */
	title?: string;
	className?: string;
};

/**
 * Numbered "What happens next" side panel, shared by the initiation forms
 * (Vendor, Medical Claim, ...). Pass the module's own steps.
 */
const NextStepsPanel = ({
	steps,
	title = "What happens next",
	className,
}: NextStepsPanelProps) => {
	const titleId = useId();

	return (
		<aside className={className} aria-labelledby={titleId}>
			<Card
				title={
					<h3 id={titleId} className="text-base font-semibold text-iron-dark">
						{title}
					</h3>
				}
			>
				<ol className="flex flex-col gap-4 px-4.5 pb-4">
					{steps.map((step, index) => (
						<li key={step.title} className="flex gap-3.5">
							<span
								aria-hidden="true"
								className="flex size-8 shrink-0 items-center justify-center rounded-full border border-brand text-sm font-semibold text-brand"
							>
								{index + 1}
							</span>
							<div>
								<p className="text-sm font-medium text-iron-dark">
									{step.title}
								</p>
								<p className="mt-0.5 text-sm text-iron">{step.description}</p>
							</div>
						</li>
					))}
				</ol>
			</Card>
		</aside>
	);
};

export default NextStepsPanel;
