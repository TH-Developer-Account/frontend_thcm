import { AlertTriangle } from "lucide-react";

import {
	currencyFormatter,
	useReimbursementClaimFormContext,
} from "../hooks/useReimbursementClaimForm";
import EligibilitySidePanel from "./EligibilitySidePanel";

type Tone = "ok" | "low" | "over";

const format = (amount: number) => currencyFormatter.format(amount);
const clamp = (value: number) => Math.max(0, Math.min(value, 100));
const round2 = (value: number) => Math.round(value * 100) / 100;

const TONE_TEXT: Record<Tone, string> = {
	ok: "text-emerald-700",
	low: "text-amber-700",
	over: "text-red-700",
};

const TONE_FILL: Record<Tone, string> = {
	ok: "bg-orange-500",
	low: "bg-amber-500",
	over: "bg-red-600",
};

const TONE_SECTION: Record<Tone, string> = {
	ok: "",
	low: "bg-amber-50",
	over: "bg-red-50",
};

type LedgerSectionProps = {
	title: string;
	limit: number;
	/** Settled plus pending (held) claims, i.e. limit - available. */
	past: number;
	claiming: number;
	remaining: number;
	isOverLimit: boolean;
	emptyMessage: string;
	overMessage: string;
};

const Line = ({
	label,
	value,
	valueClassName = "text-iron-dark",
}: {
	label: string;
	value: string;
	valueClassName?: string;
}) => (
	<div className="flex items-baseline justify-between gap-3 py-0.5 text-[13px] text-iron">
		<span>{label}</span>
		<span className={`font-semibold tabular-nums ${valueClassName}`}>
			{value}
		</span>
	</div>
);

const LedgerSection = ({
	title,
	limit,
	past,
	claiming,
	remaining,
	isOverLimit,
	emptyMessage,
	overMessage,
}: LedgerSectionProps) => {
	const hasClaim = claiming > 0;
	const tone: Tone = isOverLimit
		? "over"
		: hasClaim && remaining < limit * 0.25
			? "low"
			: "ok";

	const pastPct = limit > 0 ? clamp((past / limit) * 100) : 0;
	const claimPct =
		tone === "over"
			? 100 - pastPct
			: limit > 0
				? clamp(Math.min((claiming / limit) * 100, 100 - pastPct))
				: 0;

	return (
		<section
			aria-label={title}
			className={`border-b border-slate-200 px-5 py-3.5 ${TONE_SECTION[tone]}`}
		>
			<p
				className={`mb-1.5 text-[11px] font-medium uppercase tracking-wide ${
					tone === "over" ? "text-red-800" : "text-muted"
				}`}
			>
				{title}
				{tone === "over" ? " · over limit" : ""}
			</p>

			<Line label="Limit" value={format(limit)} />
			<Line label="Past claims" value={`− ${format(past)}`} />
			<Line
				label="This claim"
				value={`− ${format(claiming)}`}
				valueClassName={tone === "over" ? "text-red-700" : "text-orange-700"}
			/>

			<div
				role="img"
				aria-label={
					tone === "over"
						? "This claim is above the available limit"
						: `${Math.round(pastPct + claimPct)}% of the limit is used or claimed`
				}
				className={`my-2 flex h-2 overflow-hidden rounded-full ${
					tone === "over" ? "bg-red-100" : "bg-slate-200"
				}`}
			>
				<span className="bg-slate-700" style={{ width: `${pastPct}%` }} />
				<span className={TONE_FILL[tone]} style={{ width: `${claimPct}%` }} />
			</div>

			<div className="flex items-baseline justify-between gap-3 border-t border-dashed border-slate-300 pt-2">
				<span
					className={`text-[15px] ${tone === "over" ? "text-red-800" : "text-iron"}`}
				>
					{tone === "over" ? "Over by" : "Remaining"}
				</span>
				<span
					className={`text-base font-bold tabular-nums ${TONE_TEXT[tone]}`}
				>
					{format(Math.abs(remaining))}
				</span>
			</div>

			{tone === "over" ? (
				<div
					role="alert"
					className="mt-2.5 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium leading-snug text-red-800"
				>
					<AlertTriangle
						aria-hidden="true"
						className="mt-0.5 shrink-0"
						size={14}
					/>
					<span>
						<span className="block text-[13px] font-semibold">
							This claim is above your limit
						</span>
						{overMessage}
					</span>
				</div>
			) : (
				<p
					role="status"
					className={`mt-2 text-xs font-medium ${
						tone === "low" ? "text-amber-700" : "text-muted"
					}`}
				>
					{tone === "low"
						? `Only ${format(remaining)} will remain after this claim.`
						: hasClaim
							? `On track · ${format(remaining)} will remain after this claim.`
							: emptyMessage}
				</p>
			)}
		</section>
	);
};

type ClaimEligibilityLedgerProps = {
	/** e.g. "lg:sticky lg:top-4" to pin the rail while the claimant scrolls. */
	className?: string;
};

const OVER_MESSAGE =
	"You can still submit. HR may approve only the eligible amount.";

/**
 * Ledger-style eligibility rail for the public and guest views:
 * Limit - Past claims - This claim = Remaining (or Over by), one block per
 * limit. Amber when the balance is low, red with an alert when the claim is
 * over the limit. Place it in a sidebar next to the form.
 */
export const ClaimEligibilityLedger = ({
	className = "",
}: ClaimEligibilityLedgerProps) => {
	const {
		selectedGrade,
		resolvedEligibleAmount,
		standardTotal,
		eligibility,
		eligibilityPeriodLabel,
		hospitalisation,
	} = useReimbursementClaimFormContext();

	// No grade / no configured limit: the panel already explains it.
	if (!selectedGrade || resolvedEligibleAmount === null) {
		return <EligibilitySidePanel className={className} />;
	}

	return (
		<section
			aria-label="Eligibility summary"
			className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
		>
			<div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
				<h3 className="text-sm font-semibold text-iron-dark">Eligibility</h3>
				<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
					{eligibilityPeriodLabel}
				</span>
			</div>

			<LedgerSection
				title={hospitalisation ? "Non-hospitalisation" : "Eligibility limit"}
				limit={resolvedEligibleAmount}
				past={round2(Math.max(resolvedEligibleAmount - eligibility.remaining, 0))}
				claiming={standardTotal}
				remaining={eligibility.balanceAfter}
				isOverLimit={eligibility.isOverLimit}
				emptyMessage="Add bills to see how this claim affects your balance."
				overMessage={OVER_MESSAGE}
			/>

			{hospitalisation ? (
				<LedgerSection
					title="Hospitalisation"
					limit={hospitalisation.cap}
					past={round2(Math.max(hospitalisation.cap - hospitalisation.remaining, 0))}
					claiming={hospitalisation.claimingNow}
					remaining={hospitalisation.balanceAfter}
					isOverLimit={hospitalisation.isOverLimit}
					emptyMessage="Add a hospitalisation bill to see how it affects this limit."
					overMessage={OVER_MESSAGE}
				/>
			) : null}
		</section>
	);
};

export default ClaimEligibilityLedger;
