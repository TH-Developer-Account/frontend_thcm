// modules/audit/shared/AuditTemplateDetailsStep.tsx
import Card from "../../../../components/common/Card";
import TextareaInput from "../../../../components/forms/TextareaInput";
import type { AuditModuleKey } from "../shared.audit.types";

export interface AuditTemplateDetailsValues {
	name: string;
	description: string;
	facilityType?: string;
}

type Props = {
	values: AuditTemplateDetailsValues;
	onChange: (values: AuditTemplateDetailsValues) => void;
	/** Each module supplies its own facility-type options — not hardcoded here. */
	facilityTypeOptions: Array<{ value: string; label: string }>;
	auditModule: AuditModuleKey;
};

export default function AuditTemplateDetailsStep({
	values,
	onChange,
	facilityTypeOptions,
}: Props) {
	return (
		<Card variant="outlined" padding="default">
			<h2 className="text-base font-semibold text-slate-900">
				Audit Template details
			</h2>
			<p className="mt-1 text-sm text-slate-500">
				Give reviewers enough context to choose the right template.
			</p>

			<div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label className="mb-1.5 block text-sm font-semibold text-slate-900">
						Audit Template name <span className="text-(--color-brand)">*</span>
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
						Facility type
					</label>
					<select
						value={values.facilityType ?? ""}
						onChange={(event) =>
							onChange({ ...values, facilityType: event.target.value })
						}
						className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-(--color-brand) focus:ring-2 focus:ring-(--color-brand)/15"
					>
						<option value="">Applies to all facility types</option>
						{facilityTypeOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
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
						placeholder="What this AuditTemplate evaluates and where it applies."
						rows={3}
					/>
				</div>
			</div>
		</Card>
	);
}
