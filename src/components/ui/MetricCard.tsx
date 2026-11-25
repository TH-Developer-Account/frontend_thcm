// MetricCard — one important number (budget, claimed amount, financial
// impact, participant count) with its label and context.
//
// Display only. Pass values already calculated and formatted by the module;
// this component never computes business figures. A value that does not
// exist yet is shown as an explicit state ("Not yet calculated"), never as 0.
//
//   <MetricGrid>
//     <MetricCard label="Annual budget" value="₹ 48,00,000" />
//     <MetricCard
//       label="Available budget"
//       value="₹ 6,20,000"
//       progress={{ value: 41_80_000, max: 48_00_000, label: "87% used" }}
//     />
//     <MetricCard label="Financial impact" state="pending"
//       description="Formula awaiting business confirmation." />
//   </MetricGrid>
import type { ComponentType, ReactNode, SVGProps } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import {
	READ_ONLY_EMPTY_LABELS,
	ReadOnlyEmptyValue,
	type ReadOnlyEmptyReason,
} from "../forms/ReadOnlyField";

export type MetricTone = "default" | "brand" | "success" | "warning" | "danger";

export type MetricDelta = {
	/** Already formatted, e.g. "+4.2%" or "₹ 72,000". */
	value: string;
	direction: "up" | "down" | "flat";
	/**
	 * Whether this change is good news. A price going up is bad for a buyer,
	 * so direction alone can't decide the colour.
	 */
	intent?: "positive" | "negative" | "neutral";
	/** Context after the value, e.g. "vs last approval". */
	label?: string;
};

export type MetricProgress = {
	value: number;
	max: number;
	/** Text beside the bar, e.g. "87% of budget used". Shown and announced. */
	label?: string;
	/**
	 * Fractions where the bar turns amber / red. Default 0.9 / 1.0, so an
	 * overspent budget reads as an error without any extra wiring.
	 */
	warnAt?: number;
	dangerAt?: number;
};

type MetricCardProps = {
	label: string;
	value?: ReactNode;
	/** Unit or suffix shown smaller after the value, e.g. "participants". */
	unit?: string;
	/** One line of context under the value. */
	description?: ReactNode;
	tone?: MetricTone;
	delta?: MetricDelta;
	progress?: MetricProgress;
	Icon?: ComponentType<SVGProps<SVGSVGElement>>;
	/** When there is no value: loading skeleton or an explicit reason. */
	state?: ReadOnlyEmptyReason;
	/** Larger number for the one figure a page is about. */
	size?: "md" | "lg";
	className?: string;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const DELTA_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: ArrowRight };

const progressTone = (progress: MetricProgress): "ok" | "warn" | "danger" => {
	const ratio = progress.max > 0 ? progress.value / progress.max : 0;
	if (ratio > (progress.dangerAt ?? 1)) return "danger";
	if (ratio >= (progress.warnAt ?? 0.9)) return "warn";
	return "ok";
};

export function MetricCard({
	label,
	value,
	unit,
	description,
	tone = "default",
	delta,
	progress,
	Icon,
	state,
	size = "md",
	className,
}: MetricCardProps) {
	const hasValue =
		!state && value !== null && value !== undefined && value !== "";
	const emptyReason: ReadOnlyEmptyReason = state ?? "not-provided";

	const DeltaIcon = delta ? DELTA_ICON[delta.direction] : null;
	const barTone = progress ? progressTone(progress) : null;
	const barPercent = progress
		? Math.max(0, Math.min(100, (progress.value / Math.max(progress.max, 1)) * 100))
		: 0;

	return (
		<div
			className={joinClassNames(
				"metric-card",
				`metric-card-${tone}`,
				size === "lg" && "metric-card-lg",
				className,
			)}
			aria-busy={state === "loading" || undefined}
		>
			<div className="metric-card-head">
				<span className="metric-card-label">{label}</span>
				{Icon ? <Icon className="metric-card-icon" aria-hidden="true" /> : null}
			</div>

			<div className="metric-card-value-row">
				{hasValue ? (
					<>
						<span className="metric-card-value">{value}</span>
						{unit ? <span className="metric-card-unit">{unit}</span> : null}
					</>
				) : (
					<span className="metric-card-value metric-card-value-empty">
						<ReadOnlyEmptyValue reason={emptyReason}>
							{state === "loading" ? READ_ONLY_EMPTY_LABELS.loading : undefined}
						</ReadOnlyEmptyValue>
					</span>
				)}
			</div>

			{delta && hasValue && DeltaIcon ? (
				<p
					className={joinClassNames(
						"metric-card-delta",
						`metric-card-delta-${delta.intent ?? "neutral"}`,
					)}
				>
					<DeltaIcon aria-hidden="true" />
					<span className="metric-card-delta-value">{delta.value}</span>
					{delta.label ? (
						<span className="metric-card-delta-label">{delta.label}</span>
					) : null}
				</p>
			) : null}

			{progress && hasValue ? (
				<div className={joinClassNames("metric-card-progress", `is-${barTone}`)}>
					<div
						className="metric-card-progress-track"
						role="progressbar"
						aria-label={progress.label ?? label}
						aria-valuemin={0}
						aria-valuemax={progress.max}
						aria-valuenow={Math.min(progress.value, progress.max)}
						aria-valuetext={progress.label}
					>
						<span
							className="metric-card-progress-fill"
							style={{ width: `${barPercent}%` }}
						/>
					</div>
					{progress.label ? (
						<span className="metric-card-progress-label">{progress.label}</span>
					) : null}
				</div>
			) : null}

			{description ? <p className="metric-card-description">{description}</p> : null}
		</div>
	);
}

/** Responsive grid for MetricCards: 4 → 2 → 1 columns. */
export function MetricGrid({
	children,
	columns = 4,
	className,
	"aria-label": ariaLabel,
}: {
	children: ReactNode;
	columns?: 2 | 3 | 4;
	className?: string;
	"aria-label"?: string;
}) {
	return (
		<div
			className={joinClassNames("metric-grid", className)}
			style={{ ["--metric-grid-cols" as string]: columns }}
			role={ariaLabel ? "group" : undefined}
			aria-label={ariaLabel}
		>
			{children}
		</div>
	);
}

export default MetricCard;
