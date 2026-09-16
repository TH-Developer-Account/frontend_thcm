import { Plus, Trash2 } from "lucide-react";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";
import ChecklistParameterEditor from "./ChecklistParameterEditor";
import type {
	ChecklistTemplateParameter,
	ChecklistTemplateSection,
} from "../dealer-audit.types";
import { createEmptyParameter, reorderList } from "../dealer-audit.utils";

type Props = {
	section: ChecklistTemplateSection;
	index: number;
	onChange: (updates: Partial<ChecklistTemplateSection>) => void;
	onRemove: () => void;
};

export default function ChecklistTemplateSectionCard({
	section,
	index,
	onChange,
	onRemove,
}: Props) {
	const updateParameter = (
		parameterId: string,
		updates: Partial<ChecklistTemplateParameter>,
	) => {
		onChange({
			parameters: section.parameters.map((parameter) =>
				parameter.id === parameterId ? { ...parameter, ...updates } : parameter,
			),
		});
	};

	const removeParameter = (parameterId: string) => {
		onChange({
			parameters: section.parameters.filter(
				(parameter) => parameter.id !== parameterId,
			),
		});
	};

	const moveParameter = (parameterIndex: number, direction: "up" | "down") => {
		onChange({
			parameters: reorderList(section.parameters, parameterIndex, direction),
		});
	};

	const addParameter = () => {
		onChange({
			parameters: [
				...section.parameters,
				createEmptyParameter(section.parameters.length),
			],
		});
	};

	return (
		<Card variant="outlined" padding="compact">
			<div className="flex items-center gap-2.5">
				<span className="grid size-7 shrink-0 place-items-center rounded-md bg-slate-900 text-xs font-bold text-white">
					{String(index + 1).padStart(2, "0")}
				</span>
				<input
					value={section.name}
					onChange={(event) => onChange({ name: event.target.value })}
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
					onClick={onRemove}
				/>
			</div>

			<div className="mt-3 space-y-2.5">
				{section.parameters.map((parameter, parameterIndex) => (
					<ChecklistParameterEditor
						key={parameter.id}
						parameter={parameter}
						index={parameterIndex}
						total={section.parameters.length}
						onChange={(updates) => updateParameter(parameter.id, updates)}
						onRemove={() => removeParameter(parameter.id)}
						onMove={(direction) => moveParameter(parameterIndex, direction)}
					/>
				))}
			</div>

			<Button
				text="Add inspection point"
				variant="outline"
				size="sm"
				Icon={Plus}
				className="mt-3 w-full border-dashed"
				onClick={addParameter}
			/>
		</Card>
	);
}
