// modules/audit/shared/templates/AuditTemplateSummaryPanel.tsx
import { Award, Camera, ListChecks } from "lucide-react";

import Card from "../../../../components/common/Card";
import type { AuditTemplateSummary } from "./audit.template.types";

type Props = {
	summary: AuditTemplateSummary;
	sticky?: boolean;
	title?: string;
	eyebrow?: string;
};

export default function AuditTemplateSummaryPanel({
	summary,
	sticky = false,
	title = "Checklist outline",
	eyebrow = "Live structure",
}: Props) {
	return (
		<Card
			variant="outlined"
			padding="compact"
			className={sticky ? "sticky top-24 self-start" : undefined}
			aria-label={title}
		>
			<p className="text-xs font-bold uppercase tracking-wide text-(--color-brand)">
				{eyebrow}
			</p>
			<h3 className="mt-1 text-base font-semibold text-(--color-text-primary)">
				{title}
			</h3>

			<ol className="mt-4 space-y-3">
				{summary.perSection.map((section, index) => (
					<li key={section.sectionId} className="flex items-start gap-2.5">
						<span className="grid size-7 shrink-0 place-items-center rounded-full bg-(--color-brand-softest) text-xs font-bold text-(--color-brand)">
							{index + 1}
						</span>
						<span className="min-w-0">
							<span className="block truncate text-sm font-semibold text-(--color-text-primary)">
								{section.name}
							</span>
							<span className="block text-xs text-(--color-text-secondary)">
								{section.parameterCount} item
								{section.parameterCount === 1 ? "" : "s"} · {section.points} pts
							</span>
						</span>
					</li>
				))}
				{summary.perSection.length === 0 ? (
					<li className="text-xs text-(--color-text-secondary)">
						No sections yet.
					</li>
				) : null}
			</ol>

			<dl className="mt-4 space-y-1.5 rounded-xl bg-(--color-bg-muted) px-4 py-3 text-xs">
				<div className="flex items-center justify-between text-(--color-text-secondary)">
					<dt className="inline-flex items-center gap-1.5">
						<ListChecks size={14} aria-hidden="true" /> Parameters
					</dt>
					<dd className="font-semibold text-(--color-text-primary)">
						{summary.parameterCount} ({summary.scoredParameterCount} scored)
					</dd>
				</div>
				<div className="flex items-center justify-between text-(--color-text-secondary)">
					<dt className="inline-flex items-center gap-1.5">
						<Camera size={14} aria-hidden="true" /> Photo evidence
					</dt>
					<dd className="font-semibold text-(--color-text-primary)">
						{summary.evidenceParameterCount}
					</dd>
				</div>
				<div className="flex items-baseline justify-between pt-1">
					<dt className="inline-flex items-center gap-1.5 text-(--color-text-secondary)">
						<Award size={14} aria-hidden="true" /> Total points
					</dt>
					<dd className="text-2xl font-bold text-(--color-text-primary)">
						{summary.totalPoints}
					</dd>
				</div>
			</dl>
		</Card>
	);
}
