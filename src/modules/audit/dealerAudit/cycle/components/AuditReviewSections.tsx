// modules/audit/dealerAudit/cycle/components/AuditReviewSections.tsx
//
// Read-only building blocks shared by the status, review-summary, approval
// and report pages, so every screen shows scores, score changes and
// deficiencies the same way.

import { ArrowDown, Camera } from "lucide-react";
import { useMemo } from "react";

import Card from "../../../../../components/common/Card";
import GeoLocationLink from "../../../shared/checklist/GeoLocationLink";
import ScoreMatrix, {
	type ScoreMatrixLabels,
} from "../../../shared/checklist/ScoreMatrix";
import type {
	AuditChecklistItem,
	AuditChecklistSection,
	AuditItemEvidence,
} from "../../../shared/execution/audit-execution.types";
import {
	dealerCycleContent as content,
	formatCycleMessage as format,
} from "../dealer-cycle.content";
import {
	buildScoreMatrixRows,
	getDeficiencies,
	getScoreDrops,
} from "../dealer-cycle.logic";

const matrixLabels: ScoreMatrixLabels = content.scoreMatrix;
const text = content.review;

// ── Score overview ────────────────────────────────────────────────────

interface ScoreOverviewProps {
	sections: readonly AuditChecklistSection[];
	title: string;
	/** Dealers must not see reviewer scores. */
	showReviewer: boolean;
	showFinal: boolean;
}

export function ScoreOverview({
	sections,
	title,
	showReviewer,
	showFinal,
}: ScoreOverviewProps) {
	const rows = useMemo(() => buildScoreMatrixRows(sections), [sections]);
	return (
		<Card variant="outlined" title={title} padding="compact">
			<ScoreMatrix
				rows={rows}
				labels={matrixLabels}
				showReviewer={showReviewer}
				showFinal={showFinal}
				showTotal
			/>
		</Card>
	);
}

// ── Score changes ─────────────────────────────────────────────────────

interface ScoreChangeListProps {
	items: readonly AuditChecklistItem[];
	title?: string;
}

export function ScoreChangeList({ items, title }: ScoreChangeListProps) {
	const drops = useMemo(() => getScoreDrops(items), [items]);
	return (
		<Card variant="outlined" title={title ?? text.scoreChangesTitle} padding="compact">
			{drops.length === 0 ? (
				<p className="text-sm text-(--color-text-secondary)">
					{content.reviewSummary.noChanges}
				</p>
			) : (
				<ul className="divide-y divide-(--color-border-default)">
					{drops.map(({ item, dealerScore, reviewerScore, drop }) => (
						<li key={item.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
							<p className="break-words text-sm font-medium">
								{item.sequence}. {item.title}
							</p>
							<p className="flex flex-wrap items-center gap-2 text-sm">
								<ArrowDown className="size-4 text-amber-700" aria-hidden="true" />
								<span className="font-semibold tabular-nums">
									{format(text.scoreChangeLine, {
										dealer: dealerScore,
										reviewer: reviewerScore,
									})}
								</span>
								<span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
									−{drop}
								</span>
							</p>
							<p className="break-words text-sm text-(--color-text-secondary)">
								<span className="font-medium">{text.reasonLabel}: </span>
								{item.review?.scoreChangeReason ?? text.noReason}
							</p>
						</li>
					))}
				</ul>
			)}
		</Card>
	);
}

// ── Evidence thumbnails with map links ───────────────────────────────

export function EvidenceGallery({
	evidence,
}: {
	evidence: readonly AuditItemEvidence[];
}) {
	if (evidence.length === 0) {
		return (
			<p className="flex items-center gap-1.5 text-xs text-(--color-text-secondary)">
				<Camera className="size-4" aria-hidden="true" />
				{text.noEvidence}
			</p>
		);
	}
	return (
		<ul className="grid gap-3 sm:grid-cols-2">
			{evidence.map((photo) => (
				<li
					key={photo.id}
					className="space-y-2 rounded-lg border border-(--color-border-default) p-2"
				>
					<a
						href={photo.url}
						target="_blank"
						rel="noopener noreferrer"
						className="block overflow-hidden rounded-md"
						aria-label={`${text.openPhoto}: ${photo.fileName}`}
					>
						<img
							src={photo.thumbnailUrl ?? photo.url}
							alt={photo.fileName}
							loading="lazy"
							className="h-32 w-full object-cover"
						/>
					</a>
					<GeoLocationLink
						location={{
							latitude: photo.latitude,
							longitude: photo.longitude,
							accuracy: photo.accuracyMeters ?? undefined,
							capturedAt: photo.capturedAt,
						}}
						showTime
					/>
				</li>
			))}
		</ul>
	);
}

// ── Deficiencies ──────────────────────────────────────────────────────

interface DeficiencyListProps {
	items: readonly AuditChecklistItem[];
	title?: string;
	emptyText?: string;
	/** Dealers do not see the reviewer's private notes on other pages. */
	showReviewerNote: boolean;
	showEvidence: boolean;
}

export function DeficiencyList({
	items,
	title,
	emptyText,
	showReviewerNote,
	showEvidence,
}: DeficiencyListProps) {
	const deficiencies = useMemo(() => getDeficiencies(items), [items]);
	return (
		<Card variant="outlined" title={title ?? text.deficienciesTitle} padding="compact">
			{deficiencies.length === 0 ? (
				<p className="text-sm text-(--color-text-secondary)">
					{emptyText ?? content.reports.noDeficiencies}
				</p>
			) : (
				<ul className="divide-y divide-(--color-border-default)">
					{deficiencies.map(({ item, finalScore }) => (
						<li key={item.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
							<div className="flex flex-wrap items-start justify-between gap-2">
								<p className="min-w-0 break-words text-sm font-medium">
									{item.sequence}. {item.title}
								</p>
								<span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
									{format(text.deficiencyScore, {
										score: finalScore,
										max: item.maxScore,
									})}
								</span>
							</div>
							<p className="text-xs text-(--color-text-secondary)">
								{item.sectionName}
							</p>
							{showReviewerNote && item.review?.remarks ? (
								<p className="break-words text-sm">
									<span className="font-medium">{text.reviewerRemark}: </span>
									{item.review.remarks}
								</p>
							) : null}
							{showEvidence ? <EvidenceGallery evidence={item.self.evidence} /> : null}
						</li>
					))}
				</ul>
			)}
		</Card>
	);
}
