import { Award, ListChecks } from "lucide-react";
import type { ChecklistTemplateSummary } from "../dealer-audit.types";
import Card from "../../../../components/common/Card";

type Props = {
	summary: ChecklistTemplateSummary;
	sticky?: boolean;
	title?: string;
};

export default function ChecklistTemplateSummaryPanel({
	summary,
	sticky = false,
	title = "Checklist outline",
}: Props) {
	return (
		<Card
			variant="outlined"
			padding="compact"
			className={sticky ? "sticky top-24 self-start" : ""}
		>
			<p className="text-xs font-bold uppercase tracking-wide text-brand">
				Live structure
			</p>
			<h3 className="mt-1 text-base font-semibold text-slate-900">{title}</h3>
			<p className="mt-1 text-xs text-slate-500">
				Your template updates as you build.
			</p>

			<ol className="mt-4 space-y-3">
				{summary.perSection.map((section, index) => (
					<li key={section.sectionId} className="flex items-start gap-2.5">
						<span className="grid size-7 shrink-0 place-items-center rounded-full bg-orange-50 text-xs font-bold text-brand">
							{index + 1}
						</span>
						<span className="min-w-0">
							<span className="block text-sm font-semibold text-slate-900">
								{section.name}
							</span>
							<span className="block text-xs text-slate-500">
								{section.parameterCount} item
								{section.parameterCount === 1 ? "" : "s"} · {section.points} pts
							</span>
						</span>
					</li>
				))}
				{summary.perSection.length === 0 ? (
					<li className="text-xs text-slate-400">No sections yet.</li>
				) : null}
			</ol>

			<div className="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-white">
				<div className="flex items-center justify-between text-xs text-slate-300">
					<span className="inline-flex items-center gap-1.5">
						<ListChecks size={14} aria-hidden="true" /> Total items
					</span>
					<span>{summary.parameterCount}</span>
				</div>
				<div className="mt-1 flex items-baseline justify-between">
					<span className="text-2xl font-bold">{summary.totalPoints}</span>
					<span className="inline-flex items-center gap-1 text-xs text-slate-300">
						<Award size={13} aria-hidden="true" /> total points
					</span>
				</div>
			</div>
		</Card>
	);
}
