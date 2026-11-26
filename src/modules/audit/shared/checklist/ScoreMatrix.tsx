// modules/audit/shared/checklist/ScoreMatrix.tsx
//
// Shared scoring matrix: one row per section (or any grouping) with the
// dealer score, the reviewer score and the final score side by side.
// Used by Dealer Audit today; Factory Audit can pass the same rows.
//
// Domain-free on purpose — callers map their own data into ScoreMatrixRow
// and pass the (already translated) labels. Nothing here knows a status.
//
//  • Desktop / tablet: a real <table> (screen-reader friendly).
//  • Mobile: stacked cards, because a 5-column table is unreadable at 360px.
//  • Never colour-only: a drop is also shown as "−1" with an arrow icon.

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useId } from "react";

export interface ScoreMatrixRow {
	id: string;
	label: string;
	/** null = not scored yet / not visible to this user. */
	dealerScore: number | null;
	reviewerScore: number | null;
	finalScore: number | null;
	maxScore: number;
}

export interface ScoreMatrixLabels {
	caption: string;
	section: string;
	dealer: string;
	reviewer: string;
	final: string;
	total: string;
	/** "{points} points lower than the dealer" — {points} is replaced. */
	lowerBy: string;
	higherBy: string;
	same: string;
	notScored: string;
}

export interface ScoreMatrixProps {
	rows: readonly ScoreMatrixRow[];
	labels: ScoreMatrixLabels;
	/** Dealers must not see reviewer scores; hide the column for them. */
	showReviewer?: boolean;
	showFinal?: boolean;
	showTotal?: boolean;
	className?: string;
}

const sum = (values: ReadonlyArray<number | null>): number | null => {
	const present = values.filter((value): value is number => value !== null);
	return present.length === 0 ? null : present.reduce((a, b) => a + b, 0);
};

const percent = (score: number | null, max: number): number =>
	score === null || max <= 0 ? 0 : Math.min(100, Math.round((score / max) * 100));

const fill = (template: string, points: number): string =>
	template.replace("{points}", String(points));

function Delta({
	from,
	to,
	labels,
}: {
	from: number | null;
	to: number | null;
	labels: ScoreMatrixLabels;
}) {
	if (from === null || to === null) return null;
	const diff = to - from;
	if (diff === 0) {
		return (
			<span className="inline-flex items-center gap-1 text-xs text-slate-500">
				<Minus size={12} aria-hidden="true" />
				<span className="sr-only">{labels.same}</span>
			</span>
		);
	}
	const lower = diff < 0;
	const points = Math.abs(diff);
	return (
		<span
			className={
				lower
					? "inline-flex items-center gap-0.5 text-xs font-medium text-amber-700"
					: "inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700"
			}
		>
			{lower ? (
				<ArrowDown size={12} aria-hidden="true" />
			) : (
				<ArrowUp size={12} aria-hidden="true" />
			)}
			<span aria-hidden="true">{lower ? `−${points}` : `+${points}`}</span>
			<span className="sr-only">
				{fill(lower ? labels.lowerBy : labels.higherBy, points)}
			</span>
		</span>
	);
}

function ScoreCell({
	score,
	max,
	labels,
}: {
	score: number | null;
	max: number;
	labels: ScoreMatrixLabels;
}) {
	if (score === null) {
		return <span className="text-slate-400">{labels.notScored}</span>;
	}
	return (
		<span className="tabular-nums">
			<span className="font-semibold">{score}</span>
			<span className="text-slate-500">/{max}</span>
		</span>
	);
}

