// modules/audit/shared/AuditTemplateSectionCard.tsx
import { Plus, Trash2 } from "lucide-react";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";
import AuditTemplateParameterEditor from "./AuditTemplateParameterEditor";
import { useAuditTemplateBuilder } from "./audit-template-builder.context";
import type { AuditTemplateSection } from "../shared.audit.types";

type Props = {
	section: AuditTemplateSection;
	index: number;
};

export default function AuditTemplateSectionCard({ section, index }: Props) {
	const { updateSection, removeSection, addParameter } =
		useAuditTemplateBuilder();

	return (
		<Card variant="outlined" padding="compact">
			<div className="flex items-center gap-2.5">
				<span className="grid size-7 shrink-0 place-items-center rounded-md bg-slate-900 text-xs font-bold text-white">
					{String(index + 1).padStart(2, "0")}
				</span>
				<input
					value={section.name}
					onChange={(event) =>
						updateSection(section.id, { name: event.target.value })
					}
					placeholder="Section name, e.g. Facility & Brand Standards"
					aria-label={`Section ${index + 1} name`}
					className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-1 text-sm font-semibold text-slate-900 outline-none focus:border-slate-300 focus:bg-white"
				/>
				<Button
					appearance="icon"
					variant="transparent"
					size="sm"
					Icon={Trash2}
					aria-label={`Delete section ${index + 1}`}
					onClick={() => removeSection(section.id)}
				/>
			</div>

			<div className="mt-3 space-y-2.5">
				{section.parameters.map((parameter, parameterIndex) => (
					<AuditTemplateParameterEditor
						key={parameter.id}
						sectionId={section.id}
						parameter={parameter}
						index={parameterIndex}
						total={section.parameters.length}
					/>
				))}
			</div>

			<Button
				text="Add inspection point"
				variant="outline"
				size="sm"
				Icon={Plus}
				className="mt-3 w-full border-dashed"
				onClick={() => addParameter(section.id)}
			/>
		</Card>
	);
}
