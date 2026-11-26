import Card from "../../../../components/common/Card";
import AuditTemplateSummaryPanel from "./AuditTemplateSummaryPanel";

import { deriveTemplateSummary } from "../../dealerAudit/dealer-audit.utils";
import type { AuditTemplateDetailsValues } from "./AuditTemplateDetailsStep";
import type { AuditTemplateSection } from "../shared.audit.types";

type Props = {
	details: AuditTemplateDetailsValues;
	sections: AuditTemplateSection[];
};

export default function AuditTemplateReviewStep({ details, sections }: Props) {
	const summary = deriveTemplateSummary(sections);

	return (
		<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
			<Card variant="outlined" padding="default">
				<h2 className="text-base font-semibold text-slate-900">
					{details.name || "Untitled AuditTemplate"}
				</h2>
				<p className="mt-1 text-sm text-slate-500">{details.description}</p>

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
				<AuditTemplateSummaryPanel
					summary={summary}
					sticky
					title="Final summary"
				/>
			</div>
		</div>
	);
}
