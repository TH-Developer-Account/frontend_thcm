// modules/audit/shared/templates/AuditTemplatePreview.tsx
//
// Read-only rendering of a template. Used by the builder's Review step
// and by the template View page, so both always show the same thing.

import { Camera } from "lucide-react";

import Card from "../../../../components/common/Card";
import { Badge } from "../../../../components/common/Badge";
import AuditTemplateSummaryPanel from "./AuditTemplateSummaryPanel";
import type {
	AuditTemplateBuilderValues,
	AuditTemplateFieldConfig,
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
	summaryTitle?: string;
};

export default function AuditTemplatePreview({
	values,
	detailFields,
	parameterFields,
	summaryTitle = "Final summary",
}: Props) {
	const { details, sections } = values;
	const summary = deriveTemplateSummary(sections);

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

				{sections.map((section, sectionIndex) => (
					<Card
						key={section.id}
						variant="outlined"
						padding="compact"
						aria-label={section.name || `Section ${sectionIndex + 1}`}
					>
						<h3 className="text-sm font-semibold text-(--color-text-primary)">
							{sectionIndex + 1}. {section.name || "Untitled section"}
						</h3>

						<ol className="mt-3 divide-y divide-(--color-border-default)">
							{section.parameters.map((parameter, parameterIndex) => {
								const attributeLabels = parameterFields
									.map((config) =>
										getFieldOptionLabel(config, parameter.attributes[config.key]),
									)
									.filter(Boolean);

								return (
									<li key={parameter.id} className="py-3 first:pt-0 last:pb-0">
										<div className="flex flex-wrap items-start justify-between gap-2">
											<p className="min-w-0 text-sm font-semibold text-(--color-text-primary)">
												{sectionIndex + 1}.{parameterIndex + 1}{" "}
												{parameter.title || "Untitled parameter"}
											</p>
											<div className="flex flex-wrap gap-1.5">
												{attributeLabels.map((label) => (
													<Badge key={label} variant="neutral" text={label} />
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
