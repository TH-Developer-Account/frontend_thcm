import { useState, type ReactNode } from "react";
import {
	AlertTriangle,
	BedDouble,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	ChevronsDown,
	ChevronsUp,
	Hourglass,
	Info,
	Stethoscope,
	type LucideIcon,
} from "lucide-react";

import Card from "../../../components/common/Card";
import {
	currencyFormatter,
	resolveApprovedAmount,
	useReimbursementClaimFormContext,
} from "../hooks/useReimbursementClaimForm";
import { HOSPITALISATION_CLAIM_HEAD } from "../utils/claimHead.constants";

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type Tone = "ok" | "low" | "over";

const TONE_TEXT: Record<Tone, string> = {
	ok: "text-iron-dark",
	low: "text-amber-600",
	over: "text-red-600",
};

const TONE_NOTE: Record<Tone, string> = {
	ok: "bg-emerald-50 text-emerald-700",
	low: "bg-amber-50 text-amber-700",
	over: "bg-red-50 text-red-700",
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
		<dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
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

const Row = ({
	label,
	value,
	className = "text-iron-dark",
}: {
	label: string;
	value: string;
	className?: string;
}) => (
	<div className="flex items-center justify-between gap-3 text-xs">
		<span className="text-muted">{label}</span>
		<span className={`font-semibold tabular-nums ${className}`}>{value}</span>
	</div>
);

/** Green / amber / red balance note shown at the bottom of each panel. */
const StatusNote = ({
	tone,
	className = "",
	children,
}: {
	tone: Tone;
	className?: string;
	children: ReactNode;
}) => (
	<div
		role="status"
		aria-live="polite"
		className={`flex items-start gap-2 rounded-md px-3 py-2.5 text-xs ${TONE_NOTE[tone]} ${className}`}
	>
		{tone === "ok" ? (
			<CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
		) : (
			<AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
		)}
		<span>{children}</span>
	</div>
);

/** Small "₹X available" summary shown in each panel header. */
const AvailableBadge = ({ value, tone }: { value: string; tone: Tone }) => (
	<span className={`text-xs font-semibold tabular-nums ${TONE_TEXT[tone]}`}>
		{value} available
	</span>
);

/**
 * One collapsible limit panel. The header is the toggle; the body is only
 * rendered while open. Panels sit side by side, so the body is a flex column
 * that fills the panel and lets the status note stick to the bottom.
 */
const PanelShell = ({
	id,
	title,
	Icon,
	badge,
	summary,
	open,
	onToggle,
	children,
}: {
	id: string;
	title: string;
	Icon: LucideIcon;
	badge?: ReactNode;
	summary: ReactNode;
	open: boolean;
	onToggle: () => void;
	children: ReactNode;
}) => (
	<section aria-labelledby={`${id}-title`} className="flex min-w-0 flex-col">
		<button
			type="button"
			aria-expanded={open}
			aria-controls={`${id}-body`}
			onClick={onToggle}
			className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400"
		>
			<span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-orange-600">
				<span
					aria-hidden="true"
					className="h-4 w-1 shrink-0 rounded-full bg-orange-500"
				/>
				<Icon aria-hidden="true" className="shrink-0" size={18} />
				<span id={`${id}-title`} className="truncate">
					{title}
				</span>
				{badge}
			</span>

			<span className="flex shrink-0 items-center gap-2 text-iron-dark">
				{summary}
				{open ? (
					<ChevronUp aria-hidden="true" className="text-orange-600" size={16} />
				) : (
					<ChevronDown
						aria-hidden="true"
						className="text-orange-600"
						size={16}
					/>
				)}
			</span>
		</button>

		{open ? (
			<div
				id={`${id}-body`}
				className="flex flex-1 flex-col gap-4 border-t border-slate-200 p-5"
			>
				{children}
			</div>
		) : null}
	</section>
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
 * "Eligibility" block shown above the Claim Heads table. One card, two
 * collapsible panels side by side (stacked on small screens), because the two
 * limits are tracked separately:
 *
 *   1. Non-hospitalisation limit — annual limit, past claims, on hold,
 *      available, this claim (every bill except hospitalisation).
 *   2. Hospitalisation limit — EG grades only; its own limit, past claims,
 *      on hold, available and this claim. Non-EG grades see panel 1 only,
 *      full width.
 *
 * "On hold" is money tied up in the retiree's other submitted-but-unsettled
 * claims; it is already subtracted from "Available before this claim", so a
 * second claim can't spend it. It is released if that claim is rejected and
 * moves into "Past claims" once it is approved. Indicative only — the server
 * re-checks every limit on submit.
 */
export const EligibilitySidePanel = ({
	className,
}: EligibilitySidePanelProps) => {
	const {
		selectedGrade,
		resolvedEligibleAmount,
		settledAmount,
		standardTotal,
		savedClaims,
		eligibility,
		eligibilityPeriodLabel,
		heldAmount,
		hospitalisation,
		isReadOnly,
	} = useReimbursementClaimFormContext();

	const [standardOpen, setStandardOpen] = useState(true);
	const [hospitalisationOpen, setHospitalisationOpen] = useState(true);

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

	/* ------------------------- approved, per bucket ------------------------- */
	const approvedOf = (isHospitalisation: boolean) =>
		savedClaims
			.filter(
				(item) =>
					item.approvalStatus === "APPROVED" &&
					(item.claimHead === HOSPITALISATION_CLAIM_HEAD) === isHospitalisation,
			)
			.reduce(
				(sum, item) => sum + (Number(resolveApprovedAmount(item)) || 0),
				0,
			);
	const approvedStandard = approvedOf(false);
	const approvedHospitalisation = approvedOf(true);

	/* --------------------------- non-hospitalisation ------------------------- */
	const hasClaim = standardTotal > 0;
	const hasHold = heldAmount > 0;
	const tone: Tone = eligibility.isOverLimit
		? "over"
		: hasClaim && eligibility.balanceAfter < eligibility.remaining * 0.25
			? "low"
			: "ok";

	const settledArc = (eligibility.percentSettled / 100) * RING_CIRCUMFERENCE;
	const heldArc = (eligibility.percentHeld / 100) * RING_CIRCUMFERENCE;
	const claimArc = (eligibility.percentThisClaim / 100) * RING_CIRCUMFERENCE;
	const usedPercent = Math.min(
		Math.round(
			eligibility.percentSettled +
				eligibility.percentHeld +
				eligibility.percentThisClaim,
		),
		100,
	);

	const nonHospitalisationBody = (
		<>
			<div className="grid grid-cols-[1fr_auto] items-center gap-5">
				<dl className="space-y-3">
					<Stat
						label={`Annual limit · ${selectedGrade.label}`}
						value={format(resolvedEligibleAmount)}
					/>

					<Stat label="Past claims" value={format(settledAmount)} />

					{hasHold ? (
						<Stat
							label="On hold · claims in progress"
							value={format(heldAmount)}
							className="text-amber-600"
						/>
					) : null}

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
					aria-label={`${usedPercent}% of the limit is used, on hold or claimed`}
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
						className="stroke-amber-400"
						strokeDasharray={`${heldArc} ${RING_CIRCUMFERENCE}`}
						strokeDashoffset={-settledArc}
						transform="rotate(-90 60 60)"
					/>

					<circle
						cx="60"
						cy="60"
						r={RING_RADIUS}
						fill="none"
						strokeWidth="12"
						className={
							eligibility.isOverLimit ? "stroke-red-500" : "stroke-orange-500"
						}
						strokeDasharray={`${claimArc} ${RING_CIRCUMFERENCE}`}
						strokeDashoffset={-(settledArc + heldArc)}
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

			<div className="flex flex-wrap gap-4 text-xs text-iron">
				<Legend swatch="bg-slate-700" label="Past claims" />
				{hasHold ? <Legend swatch="bg-amber-400" label="On hold" /> : null}
				<Legend
					swatch={eligibility.isOverLimit ? "bg-red-500" : "bg-orange-500"}
					label="This claim"
				/>
			</div>

			{hasHold ? (
				<div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
					<Hourglass aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
					<span>
						{`${format(heldAmount)} is held for another claim that is still in progress. It is released if that claim is rejected, and counted as a past claim once it is approved.`}
					</span>
				</div>
			) : null}

			<div className="space-y-1.5 border-t border-slate-200 pt-4">
				<Row label="This claim" value={format(standardTotal)} />
				{approvedStandard > 0 ? (
					<Row
						label="Approved"
						value={format(approvedStandard)}
						className="text-emerald-700"
					/>
				) : null}
			</div>

			<StatusNote tone={tone} className="mt-auto">
				{tone === "over"
					? `This claim exceeds the available balance by ${format(
							-eligibility.balanceAfter,
						)}${hasHold ? ` (${format(heldAmount)} of your limit is on hold)` : ""}.`
					: tone === "low"
						? `Only ${format(eligibility.balanceAfter)} will remain after this claim.`
						: hasClaim
							? `${format(eligibility.balanceAfter)} will remain after this claim.`
							: "Add bills to see how this claim affects the balance."}
			</StatusNote>
		</>
	);

	/* ----------------------------- hospitalisation --------------------------- */
	const hospitalisationBody = hospitalisation
		? (() => {
				const hospHasClaim = hospitalisation.claimingNow > 0;
				const hospHasHold = hospitalisation.held > 0;
				const hospTone: Tone = hospitalisation.isOverLimit
					? "over"
					: hospHasClaim &&
						  hospitalisation.balanceAfter < hospitalisation.remaining * 0.25
						? "low"
						: "ok";
				const pct = (amount: number) =>
					hospitalisation.cap > 0
						? Math.min((amount / hospitalisation.cap) * 100, 100)
						: 0;
				const hospUsedPercent = Math.min(
					Math.round(
						pct(
							hospitalisation.settled +
								hospitalisation.held +
								hospitalisation.claimingNow,
						),
					),
					100,
				);

				return (
					<>
						<dl className="grid grid-cols-2 gap-3">
							<Stat
								label="Hospitalisation limit"
								value={format(hospitalisation.cap)}
							/>
							<Stat
								label="Available before this claim"
								value={format(hospitalisation.remaining)}
								className={TONE_TEXT[hospTone]}
							/>
						</dl>

						<div>
							<div
								className="flex h-2 overflow-hidden rounded-full bg-zinc-200"
								role="img"
								aria-label={`${hospUsedPercent}% of the hospitalisation limit is used, on hold or claimed`}
							>
								<span
									className="bg-slate-700"
									style={{ width: `${pct(hospitalisation.settled)}%` }}
								/>
								<span
									className="bg-amber-400"
									style={{ width: `${pct(hospitalisation.held)}%` }}
								/>
								<span
									className={
										hospitalisation.isOverLimit ? "bg-red-500" : "bg-orange-500"
									}
									style={{
										width: `${pct(
											Math.min(
												hospitalisation.claimingNow,
												hospitalisation.remaining,
											),
										)}%`,
									}}
								/>
							</div>

							<div className="mt-3 flex flex-wrap gap-4 text-xs text-iron">
								<Legend swatch="bg-slate-700" label="Past claims" />
								{hospHasHold ? (
									<Legend swatch="bg-amber-400" label="On hold" />
								) : null}
								<Legend
									swatch={
										hospitalisation.isOverLimit ? "bg-red-500" : "bg-orange-500"
									}
									label="This claim"
								/>
							</div>
						</div>

						{hospHasHold ? (
							<div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
								<Hourglass
									aria-hidden="true"
									className="mt-0.5 shrink-0"
									size={15}
								/>
								<span>
									{`${format(hospitalisation.held)} is held for another hospitalisation claim that is still in progress.`}
								</span>
							</div>
						) : null}

						<div className="space-y-1.5 border-t border-slate-200 pt-4">
							<Row
								label="Past claims"
								value={format(hospitalisation.settled)}
							/>
							{hospHasHold ? (
								<Row
									label="On hold · in progress"
									value={format(hospitalisation.held)}
									className="text-amber-600"
								/>
							) : null}
							<Row
								label="This claim"
								value={format(hospitalisation.claimingNow)}
							/>
							{approvedHospitalisation > 0 ? (
								<Row
									label="Approved"
									value={format(approvedHospitalisation)}
									className="text-emerald-700"
								/>
							) : null}
						</div>

						<StatusNote tone={hospTone} className="mt-auto">
							{hospTone === "over"
								? `Hospitalisation bills exceed the available limit by ${format(
										-hospitalisation.balanceAfter,
									)}${hospHasHold ? ` (${format(hospitalisation.held)} is on hold)` : ""}.`
								: hospTone === "low"
									? `Only ${format(hospitalisation.balanceAfter)} will remain after this claim.`
									: hospHasClaim
										? `${format(hospitalisation.balanceAfter)} will remain after this claim.`
										: "Add a hospitalisation bill to see how it affects this limit."}
						</StatusNote>
					</>
				);
			})()
		: null;

	const hospitalisationTone: Tone = hospitalisation?.isOverLimit
		? "over"
		: "ok";

	// EG grades only — everyone else has no hospitalisation cover.
	const showHospitalisation = Boolean(hospitalisation && hospitalisationBody);
	const anyOpen = standardOpen || (showHospitalisation && hospitalisationOpen);

	const toggleAll = () => {
		setStandardOpen(!anyOpen);
		setHospitalisationOpen(!anyOpen);
	};

	return (
		<aside className={className} aria-label="Eligibility">
			<div className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white">
				{/* Header */}
				<div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
					<div className="flex items-center gap-3">
						<h3 className="text-sm font-semibold text-iron-dark">
							Eligibility
						</h3>

						<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
							{eligibilityPeriodLabel}
						</span>
					</div>

					<button
						type="button"
						onClick={toggleAll}
						className="inline-flex items-center gap-1.5 rounded-md px-1 text-sm font-medium text-orange-600 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
					>
						{anyOpen ? (
							<ChevronsUp aria-hidden="true" size={16} />
						) : (
							<ChevronsDown aria-hidden="true" size={16} />
						)}
						{anyOpen ? "Collapse all" : "Expand all"}
					</button>
				</div>

				{/* Panels: side by side from lg, stacked below */}
				<div
					className={`grid grid-cols-1 divide-y divide-slate-200 ${
						showHospitalisation
							? "lg:grid-cols-2 lg:divide-x lg:divide-y-0"
							: ""
					}`}
				>
					<PanelShell
						id="non-hospitalisation-limit"
						title="Non-hospitalisation limit"
						Icon={Stethoscope}
						summary={
							<AvailableBadge
								value={format(eligibility.remaining)}
								tone={tone}
							/>
						}
						open={standardOpen}
						onToggle={() => setStandardOpen((current) => !current)}
					>
						{nonHospitalisationBody}
					</PanelShell>

					{showHospitalisation && hospitalisation ? (
						<PanelShell
							id="hospitalisation-limit"
							title="Hospitalisation limit"
							Icon={BedDouble}
							badge={
								<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
									Separate limit
								</span>
							}
							summary={
								<AvailableBadge
									value={format(hospitalisation.remaining)}
									tone={hospitalisationTone}
								/>
							}
							open={hospitalisationOpen}
							onToggle={() => setHospitalisationOpen((current) => !current)}
						>
							{hospitalisationBody}
						</PanelShell>
					) : null}
				</div>
			</div>
		</aside>
	);
};

export default EligibilitySidePanel;
