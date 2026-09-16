import { Plus } from "lucide-react";
import Button from "../../../../components/common/Button";
import ChecklistTemplateSectionCard from "./ChecklistTemplateSectionCard";
import ChecklistTemplateSummaryPanel from "./ChecklistTemplateSummaryPanel";
import type { ChecklistTemplateSection } from "../dealer-audit.types";
import {
	createEmptySection,
	deriveTemplateSummary,
} from "../dealer-audit.utils";

type Props = {
	sections: ChecklistTemplateSection[];
	onChange: (sections: ChecklistTemplateSection[]) => void;
};

export default function ChecklistTemplateBuildStep({
	sections,
	onChange,
}: Props) {
	const summary = deriveTemplateSummary(sections);

	const updateSection = (
		sectionId: string,
		updates: Partial<ChecklistTemplateSection>,
	) => {
		onChange(
			sections.map((section) =>
				section.id === sectionId ? { ...section, ...updates } : section,
			),
		);
	};

	const removeSection = (sectionId: string) => {
		onChange(sections.filter((section) => section.id !== sectionId));
	};

	const addSection = () => {
		onChange([...sections, createEmptySection(sections.length)]);
	};

	return (
		<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
			<div className="space-y-4">
				{sections.map((section, index) => (
					<ChecklistTemplateSectionCard
						key={section.id}
						section={section}
						index={index}
						onChange={(updates) => updateSection(section.id, updates)}
						onRemove={() => removeSection(section.id)}
					/>
				))}

				<Button
					text="Add another section"
					variant="outline"
					Icon={Plus}
					className="w-full border-dashed"
					onClick={addSection}
				/>
			</div>

			{/* Desktop only — mobile gets a collapsed summary bar instead */}
			<div className="hidden lg:block">
				<ChecklistTemplateSummaryPanel summary={summary} sticky />
			</div>
		</div>
	);
}
