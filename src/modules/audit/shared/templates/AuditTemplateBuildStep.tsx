// modules/audit/shared/AuditTemplateBuildStep.tsx
import { Plus } from "lucide-react";
import Button from "../../../../components/common/Button";
import AuditTemplateSectionCard from "./AuditTemplateSectionCard";
import AuditTemplateSummaryPanel from "./AuditTemplateSummaryPanel";
import { AuditTemplateBuilderProvider } from "./audit-template-builder.context";
import { useAuditTemplateSections } from "./useAuditTemplateSections";
import { deriveTemplateSummary } from "../../dealerAudit/dealer-audit.utils";
import type { ChecklistSection } from "../shared.audit.types";

type Props = {
	sections: ChecklistSection[];
	onChange: (sections: ChecklistSection[]) => void;
};

export default function AuditTemplateBuildStep({ sections, onChange }: Props) {
	// The hook is the single source of truth for editing; `sections`/`onChange`
	// keep the parent step (Details/Build/Review) in sync without every card
	// or editor needing to know that sync exists.
	const builder = useAuditTemplateSections(sections);

	if (builder.sections !== sections) {
		onChange(builder.sections);
	}

	const summary = deriveTemplateSummary(builder.sections);

	return (
		<AuditTemplateBuilderProvider
			value={{
				sections: builder.sections,
				updateSection: builder.updateSection,
				removeSection: builder.removeSection,
				addSection: builder.addSection,
				updateParameter: builder.updateParameter,
				removeParameter: builder.removeParameter,
				addParameter: builder.addParameter,
				moveParameter: builder.moveParameter,
			}}
		>
			<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
				<div className="space-y-4">
					{builder.sections.map((section, index) => (
						<AuditTemplateSectionCard
							key={section.id}
							section={section}
							index={index}
						/>
					))}

					<Button
						text="Add another section"
						variant="outline"
						Icon={Plus}
						className="w-full border-dashed"
						onClick={builder.addSection}
					/>
				</div>

				<div className="hidden lg:block">
					<AuditTemplateSummaryPanel summary={summary} sticky />
				</div>
			</div>
		</AuditTemplateBuilderProvider>
	);
}
