import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import Card from "../../../components/common/Card";
import {
	currencyFormatter,
	useReimbursementClaimFormContext,
} from "../hooks/useReimbursementClaimForm";

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type Tone = "ok" | "low" | "over";

const TONE_TEXT: Record<Tone, string> = {
	ok: "text-iron-dark",
	low: "text-amber-600",
	over: "text-red-600",
};

const Stat = ({
	label,
	value,
	className = "text-iron-dark",
}: {
	label: string;
	value: string;
	className?: string;
}) => (
	<div className="min-w-0">
		<dt className="truncate text-[11px] uppercase tracking-wide text-muted">
			{label}
		</dt>
		<dd
			className={`text-base font-semibold tabular-nums leading-tight ${className}`}
		>
			{value}
		</dd>
	</div>
);

const Legend = ({ swatch, label }: { swatch: string; label: string }) => (
	<span className="inline-flex items-center gap-1">
		<span
			aria-hidden="true"
			className={`inline-block size-2 rounded-full ${swatch}`}
		/>
		{label}
	</span>
);

type EligibilitySidePanelProps = {
	className?: string;
};

const PanelMessage = ({
	className,
	periodLabel,
	children,
}: {
	className?: string;
	periodLabel: string;
	children: string;
}) => (
	<aside className={className} aria-label="Eligibility">
		<Card
			title={
				<span className="text-base font-semibold text-iron-dark">
					Eligibility · {periodLabel}
				</span>
			}
		>
			<p className="flex items-start gap-2 px-4.5 pb-4 text-sm text-iron">
				<Info aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
				{children}
			</p>
		</Card>
	</aside>
);

/**
 * Sticky "Eligibility" panel shown next to the claim form:
 *   header  — Eligibility · period
 *   row     — [Total / Past claims / Remaining] | [pie]
 *   below   — this claim, approved amount for this claim, THCM-only, status.
 * Same numbers for
 * the claimant and THCM users; the "THCM only" row appears when the page
 * passes `eligibilityPendingAmount`. Indicative only — the server recomputes
 * eligibility on every submit.
 *
 * Borders use explicit slate-200 (a light grey) instead of the custom
 * `border-border` token, which was resolving to the default dark colour.
 */
