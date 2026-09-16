import Card from "../../../../components/common/Card";
import TextareaInput from "../../../../components/forms/TextareaInput";
import type { ChecklistTemplateFormValues } from "../dealer-audit.types";

type Props = {
	values: ChecklistTemplateFormValues;
	onChange: (values: ChecklistTemplateFormValues) => void;
};

export default function ChecklistTemplateDetailsStep({
	values,
	onChange,
}: Props) {
	return (
		<Card variant="outlined" padding="default">
			<h2 className="text-base font-semibold text-slate-900">
				Checklist details
			</h2>
			<p className="mt-1 text-sm text-slate-500">
				Give reviewers enough context to choose the right template.
			</p>

			<div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label className="mb-1.5 block text-sm font-semibold text-slate-900">
						Checklist name <span className="text-(--color-brand)">*</span>
					</label>
					<input
						value={values.name}
						onChange={(event) =>
							onChange({ ...values, name: event.target.value })
						}
						placeholder="e.g. Dealer Facility Audit — 2026"
						className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-(--color-brand) focus:ring-2 focus:ring-(--color-brand)/15"
					/>
				</div>

				<div>
					<label className="mb-1.5 block text-sm font-semibold text-slate-900">
						Audit category <span className="text-(--color-brand)">*</span>
					</label>
					<select
						value={values.auditCategory}
						onChange={(event) =>
							onChange({ ...values, auditCategory: event.target.value })
						}
						className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-(--color-brand) focus:ring-2 focus:ring-(--color-brand)/15"
					>
						<option>Dealer audit</option>
						<option>Factory audit</option>
					</select>
				</div>

				<div className="sm:col-span-2">
					<TextareaInput
						name="template-description"
						label="Description"
						value={values.description}
						onChange={(event) =>
							onChange({ ...values, description: event.target.value })
						}
						placeholder="Evaluate the dealer facility, safety practices and customer-facing infrastructure."
						rows={3}
					/>
				</div>
			</div>
		</Card>
	);
}
