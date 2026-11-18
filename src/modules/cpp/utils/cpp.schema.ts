// utils/cpp.schema.ts — zod rules for SUBMIT. "Save draft" skips validation.
// The wizard also runs this schema per step (form.trigger on that step's fields).
import { z } from "zod";

import {
	MIN_JUSTIFICATION,
	getCondition,
	isConditionAllowed,
	toNum,
} from "./cpp.utils";

const required = (message: string) => z.string().trim().min(1, message);

const supplier = z.object({
	partnerId: z.string(),
	name: z.string(),
	code: z.string(),
	manual: z.boolean(),
});

const requiredSupplier = supplier.extend({
	name: required("Supplier name is required"),
});

const positive = (value: string) => {
	const parsed = toNum(value);
	return parsed !== null && parsed > 0;
};

export const cppSchema = z
	.object({
		/* step 1 */
		category: required("Select a category"),
		plant: required("Select a plant"),
		condition: required("Select a condition"),
		materialType: z.enum(["", "Direct", "Indirect"]),
		effects: z.array(z.enum(["Quality", "Cost", "Delivery"])),
		reason: required("Select a reason"),
		priceType: required("Select a price type"),
		justification: z
			.string()
			.trim()
			.min(MIN_JUSTIFICATION, `Enter at least ${MIN_JUSTIFICATION} characters`),
		initiationDate: z.string(),
		workflow: z.object({
			models: z.array(z.string()).min(1, "Select at least one model"),
			plants: z.array(z.enum(["DWD", "KGP", "SPARE"])),
			pricingCondition: required("Select a pricing condition"),
			spares: z.boolean(),
			authority: z.string(),
		}),

		/* step 2 */
		suppliers: z.object({
			existing: requiredSupplier,
			other: supplier,
			recommended: requiredSupplier,
		}),
		// The attached Excel — checked in superRefine below.
		purchasingFile: z.any(),
		approvalValues: z.object({
			partValue: z.string(),
			variationPct: z.string(),
			amount: z.string(),
		}),

		/* remaining steps */
		other: z.object({
			remarks: z.string(),
		}),
		// Optional per document; which ones are needed depends on the condition.
		attachments: z.record(z.string(), z.any()),
		masterData: z.object({
			materialGroup: z.string(),
			materialType: z.string(),
			purchasingGroup: z.string(),
			priceType: z.string(),
			incoTerms: z.string(),
			taxCode: z.string(),
			storeLocation: z.string(),
			validFrom: z.string(),
			updateSourceList: z.string(),
			plants: z.array(z.enum(["DWD", "KGP", "SPARE"])),
			note: z.string(),
		}),

		/* not rendered in the wizard — kept so older tabs still type-check */
		parts: z.array(z.any()),
		amortisation: z.array(z.any()),
		financial: z.object({
			noChange: z.boolean(),
			plantSplit: z.object({
				DWD: z.string(),
				KGP: z.string(),
				SPARE: z.string(),
			}),
		}),
	})
	.superRefine((values, ctx) => {
		if (!values.materialType) {
			ctx.addIssue({
				code: "custom",
				path: ["materialType"],
				message: "Select Direct or Indirect",
			});
		}

		const condition = getCondition(values.condition);
		if (
			condition &&
			values.category &&
			!isConditionAllowed(values.condition, values.category)
		) {
			ctx.addIssue({
				code: "custom",
				path: ["condition"],
				message: "This condition does not apply to the selected category",
			});
		}

		if (!values.purchasingFile) {
			ctx.addIssue({
				code: "custom",
				path: ["purchasingFile"],
				message: "Attach the purchasing details Excel",
			});
		}

		// Approval bands need real numbers. Zero / blank is blocked (open question Q9).
		if (condition) {
			const { partValue, variationPct, amount } = values.approvalValues;
			const message = "Enter a value greater than 0";
			if (condition.partBasis === "PART_VALUE" && !positive(partValue)) {
				ctx.addIssue({
					code: "custom",
					path: ["approvalValues", "partValue"],
					message,
				});
			}
			if (condition.partBasis === "VARIATION_PCT" && !positive(variationPct)) {
				ctx.addIssue({
					code: "custom",
					path: ["approvalValues", "variationPct"],
					message,
				});
			}
			if (!positive(amount)) {
				ctx.addIssue({
					code: "custom",
					path: ["approvalValues", "amount"],
					message,
				});
			}
		}
	});

export type CppSchemaValues = z.infer<typeof cppSchema>;
