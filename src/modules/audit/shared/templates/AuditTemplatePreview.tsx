// modules/audit/shared/templates/AuditTemplatePreview.tsx
//
// Read-only rendering of a template. Used by the builder's Review step
// and by the template View page.
//
// layout "sections" → one card per section (1.1, 1.2 …).
// layout "flat"     → one card per value of the first parameter field
//                     (Function for Dealer Audit), numbered 1, 2, 3 …
//
// variant "view"               → expandable section cards (admin View page):
//                                search, expand/collapse all, every line item
//                                expands to its criteria, scoring and
//                                reference photo.
// variant "review"             → compact numbered rows + summary card, as in
//                                the wireframe (builder Review & publish).
// variant "detailed" (default) → full rubric with score tables, always open.

import { useEffect, useId, useRef, useState } from "react";
import { Camera, ChevronRight, ImageOff } from "lucide-react";

import Card, { type CardSection } from "../../../../components/common/Card";
import { Badge } from "../../../../components/common/Badge";
import { SearchInput } from "../../../../components/forms/SearchInput";
import AuditTemplateSummaryPanel, {
	type AuditTemplateSummaryRow,
} from "./AuditTemplateSummaryPanel";
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

export type AuditTemplatePreviewVariant = "detailed" | "review" | "view";

/** Saved parameter id (serverId) → reference photo URL. */
export type AuditTemplateReferencePhotos = Readonly<
	Record<string, string | null | undefined>
>;