export const EligibilitySidePanel = ({
	className,
}: EligibilitySidePanelProps) => {
	const {
		selectedGrade,
		resolvedEligibleAmount,
		settledAmount,
		lineItemsTotal,
		approvedTotal,
		eligibility,
		eligibilityPeriodLabel,
		pendingAmount,
		isReadOnly,
	} = useReimbursementClaimFormContext();

	const format = (amount: number) => currencyFormatter.format(amount);

	if (!selectedGrade) {
		return (
			<PanelMessage className={className} periodLabel={eligibilityPeriodLabel}>
				{isReadOnly
					? "No grade has been selected for this claim yet."
					: "Select a grade to see your eligibility and remaining balance."}
			</PanelMessage>
		);
	}

	if (resolvedEligibleAmount === null) {
		return (
			<PanelMessage className={className} periodLabel={eligibilityPeriodLabel}>
				{`The annual limit for grade ${selectedGrade.label} isn't configured yet. HR will confirm your eligibility while reviewing the claim.`}
			</PanelMessage>
		);
	}

	const hasClaim = lineItemsTotal > 0;
	const tone: Tone = eligibility.isOverLimit
		? "over"
		: hasClaim && eligibility.balanceAfter < eligibility.remaining * 0.25
			? "low"
			: "ok";

	const settledArc = (eligibility.percentSettled / 100) * RING_CIRCUMFERENCE;
	const claimArc = (eligibility.percentThisClaim / 100) * RING_CIRCUMFERENCE;
	const usedPercent = Math.min(
		Math.round(eligibility.percentSettled + eligibility.percentThisClaim),
		100,
	);

	return (
		<aside className={className} aria-label="Eligibility">
			<div className="h-full overflow-hidden rounded-lg border border-slate-200 bg-white">
				{/* Header */}
				<div className="border-b border-slate-200 px-5 py-3.5">
					<div className="flex items-center justify-between gap-3">
						<h3 className="text-sm font-semibold text-iron-dark">
							Eligibility
						</h3>

						<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
							{eligibilityPeriodLabel}
						</span>
					</div>
				</div>

				<div className="p-5">
					{/* Main summary */}
					<div className="grid grid-cols-[1fr_auto] items-center gap-5">
						<dl className="space-y-3">
							<Stat
								label={`Annual limit · ${selectedGrade.label}`}
								value={format(resolvedEligibleAmount)}
							/>

							<Stat label="Past claims" value={format(settledAmount)} />

							<Stat
								label="Available before this claim"
								value={format(eligibility.remaining)}
								className={TONE_TEXT[tone]}
							/>
						</dl>

						<svg
							className="shrink-0"
							width="104"
							height="104"
							viewBox="0 0 120 120"
							role="img"
							aria-label={`${usedPercent}% of the eligibility is used or claimed`}
						>
							<circle
								cx="60"
								cy="60"
								r={RING_RADIUS}
								fill="none"
								strokeWidth="12"
								className="stroke-zinc-200"
							/>

							<circle
								cx="60"
								cy="60"
								r={RING_RADIUS}
								fill="none"
								strokeWidth="12"
								className="stroke-slate-700"
								strokeDasharray={`${settledArc} ${RING_CIRCUMFERENCE}`}
								transform="rotate(-90 60 60)"
							/>

							<circle
								cx="60"
								cy="60"
								r={RING_RADIUS}
								fill="none"
								strokeWidth="12"
								className={
									eligibility.isOverLimit
										? "stroke-red-500"
										: "stroke-orange-500"
								}
								strokeDasharray={`${claimArc} ${RING_CIRCUMFERENCE}`}
								strokeDashoffset={-settledArc}
								transform="rotate(-90 60 60)"
							/>

							<text
								x="60"
								y="57"
								textAnchor="middle"
								fontSize="18"
								fontWeight="700"
								className="fill-current text-iron-dark"
							>
								{usedPercent}%
							</text>

							<text
								x="60"
								y="73"
								textAnchor="middle"
								fontSize="9"
								className="fill-current text-muted"
							>
								used
							</text>
						</svg>
					</div>

					{/* Legend */}
					<div className="mt-4 flex flex-wrap gap-4 border-b border-slate-200 pb-4 text-xs text-iron">
						<Legend swatch="bg-slate-700" label="Past claims" />
						<Legend
							swatch={eligibility.isOverLimit ? "bg-red-500" : "bg-orange-500"}
							label="This claim"
						/>
					</div>

					{/* Current claim */}
					<div className="py-4">
						<div className="flex items-end justify-between gap-4">
							<div>
								<p className="text-xs text-muted">Current claim</p>
								<p className="mt-1 text-lg font-semibold tabular-nums text-iron-dark">
									{format(lineItemsTotal)}
								</p>
							</div>

							{approvedTotal > 0 ? (
								<div className="text-right">
									<p className="text-xs text-muted">Approved</p>
									<p className="mt-1 text-sm font-semibold tabular-nums text-emerald-700">
										{format(approvedTotal)}
									</p>
								</div>
							) : null}
						</div>
					</div>

					{pendingAmount !== undefined ? (
						<div className="mb-3 rounded-md bg-blue-50 px-3 py-2.5">
							<div className="flex items-center justify-between gap-3">
								<span className="text-xs font-medium text-blue-700">
									Pending in other claims
								</span>

								<span className="text-sm font-semibold tabular-nums text-blue-800">
									{format(pendingAmount)}
								</span>
							</div>
						</div>
					) : null}

					{/* Balance warning */}
					<div
						role="status"
						aria-live="polite"
						className={`flex items-start gap-2 rounded-md px-3 py-2.5 text-xs ${
							tone === "over"
								? "bg-red-50 text-red-700"
								: tone === "low"
									? "bg-amber-50 text-amber-700"
									: "bg-emerald-50 text-emerald-700"
						}`}
					>
						{tone === "ok" ? (
							<CheckCircle2
								aria-hidden="true"
								className="mt-0.5 shrink-0"
								size={15}
							/>
						) : (
							<AlertTriangle
								aria-hidden="true"
								className="mt-0.5 shrink-0"
								size={15}
							/>
						)}

						<span>
							{tone === "over"
								? `This claim exceeds the remaining eligibility by ${format(
										-eligibility.balanceAfter,
									)}.`
								: tone === "low"
									? `Only ${format(
											eligibility.balanceAfter,
										)} will remain after this claim.`
									: hasClaim
										? `${format(
												eligibility.balanceAfter,
											)} will remain after this claim.`
										: "Add bills to see how this claim affects the balance."}
						</span>
					</div>
				</div>
			</div>
		</aside>
	);
};

export default EligibilitySidePanel;
