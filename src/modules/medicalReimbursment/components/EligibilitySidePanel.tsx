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

const Row = ({ label, value }: { label: string; value: string }) => (
	<div className="flex items-center justify-between gap-3 border-b border-dashed border-border py-1.5 text-sm last:border-b-0">
		<span className="text-iron">{label}</span>
		<span className="font-semibold tabular-nums text-iron-dark">{value}</span>
	</div>
);

type EligibilitySidePanelProps = {
	className?: string;
};

/**
 * Sticky "Eligibility" panel shown next to the claim form.
 * Same numbers for guest (public token page) and THCM users; THCM-only rows
 * appear when the page passes `eligibilityPendingAmount` to the form.
 */
export const EligibilitySidePanel = ({
	className,
}: EligibilitySidePanelProps) => {
	const {
		selectedGrade,
		resolvedEligibleAmount,
		settledAmount,
		lineItemsTotal,
		eligibility,
		eligibilityPeriodLabel,
		pendingAmount,
	} = useReimbursementClaimFormContext();

	const format = (amount: number) => currencyFormatter.format(amount);

	if (!selectedGrade) {
		return (
			<aside className={className} aria-label="Eligibility">
				<Card
					title={
						<span className="text-base font-semibold text-iron-dark">
							Eligibility · {eligibilityPeriodLabel}
						</span>
					}
				>
					<p className="flex items-start gap-2 px-4.5 pb-4 text-sm text-iron">
						<Info aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
						Select a grade to see your eligibility and remaining balance.
					</p>
				</Card>
			</aside>
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
	const headline = hasClaim ? eligibility.balanceAfter : eligibility.remaining;

	return (
		<aside className={className} aria-label="Eligibility">
			<Card
				title={
					<span className="text-base font-semibold text-iron-dark">
						Eligibility · {eligibilityPeriodLabel}
					</span>
				}
			>
				<div className="flex flex-col gap-1 px-4.5 pb-4">
					<p className="text-xs uppercase tracking-wide text-muted">
						{hasClaim ? "Remaining after this claim" : "Remaining this year"}
					</p>
					<p
						className={`text-3xl font-bold tabular-nums leading-tight ${TONE_TEXT[tone]}`}
					>
						{format(headline)}
					</p>
					{hasClaim ? (
						<p className="text-xs text-iron">
							was {format(eligibility.remaining)} before this claim
						</p>
					) : null}

					<svg
						className="mx-auto my-2 hidden lg:block"
						width="120"
						height="120"
						viewBox="0 0 120 120"
						role="img"
						aria-label={`${usedPercent}% of your eligibility is used or claimed`}
					>
						<circle
							cx="60"
							cy="60"
							r={RING_RADIUS}
							fill="none"
							strokeWidth="14"
							className="stroke-zinc-200"
						/>
						<circle
							cx="60"
							cy="60"
							r={RING_RADIUS}
							fill="none"
							strokeWidth="14"
							className="stroke-slate-700"
							strokeDasharray={`${settledArc} ${RING_CIRCUMFERENCE}`}
							transform="rotate(-90 60 60)"
						/>
						<circle
							cx="60"
							cy="60"
							r={RING_RADIUS}
							fill="none"
							strokeWidth="14"
							className={
								eligibility.isOverLimit ? "stroke-red-500" : "stroke-amber-400"
							}
							strokeDasharray={`${claimArc} ${RING_CIRCUMFERENCE}`}
							strokeDashoffset={-settledArc}
							transform="rotate(-90 60 60)"
						/>
						<text
							x="60"
							y="58"
							textAnchor="middle"
							fontSize="18"
							fontWeight="700"
							className="fill-current text-iron-dark"
						>
							{usedPercent}%
						</text>
						<text
							x="60"
							y="74"
							textAnchor="middle"
							fontSize="10"
							className="fill-current text-muted"
						>
							used
						</text>
					</svg>

					<div className="mt-1">
						<Row
							label={`Total eligibility (${selectedGrade.label})`}
							value={format(resolvedEligibleAmount)}
						/>
						<Row label="Settled this year" value={format(settledAmount)} />
						<Row label="Remaining" value={format(eligibility.remaining)} />
						<Row label="This claim" value={format(lineItemsTotal)} />
					</div>

					{pendingAmount !== undefined ? (
						<div className="mt-2 border-l-2 border-blue-600 pl-3">
							<p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">
								THCM only
							</p>
							<Row
								label="Pending in other claims"
								value={format(pendingAmount)}
							/>
						</div>
					) : null}

					<div
						role="status"
						aria-live="polite"
						className={`mt-3 flex items-start gap-2 rounded-md p-2.5 text-xs ${
							tone === "over"
								? "bg-red-50 text-red-700"
								: tone === "low"
									? "bg-amber-50 text-amber-700"
									: "bg-emerald-50 text-emerald-700"
						}`}
					>
						{tone === "ok" ? (
							<CheckCircle2 aria-hidden="true" className="shrink-0" size={16} />
						) : (
							<AlertTriangle
								aria-hidden="true"
								className="shrink-0"
								size={16}
							/>
						)}
						<span>
							{tone === "over"
								? `This claim is ${format(-eligibility.balanceAfter)} above your remaining eligibility.`
								: tone === "low"
									? `Only ${format(eligibility.balanceAfter)} will be left after this claim.`
									: hasClaim
										? `${format(eligibility.balanceAfter)} will be left after this claim.`
										: "Add bills to see how this claim affects your balance."}
						</span>
					</div>
				</div>
			</Card>
		</aside>
	);
};

export default EligibilitySidePanel;