type Props = {
	values: AuditTemplateBuilderValues;
	detailFields: readonly AuditTemplateFieldConfig[];
	parameterFields: readonly AuditTemplateFieldConfig[];
	layout?: AuditTemplateLayout;
	summaryTitle?: string;
	variant?: AuditTemplatePreviewVariant;
	/** Only used by the "view" variant. */
	referencePhotos?: AuditTemplateReferencePhotos;
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

const PUBLISH_NOTE =
	"Publishing makes this version read-only. Edits create a new draft version. Existing audits keep their version.";

const pluralize = (count: number, singular: string): string =>
	`${count} ${singular}${count === 1 ? "" : "s"}`;

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

/** Template name + module-specific detail fields (facility type …). */
const getSummaryLeadingRows = (
	details: AuditTemplateBuilderValues["details"],
	detailFields: readonly AuditTemplateFieldConfig[],
): AuditTemplateSummaryRow[] => [
	{ label: "Template", value: details.name || "Untitled template" },
	...detailFields.map((config) => ({
		label: config.label,
		value: getFieldOptionLabel(config, details.fields[config.key]) || "--",
	})),
];

const getAttributeLabels = (
	fields: readonly AuditTemplateFieldConfig[],
	parameter: AuditTemplateParameterFormValues,
): string[] =>
	fields
		.map((config) =>
			getFieldOptionLabel(config, parameter.attributes[config.key]),
		)
		.filter(Boolean);

// ── Review variant (wireframe: Create → Review & publish) ─────────────

type ReviewLayoutProps = {
	blocks: readonly PreviewBlock[];
	summary: AuditTemplateSummary;
	leadingRows: readonly AuditTemplateSummaryRow[];
	summaryTitle: string;
};

function AuditTemplateReviewLayout({
	blocks,
	summary,
	leadingRows,
	summaryTitle,
}: ReviewLayoutProps) {
	return (
		<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
			<div className="space-y-3">
				{blocks.map((block) => (
					<Card
						key={block.id}
						variant="outlined"
						padding="none"
						aria-label={block.title}
					>
						<div className="flex items-center gap-2 px-5 py-4">
							<span
								className="h-4 w-[3px] shrink-0 rounded-full bg-(--color-brand)"
								aria-hidden="true"
							/>
							<h3 className="min-w-0 text-base font-semibold text-(--color-text-primary)">
								{block.title}
							</h3>
						</div>

						{block.items.length === 0 ? (
							<p className="border-t border-(--color-border-default) px-5 py-3 text-sm text-(--color-text-secondary)">
								No parameters yet.
							</p>
						) : (
							<ol>
								{block.items.map(({ parameter, label }) => (
									<li
										key={parameter.id}
										className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-(--color-border-default) px-5 py-3 sm:flex-nowrap"
									>
										<span
											className="grid size-8 shrink-0 place-items-center rounded-full bg-(--color-bg-muted) text-xs text-(--color-text-secondary)"
											aria-hidden="true"
										>
											{label}
										</span>

										<div className="min-w-0 flex-1">
											<p className="text-sm font-semibold text-(--color-text-primary)">
												{parameter.title || "Untitled parameter"}
											</p>
											{parameter.guidance ? (
												<p className="line-clamp-2 text-xs text-(--color-text-secondary)">
													{parameter.guidance}
												</p>
											) : null}
										</div>

										<div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
											{parameter.evidenceRequired ? (
												<Badge
													variant="brand"
													text={`Photo ${parameter.minEvidenceCount}–${parameter.maxEvidenceCount}`}
												/>
											) : (
												<Badge variant="outline" text="No photo" />
											)}
											<Badge
												variant="neutral"
												text={parameter.isScored ? "Scored" : "Not scored"}
											/>
										</div>
									</li>
								))}
							</ol>
						)}
					</Card>
				))}
			</div>

			<AuditTemplateSummaryPanel
				summary={summary}
				title={summaryTitle}
				leadingRows={leadingRows}
				note={PUBLISH_NOTE}
				sticky
			/>
		</div>
	);
}

// ── View variant (admin View page: expandable sections + line items) ──

type ViewItemProps = {
	parameter: AuditTemplateParameterFormValues;
	label: string;
	attributeLabels: readonly string[];
	referencePhotoUrl: string | null;
};

function AuditTemplateViewItem({
	parameter,
	label,
	attributeLabels,
	referencePhotoUrl,
}: ViewItemProps) {
	const [open, setOpen] = useState(false);
	const panelId = useId();
	const title = parameter.title || "Untitled parameter";
	const scoreLevels = parameter.isScored
		? sortScoreLevels(parameter.scoreLevels)
		: [];

	return (
		<li className="ui-template-view-item" data-open={open ? "true" : undefined}>
			<button
				type="button"
				className="ui-template-view-row"
				aria-expanded={open}
				aria-controls={panelId}
				onClick={() => setOpen((current) => !current)}
			>
				<span className="ui-template-view-index" aria-hidden="true">
					{label}
				</span>

				<span className="ui-template-view-copy">
					<span className="ui-template-view-title">{title}</span>
					{parameter.guidance ? (
						<span className="ui-template-view-description">
							{parameter.guidance}
						</span>
					) : null}
				</span>

				<span className="ui-template-view-meta">
					{parameter.evidenceRequired ? (
						<Badge
							variant="brand"
							text={`Photo ${parameter.minEvidenceCount}–${parameter.maxEvidenceCount}`}
						/>
					) : (
						<Badge variant="outline" text="No photo" />
					)}
				</span>

				<ChevronRight
					className="ui-template-view-chevron"
					size={18}
					aria-hidden="true"
				/>
			</button>

			<div id={panelId} className="ui-template-view-panel" hidden={!open}>
				<div className="ui-template-view-panel-main">
					{parameter.guidance ? (
						<section>
							<p className="ui-template-view-label">Check point</p>
							<p className="ui-template-view-value whitespace-pre-line">
								{parameter.guidance}
							</p>
						</section>
					) : null}

					<div className="ui-template-view-chips">
						{attributeLabels.map((attributeLabel) => (
							<Badge
								key={attributeLabel}
								variant="neutral"
								text={attributeLabel}
							/>
						))}
						<Badge
							variant={parameter.isScored ? "success" : "neutral"}
							text={
								parameter.isScored
									? `Max ${getParameterMaxScore(parameter)} pts`
									: "Not scored"
							}
						/>
					</div>

					{scoreLevels.length > 0 ? (
						<section>
							<p className="ui-template-view-label">Scoring criteria</p>
							<table className="ui-template-view-table">
								<caption className="sr-only">
									Scoring criteria for {title}
								</caption>
								<thead>
									<tr>
										<th scope="col" className="ui-template-view-table-score">
											Score
										</th>
										<th scope="col">Criteria</th>
									</tr>
								</thead>
								<tbody>
									{scoreLevels.map((level) => (
										<tr key={level.id}>
											<td className="ui-template-view-table-score">
												{level.score}
											</td>
											<td>{level.criteria}</td>
										</tr>
									))}
								</tbody>
							</table>
						</section>
					) : null}

					<section>
						<p className="ui-template-view-label">Photo evidence</p>
						<p className="ui-template-view-value inline-flex items-center gap-1.5">
							<Camera size={14} aria-hidden="true" />
							{parameter.evidenceRequired
								? `Live photo required · min ${parameter.minEvidenceCount}, max ${parameter.maxEvidenceCount}`
								: "Not required"}
						</p>
					</section>
				</div>

				<div className="ui-template-view-panel-photo">
					<p className="ui-template-view-label">Reference photo</p>
					{referencePhotoUrl ? (
						<a
							href={referencePhotoUrl}
							target="_blank"
							rel="noreferrer"
							className="ui-template-view-photo-link"
							aria-label={`Open reference photo for ${title}`}
						>
							<img
								src={referencePhotoUrl}
								alt={`Reference photo for ${title}`}
								loading="lazy"
								className="ui-template-view-photo"
							/>
						</a>
					) : (
						<div className="ui-template-view-photo-empty">
							<ImageOff size={18} aria-hidden="true" />
							<span>No reference photo</span>
						</div>
					)}
				</div>
			</div>
		</li>
	);
}

type ViewLayoutProps = {
	blocks: readonly PreviewBlock[];
	badgeFields: readonly AuditTemplateFieldConfig[];
	summary: AuditTemplateSummary;
	leadingRows: readonly AuditTemplateSummaryRow[];
	summaryTitle: string;
	referencePhotos?: AuditTemplateReferencePhotos;
};

function AuditTemplateViewLayout({
	blocks,
	badgeFields,
	summary,
	leadingRows,
	summaryTitle,
	referencePhotos,
}: ViewLayoutProps) {
	const [query, setQuery] = useState("");
	const search = query.trim().toLowerCase();
	const isSearching = search.length > 0;

	// The card is remounted when a search starts or stops (so matching groups
	// open), which would drop focus from the search box. Put it back.
	const searchRef = useRef<HTMLInputElement>(null);
	const wasSearching = useRef(isSearching);
	useEffect(() => {
		if (wasSearching.current === isSearching) return;
		wasSearching.current = isSearching;
		searchRef.current?.focus();
	}, [isSearching]);

	const totalItems = blocks.reduce((sum, block) => sum + block.items.length, 0);

	// A group whose heading matches keeps all of its items.
	const visibleBlocks = isSearching
		? blocks
				.map((block) => {
					if (block.title.toLowerCase().includes(search)) return block;
					return {
						...block,
						items: block.items.filter(({ parameter }) =>
							[
								parameter.title,
								parameter.guidance,
								...getAttributeLabels(badgeFields, parameter),
							]
								.join(" ")
								.toLowerCase()
								.includes(search),
						),
					};
				})
				.filter((block) => block.items.length > 0)
		: blocks;

	const visibleItems = visibleBlocks.reduce(
		(sum, block) => sum + block.items.length,
		0,
	);

	const sections: CardSection[] = visibleBlocks.map((block, index) => ({
		id: block.id,
		title: block.title,
		subtitle: pluralize(block.items.length, "item"),
		// actions: (
		// 	<ClipboardList
		// 		size={18}
		// 		className="ui-template-view-section-icon"
		// 		aria-hidden="true"
		// 	/>
		// ),
		// First group open by default; every match open while searching.
		defaultExpanded: isSearching || index === 0,
		bodyClassName: "ui-template-view-section-body",
		children: (
			<ol className="ui-template-view-list">
				{block.items.map(({ parameter, label }) => (
					<AuditTemplateViewItem
						key={parameter.id}
						parameter={parameter}
						label={label}
						attributeLabels={getAttributeLabels(badgeFields, parameter)}
						referencePhotoUrl={
							(parameter.serverId && referencePhotos?.[parameter.serverId]) ||
							null
						}
					/>
				))}
			</ol>
		),
	}));

	return (
		<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
			<div className="min-w-0 space-y-3">
				<Card
					// Remount only when a search starts or stops, so matching groups
					// open without remounting the search box on every keystroke.
					key={isSearching ? "searching" : "all"}
					variant="outlined"
					padding="compact"
					title="Checklist items"
					subtitle={
						<span role="status" aria-live="polite">
							{isSearching
								? `${visibleItems} of ${pluralize(totalItems, "item")}`
								: pluralize(totalItems, "item")}
						</span>
					}
					actions={
						<SearchInput
							ref={searchRef}
							value={query}
							onChange={setQuery}
							placeholder="Search items, check points or category…"
							containerClassName="min-w-0 w-full sm:w-72"
						/>
					}
					sections={sections}
					className="ui-template-view-card"
				>
					{/* Shown only when there are no groups to render. */}
					{sections.length === 0 ? (
						<p className="py-6 text-center text-sm text-(--color-text-secondary)">
							{totalItems === 0
								? "No parameters in this template yet."
								: `No items match “${query.trim()}”.`}
						</p>
					) : null}
				</Card>
			</div>

			<AuditTemplateSummaryPanel
				summary={summary}
				title={summaryTitle}
				leadingRows={leadingRows}
				sticky
			/>
		</div>
	);
}

// ── Entry point ───────────────────────────────────────────────────────

export default function AuditTemplatePreview({
	values,
	detailFields,
	parameterFields,
	layout = "sections",
	summaryTitle = "Final summary",
	variant = "detailed",
	referencePhotos,
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

	const leadingRows = getSummaryLeadingRows(details, detailFields);

	// The grouping field is already the card heading in the flat layout.
	const badgeFields = isFlat ? parameterFields.slice(1) : parameterFields;

	if (variant === "review") {
		return (
			<AuditTemplateReviewLayout
				blocks={blocks}
				summary={summary}
				leadingRows={leadingRows}
				summaryTitle={summaryTitle}
			/>
		);
	}

	if (variant === "view") {
		return (
			<AuditTemplateViewLayout
				blocks={blocks}
				badgeFields={badgeFields}
				summary={summary}
				leadingRows={leadingRows}
				summaryTitle={summaryTitle}
				referencePhotos={referencePhotos}
			/>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_300px] ">
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
								const attributeLabels = getAttributeLabels(
									badgeFields,
									parameter,
								);

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
													{sortScoreLevels(parameter.scoreLevels).map(
														(level) => (
															<tr key={level.id}>
																<td className="py-0.5 font-bold text-(--color-text-primary)">
																	{level.score}
																</td>
																<td className="py-0.5 text-(--color-text-primary)">
																	{level.criteria}
																</td>
															</tr>
														),
													)}
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
					title={summaryTitle}
					leadingRows={leadingRows}
					sticky
				/>
			</div>
		</div>
	);
}