export default function ScoreMatrix({
	rows,
	labels,
	showReviewer = true,
	showFinal = true,
	showTotal = true,
	className = "",
}: ScoreMatrixProps) {
	const captionId = useId();
	const totalMax = rows.reduce((acc, row) => acc + row.maxScore, 0);
	const total = {
		dealer: sum(rows.map((row) => row.dealerScore)),
		reviewer: sum(rows.map((row) => row.reviewerScore)),
		final: sum(rows.map((row) => row.finalScore)),
	};
	const resolvedFinal = (row: ScoreMatrixRow): number | null => row.finalScore;

	return (
		<div className={className}>
			<p id={captionId} className="sr-only">
				{labels.caption}
			</p>

			{/* Tablet / desktop */}
			<div className="hidden overflow-x-auto md:block">
				<table className="w-full text-sm" aria-labelledby={captionId}>
					<thead>
						<tr className="text-left text-xs text-(--color-text-secondary)">
							<th scope="col" className="py-2 pr-3 font-medium">
								{labels.section}
							</th>
							<th scope="col" className="py-2 pr-3 text-right font-medium">
								{labels.dealer}
							</th>
							{showReviewer ? (
								<th scope="col" className="py-2 pr-3 text-right font-medium">
									{labels.reviewer}
								</th>
							) : null}
							{showFinal ? (
								<th scope="col" className="py-2 text-right font-medium">
									{labels.final}
								</th>
							) : null}
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.id} className="border-t border-(--color-border-default)">
								<th scope="row" className="py-2 pr-3 text-left font-normal break-words">
									{row.label}
								</th>
								<td className="py-2 pr-3 text-right">
									<ScoreCell score={row.dealerScore} max={row.maxScore} labels={labels} />
								</td>
								{showReviewer ? (
									<td className="py-2 pr-3 text-right">
										<span className="inline-flex items-center justify-end gap-2">
											<Delta from={row.dealerScore} to={row.reviewerScore} labels={labels} />
											<ScoreCell score={row.reviewerScore} max={row.maxScore} labels={labels} />
										</span>
									</td>
								) : null}
								{showFinal ? (
									<td className="py-2 text-right">
										<ScoreCell score={resolvedFinal(row)} max={row.maxScore} labels={labels} />
									</td>
								) : null}
							</tr>
						))}
					</tbody>
					{showTotal ? (
						<tfoot>
							<tr className="border-t-2 border-(--color-border-default) font-semibold">
								<th scope="row" className="py-2 pr-3 text-left">
									{labels.total}
								</th>
								<td className="py-2 pr-3 text-right">
									<ScoreCell score={total.dealer} max={totalMax} labels={labels} />
								</td>
								{showReviewer ? (
									<td className="py-2 pr-3 text-right">
										<span className="inline-flex items-center justify-end gap-2">
											<Delta from={total.dealer} to={total.reviewer} labels={labels} />
											<ScoreCell score={total.reviewer} max={totalMax} labels={labels} />
										</span>
									</td>
								) : null}
								{showFinal ? (
									<td className="py-2 text-right">
										<ScoreCell score={total.final} max={totalMax} labels={labels} />
									</td>
								) : null}
							</tr>
						</tfoot>
					) : null}
				</table>
			</div>

			{/* Mobile */}
			<ul className="space-y-2 md:hidden" aria-labelledby={captionId}>
				{rows.map((row) => (
					<li
						key={row.id}
						className="rounded-lg border border-(--color-border-default) p-3"
					>
						<p className="mb-2 break-words text-sm font-medium">{row.label}</p>
						<dl className="grid grid-cols-3 gap-2 text-center text-xs">
							<div>
								<dt className="text-(--color-text-secondary)">{labels.dealer}</dt>
								<dd className="mt-0.5 text-sm">
									<ScoreCell score={row.dealerScore} max={row.maxScore} labels={labels} />
								</dd>
							</div>
							{showReviewer ? (
								<div>
									<dt className="text-(--color-text-secondary)">{labels.reviewer}</dt>
									<dd className="mt-0.5 flex items-center justify-center gap-1 text-sm">
										<ScoreCell score={row.reviewerScore} max={row.maxScore} labels={labels} />
										<Delta from={row.dealerScore} to={row.reviewerScore} labels={labels} />
									</dd>
								</div>
							) : null}
							{showFinal ? (
								<div>
									<dt className="text-(--color-text-secondary)">{labels.final}</dt>
									<dd className="mt-0.5 text-sm">
										<ScoreCell score={resolvedFinal(row)} max={row.maxScore} labels={labels} />
									</dd>
								</div>
							) : null}
						</dl>
						<div
							className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"
							role="presentation"
						>
							<div
								className="h-full bg-(--color-brand)"
								style={{
									width: `${percent(
										resolvedFinal(row) ?? row.reviewerScore ?? row.dealerScore,
										row.maxScore,
									)}%`,
								}}
							/>
						</div>
					</li>
				))}
				{showTotal ? (
					<li className="rounded-lg bg-slate-50 p-3 text-sm font-semibold">
						<div className="flex items-center justify-between gap-2">
							<span>{labels.total}</span>
							<span className="tabular-nums">
								{(showFinal ? total.final : null) ??
									(showReviewer ? total.reviewer : null) ??
									total.dealer ??
									"—"}
								/{totalMax}
							</span>
						</div>
					</li>
				) : null}
			</ul>
		</div>
	);
}
