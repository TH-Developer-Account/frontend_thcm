// modules/audit/shared/templates/AuditTemplatePreview.tsx
//
// Read-only rendering of a template. Used by the builder's Review step
// and by the template View page, so both always show the same thing.
//
// layout "sections" → one card per section (1.1, 1.2 …).
// layout "flat"     → one card per value of the first parameter field
//                     (Function for Dealer Audit), numbered 1, 2, 3 …

import { Camera } from "lucide-react";

import Card from "../../../../components/common/Card";
import { Badge } from "../../../../components/common/Badge";
import AuditTemplateSummaryPanel from "./AuditTemplateSummaryPanel";
import type { AuditTemplateLayout } from "./audit-template.schemas";
import type {
	AuditTemplateBuilderValues,
	AuditTemplateFieldConfig,
	AuditTemplateParameterFormValues,
	AuditTemplateSummary,
} from "./audit.template.types";
import {
	deriveTemplateSummary,
	getFieldOptionLabel,
	getParameterMaxScore,
	sortScoreLevels,
} from "./audit-template.utils";

type Props = {
	values: AuditTemplateBuilderValues;
	detailFields: readonly AuditTemplateFieldConfig[];
	parameterFields: readonly AuditTemplateFieldConfig[];
	layout?: AuditTemplateLayout;
	summaryTitle?: string;
};

interface PreviewBlock {
	id: string;
	title: string;
	items: Array<{
		parameter: AuditTemplateParameterFormValues;
		label: string;
	}>;
}

const UNASSIGNED_LABEL = "Unassigned";

const buildSectionBlocks = (
	sections: AuditTemplateBuilderValues["sections"],
): PreviewBlock[] =>
	sections.map((section, sectionIndex) => ({
		id: section.id,
		title: `${sectionIndex + 1}. ${section.name || "Untitled section"}`,
		items: section.parameters.map((parameter, parameterIndex) => ({
			parameter,
			label: `${sectionIndex + 1}.${parameterIndex + 1}`,
		})),
	}));

/** Groups every parameter by the first configured field, in option order. */
const buildFlatBlocks = (
	sections: AuditTemplateBuilderValues["sections"],
	groupField: AuditTemplateFieldConfig | undefined,
): PreviewBlock[] => {
	const parameters = sections.flatMap((section) => section.parameters);

	if (!groupField) {
		return [
			{
				id: "all",
				title: "Parameters",
				items: parameters.map((parameter, index) => ({
					parameter,
					label: String(index + 1),
				})),
			},
		];
	}

	const groups = new Map<string, AuditTemplateParameterFormValues[]>();
	parameters.forEach((parameter) => {
		const key = parameter.attributes[groupField.key] ?? "";
		groups.set(key, [...(groups.get(key) ?? []), parameter]);
	});

	const optionOrder =
		groupField.type === "select"
			? groupField.options.map((option) => option.value)
			: [];
	const rank = (key: string): number => {
		if (!key) return Number.MAX_SAFE_INTEGER;
		const index = optionOrder.indexOf(key);
		return index === -1 ? optionOrder.length : index;
	};

	let counter = 0;
	return Array.from(groups.entries())
		.sort(([a], [b]) => rank(a) - rank(b))
		.map(([key, groupParameters]) => ({
			id: key || "unassigned",
			title: getFieldOptionLabel(groupField, key) || UNASSIGNED_LABEL,
			items: groupParameters.map((parameter) => {
				counter += 1;
				return { parameter, label: String(counter) };
			}),
		}));
};

