// forms/EPC/epc.schema.ts
// Zod schema for the EPC form.
//
// Public API is unchanged: `validateEpcForm(values)` still returns a flat
// `{ [field]: message }` object and `EpcFormErrors` keeps its shape, so
// useEpcForm / EpcFormFields need no changes. The schema itself is also
// exported (`epcFormSchema`) so other features can reuse it.
import { z } from "zod";

import type { EpcFormValues } from "../../types/epc.types";

export type EpcFormErrors = Partial<Record<keyof EpcFormValues, string>>;

/**
 * Required text field. null / undefined are treated as "" so the user always
 * sees our message instead of Zod's generic "Expected string" error, and
 * whitespace-only input counts as empty.
 */
const requiredText = (message: string) =>
	z.preprocess((v) => v ?? "", z.string().trim().min(1, message));

/** API-style date (YYYY-MM-DD). Anything else is left for the payload builder. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

export const epcFormSchema = z
	.object({
		// Organisation
		department: requiredText("Department is required"),
		region: requiredText("Region is required"),
		branch: requiredText("Branch is required"),
		vertical: requiredText("Vertical is required"),

		// Budget — the field is marked required in the UI
		budget_master_id: requiredText("Budget is required"),

		// Event
		event_name: requiredText("Event name is required"),
		event_from_date: requiredText("From date is required"),
		event_to_date: requiredText("To date is required"),
		location: requiredText("Location is required"),

		event_scale: z.preprocess(
			(v) => (v === "" || v == null ? 0 : Number(v)),
			z
				.number()
				.refine((n) => Number.isFinite(n) && n >= 0, "Event scale is invalid"),
		),
	})
	.superRefine((data, ctx) => {
		// "To" must not be before "From". Only compared when both are in ISO
		// form (the date picker always emits ISO), so legacy formats never
		// produce a false error here.
		const { event_from_date: from, event_to_date: to } = data;
		if (
			ISO_DATE.test(from) &&
			ISO_DATE.test(to) &&
			to.slice(0, 10) < from.slice(0, 10)
		) {
			ctx.addIssue({
				code: "custom",
				path: ["event_to_date"],
				message: "To date cannot be before From date",
			});
		}
	});

/**
 * Validates the form and returns one message per field (first issue wins).
 * Empty object = valid.
 */
export const validateEpcForm = (values: EpcFormValues): EpcFormErrors => {
	const result = epcFormSchema.safeParse(values);
	if (result.success) return {};

	const errors: EpcFormErrors = {};
	for (const issue of result.error.issues) {
		const field = issue.path[0] as keyof EpcFormValues | undefined;
		if (field && !errors[field]) errors[field] = issue.message;
	}
	return errors;
};
