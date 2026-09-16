import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import Button from "../../../../components/common/Button";
import TextareaInput from "../../../../components/forms/TextareaInput";
import Checkbox from "../../../../components/forms/Checkbox";
import type { ChecklistTemplateParameter } from "../dealer-audit.types";

type Props = {
	parameter: ChecklistTemplateParameter;
	index: number;
	total: number;
	onChange: (updates: Partial<ChecklistTemplateParameter>) => void;
	onRemove: () => void;
	onMove: (direction: "up" | "down") => void;
};

export default function ChecklistParameterEditor({
	parameter,
	index,
	total,
	onChange,
	onRemove,
	onMove,
}: Props) {
	return (
		<div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
			<div className="flex items-start gap-2.5">
				<GripVertical
					size={16}
					className="mt-2.5 shrink-0 text-slate-400"
					aria-hidden="true"
				/>

				<div className="min-w-0 flex-1 space-y-2.5">
					<input
						value={parameter.title}
						onChange={(event) => onChange({ title: event.target.value })}
						placeholder="Parameter title, e.g. Is signage clearly visible?"
						aria-label={`Parameter ${index + 1} title`}
						className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
					/>

					<TextareaInput
						name={`parameter-${parameter.id}-description`}
						label=""
						value={parameter.description}
						onChange={(event) => onChange({ description: event.target.value })}
						placeholder="Criteria / guidance for the reviewer and dealer"
						rows={2}
					/>

					<label className="flex items-center gap-2 text-xs text-slate-600">
						<Checkbox
							checked={parameter.evidenceRequired}
							onChange={(checked: boolean) =>
								onChange({
									evidenceRequired: checked,
									minEvidenceCount: checked ? 1 : null,
									maxEvidenceCount: checked ? 3 : null,
								})
							}
						/>
						Require photo evidence for this item
					</label>
				</div>

				<div className="flex shrink-0 flex-col items-center gap-1">
					<Button
						appearance="icon"
						variant="transparent"
						size="sm"
						Icon={ChevronUp}
						aria-label="Move item up"
						disabled={index === 0}
						onClick={() => onMove("up")}
					/>
					<Button
						appearance="icon"
						variant="transparent"
						size="sm"
						Icon={ChevronDown}
						aria-label="Move item down"
						disabled={index === total - 1}
						onClick={() => onMove("down")}
					/>
					<Button
						appearance="icon"
						variant="secondary"
						size="sm"
						Icon={Trash2}
						aria-label="Delete item"
						onClick={onRemove}
					/>
				</div>
			</div>

			<p className="mt-2 pl-6 text-[11px] text-slate-400">
				Score is mandatory (0–5) · Remarks always available, optional
			</p>
		</div>
	);
}