export default function AuditTemplatePreview({
	values,
	detailFields,
	parameterFields,
	layout = "sections",
	summaryTitle = "Final summary",
}: Props) {
	const { details, sections } = values;
	const isFlat = layout === "flat";
	const groupField = parameterFields[0];

	const blocks = isFlat
		? buildFlatBlocks(sections, groupField)
		: buildSectionBlocks(sections);

	const baseSummary = deriveTemplateSummary(sections);
	// In the flat layout the outline lists the groups (Functions), not the
	// hidden implicit section.
	const summary: AuditTemplateSummary = isFlat
		? {
				...baseSummary,
				sectionCount: blocks.length,
				perSection: blocks.map((block) => ({
					sectionId: block.id,
					name: block.title,
					parameterCount: block.items.length,
					scoredParameterCount: block.items.filter(
						({ parameter }) => parameter.isScored,
					).length,
					points: block.items.reduce(
						(sum, { parameter }) => sum + getParameterMaxScore(parameter),
						0,
					),
				})),
			}
		: baseSummary;

	// The grouping field is already the card heading in the flat layout.
	const badgeFields = isFlat ? parameterFields.slice(1) : parameterFields;

	return (
		<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
			<div className="space-y-4">
				<Card variant="outlined" padding="default">
					<h2 className="text-base font-semibold text-(--color-text-primary)">
						{details.name || "Untitled template"}
					</h2>
					{details.description ? (
						<p className="mt-1 whitespace-pre-line text-body-sm text-(--color-text-secondary)">
							{details.description}
						</p>
					) : null}

					{detailFields.length > 0 ? (
						<dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
							{detailFields.map((config) => (
								<div key={config.key}>
									<dt className="text-xs text-(--color-text-secondary)">
										{config.label}
									</dt>
									<dd className="text-sm font-semibold text-(--color-text-primary)">
										{getFieldOptionLabel(config, details.fields[config.key]) ||
											"--"}
									</dd>
								</div>
							))}
						</dl>
					) : null}
				</Card>

				{blocks.map((block) => (
					<Card
						key={block.id}
						variant="outlined"
						padding="compact"
						aria-label={block.title}
					>
						<h3 className="text-sm font-semibold text-(--color-text-primary)">
							{block.title}
							{isFlat ? (
								<span className="ml-2 text-xs font-normal text-(--color-text-secondary)">
									{block.items.length} parameter
									{block.items.length === 1 ? "" : "s"}
								</span>
							) : null}
						</h3>

						<ol className="mt-3 divide-y divide-(--color-border-default)">
							{block.items.map(({ parameter, label }) => {
								const attributeLabels = badgeFields
									.map((config) =>
										getFieldOptionLabel(config, parameter.attributes[config.key]),
									)
									.filter(Boolean);

								return (
									<li key={parameter.id} className="py-3 first:pt-0 last:pb-0">
										<div className="flex flex-wrap items-start justify-between gap-2">
											<p className="min-w-0 text-sm font-semibold text-(--color-text-primary)">
												{label} {parameter.title || "Untitled parameter"}
											</p>
											<div className="flex flex-wrap gap-1.5">
												{attributeLabels.map((attributeLabel) => (
													<Badge
														key={attributeLabel}
														variant="neutral"
														text={attributeLabel}
													/>
												))}
												{parameter.evidenceRequired ? (
													<Badge
														variant="warning"
														text={`Photo ${parameter.minEvidenceCount}–${parameter.maxEvidenceCount}`}
													/>
												) : null}
												<Badge
													variant={parameter.isScored ? "success" : "neutral"}
													text={
														parameter.isScored
															? `Max ${getParameterMaxScore(parameter)} pts`
															: "Not scored"
													}
												/>
											</div>
										</div>

										{parameter.guidance ? (
											<p className="mt-1 whitespace-pre-line text-xs text-(--color-text-secondary)">
												{parameter.guidance}
											</p>
										) : null}

										{parameter.isScored && parameter.scoreLevels.length > 0 ? (
											<table className="mt-2 w-full max-w-lg text-xs">
												<caption className="sr-only">
													Scoring criteria for {parameter.title}
												</caption>
												<thead>
													<tr className="text-left text-(--color-text-secondary)">
														<th scope="col" className="w-16 py-1 font-semibold">
															Score
														</th>
														<th scope="col" className="py-1 font-semibold">
															Criteria
														</th>
													</tr>
												</thead>
												<tbody>
													{sortScoreLevels(parameter.scoreLevels).map((level) => (
														<tr key={level.id}>
															<td className="py-0.5 font-bold text-(--color-text-primary)">
																{level.score}
															</td>
															<td className="py-0.5 text-(--color-text-primary)">
																{level.criteria}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										) : null}

										{parameter.evidenceRequired ? (
											<p className="mt-1.5 inline-flex items-center gap-1 text-xs text-(--color-text-secondary)">
												<Camera size={12} aria-hidden="true" /> Live photo
												required before submission
											</p>
										) : null}
									</li>
								);
							})}
						</ol>
					</Card>
				))}
			</div>

			<div className="hidden lg:block">
				<AuditTemplateSummaryPanel
					summary={summary}
					sticky
					title={summaryTitle}
					eyebrow="Summary"
				/>
			</div>
		</div>
	);
}
