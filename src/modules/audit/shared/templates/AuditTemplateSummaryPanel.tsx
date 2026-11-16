// modules/audit/shared/templates/AuditTemplateSummaryPanel.tsx
//
// Summary sidebar for a template, in the wireframe's "Final summary" style:
// title, label / value rows, then an optional divider + small note.
//
// Rows (in order): any `leadingRows` (Template, Facility type …), Sections,
// Parameters, Photo required. Total score sits in the card footer.
//
// Font sizes use the app's rem-based Tailwind scale (text-base / text-sm /
// text-xs) so the panel matches the rest of the page at any root size.
// `showSections` adds the per-section outline used by the Build step.

import type { ReactNode } from "react";

import Card from "../../../../components/common/Card";
import type { AuditTemplateSummary } from "./audit.template.types";

export type AuditTemplateSummaryRow = {
	label: string;
	value: string;
};

type Props = {
	summary: AuditTemplateSummary;
	title?: string;
	/** Rows shown above the counts, e.g. Template and Facility type. */
	leadingRows?: readonly AuditTemplateSummaryRow[];
	/** Small print under the divider. */
	note?: ReactNode;
	sticky?: boolean;
	showSections?: boolean;
};

export default function AuditTemplateSummaryPanel({
	summary,
	title = "Final summary",
	leadingRows = [],
	note,
	sticky = false,
	showSections = false,
}: Props) {
	const rows: readonly AuditTemplateSummaryRow[] = [
		...leadingRows,
		{ label: "Sections", value: String(summary.sectionCount) },
		{ label: "Parameters", value: String(summary.parameterCount) },
		{ label: "Photo required", value: String(summary.evidenceParameterCount) },
	];

	return (
		<Card
			variant="default"
			padding="default"
			className={sticky ? "lg:sticky lg:top-24 lg:self-start" : undefined}
			aria-label={title}
			title={title}
			footer={
				<div className="flex justify-between gap-3 w-full text-md font-semibold">
					<span className="text-(--color-text-secondary)">Total score:</span>
					<span className="text-(--color-text-primary)">
						{summary.totalPoints}
					</span>
				</div>
			}
		>
			{showSections ? (
				<ol className="mt-3 space-y-2.5">
					{summary.perSection.map((section, index) => (
						<li key={section.sectionId} className="flex items-start gap-2.5">
							<span className="grid size-7 shrink-0 place-items-center rounded-full bg-(--color-bg-muted) text-xs text-(--color-text-secondary)">
								{index + 1}
							</span>
							<span className="min-w-0">
								<span className="block truncate text-sm font-semibold text-(--color-text-primary)">
									{section.name}
								</span>
								<span className="block text-xs text-(--color-text-secondary)">
									{section.parameterCount} item
									{section.parameterCount === 1 ? "" : "s"} · {section.points}{" "}
									pts
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
			) : null}

			<dl
				className={`space-y-2.5 text-sm ${
					showSections
						? "mt-4 border-t border-(--color-border-default) pt-3"
						: "mt-3"
				}`}
			>
				{rows.map((row) => (
					<div key={row.label} className="flex justify-between gap-3">
						<dt className="shrink-0 text-(--color-text-secondary)">
							{row.label}
						</dt>
						<dd className="min-w-0 text-right text-(--color-text-primary)">
							{row.value}
						</dd>
					</div>
				))}
			</dl>

			{note ? (
				<p className="mt-4 border-t border-(--color-border-default) pt-3 text-xs leading-relaxed text-(--color-text-secondary)">
					{note}
				</p>
			) : null}
		</Card>
	);
}
