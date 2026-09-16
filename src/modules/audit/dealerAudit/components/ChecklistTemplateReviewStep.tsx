import Card from "../../../../components/common/Card";
import ChecklistTemplateSummaryPanel from "./ChecklistTemplateSummaryPanel";
import type {
	ChecklistTemplateFormValues,
	ChecklistTemplateSection,
} from "../dealer-audit.types";
import { deriveTemplateSummary } from "../dealer-audit.utils";

type Props = {
	details: ChecklistTemplateFormValues;
	sections: ChecklistTemplateSection[];
};

export default function ChecklistTemplateReviewStep({
	details,
	sections,
}: Props) {
	const summary = deriveTemplateSummary(sections);

	return (
		<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
			<Card variant="outlined" padding="default">
				<h2 className="text-base font-semibold text-slate-900">
					{details.name || "Untitled checklist"}
				</h2>
				<p className="mt-1 text-sm text-slate-500">{details.description}</p>
				<p className="mt-1 text-xs font-medium text-(--color-brand)">
					{details.auditCategory}
				</p>

				<div className="mt-5 space-y-4">
					{sections.map((section, index) => (
						<div key={section.id}>
							<h3 className="text-sm font-semibold text-slate-900">
								{index + 1}. {section.name || "Untitled section"}
							</h3>
							<ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-slate-600">
								{section.parameters.map((parameter) => (
									<li key={parameter.id}>
										{parameter.title || "Untitled item"}
										{parameter.evidenceRequired ? " · photo required" : ""}
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</Card>

			<div className="hidden lg:block">
				<ChecklistTemplateSummaryPanel
					summary={summary}
					sticky
					title="Final summary"
				/>
			</div>
		</div>
	);
}
