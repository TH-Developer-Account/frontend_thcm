// utils/cpp.schema.ts — zod rules for SUBMIT. "Save draft" skips validation.
import { z } from "zod";

import {
	AMORTISED_CONDITION,
	CPP_PLANTS,
	MIN_JUSTIFICATION,
	sumPlantSplit,
	toNum,
} from "./cpp.utils";

const required = (message: string) => z.string().trim().min(1, message);
const rate = (message: string) =>
	z.string().refine((value) => toNum(value) !== null, message);

const supplier = z.object({
	partnerId: z.string(),
	name: z.string(),
	code: z.string(),
	manual: z.boolean(),
});

const requiredSupplier = supplier.extend({
	name: required("Supplier name is required"),
});

const part = z.object({
	partNo: required("Required"),
	description: required("Required"),
	uom: required("Required"),
	existingRate: rate("Required"),
	existingWef: z.string(),
	quotedRate: rate("Required"),
	quotedWef: z.string(),
	finalRate: rate("Required"),
	finalWef: z.string(),
	qtyReceived: z.string(),
	qtyRemaining: z.string(),
	qtyAnnual: z.string(),
});

const amortRow = z.object({
	partNo: z.string(),
	amount: z.string(),
	qty: z.string(),
	perMachineQty: z.string(),
});

export const cppSchema = z
	.object({
		materialType: z.enum(["", "Direct", "Indirect"]),
		reason: required("Select a reason"),
		effects: z.array(z.enum(["Quality", "Cost", "Delivery"])),
		aribaRef: z.string(),
		initiationDate: z.string(),
		suppliers: z.object({
			existing: requiredSupplier,
			other: supplier,
			recommended: requiredSupplier,
		}),
		parts: z.array(part).min(1, "Add at least one part"),
		amortisation: z.array(amortRow),
		other: z.object({
			remarks: z.string(),
			attachments: z.record(z.string(), z.boolean()),
		}),
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
		financial: z.object({
			noChange: z.boolean(),
			plantSplit: z.object({ DWD: z.string(), KGP: z.string(), SPARE: z.string() }),
		}),
		workflow: z.object({
			models: z.array(z.string()).min(1, "Select at least one model"),
			plants: z.array(z.enum(["DWD", "KGP", "SPARE"])),
			pricingCondition: required("Select a pricing condition"),
			spares: z.boolean(),
			authority: required("Select the approving authority"),
		}),
		justification: z
			.string()
			.trim()
			.min(MIN_JUSTIFICATION, `Enter at least ${MIN_JUSTIFICATION} characters`),
	})
	.superRefine((values, ctx) => {
		if (!values.materialType) {
			ctx.addIssue({
				code: "custom",
				path: ["materialType"],
				message: "Select Direct or Indirect",
			});
		}

		// Amortisation rows are only mandatory for an amortised price.
		if (values.workflow.pricingCondition === AMORTISED_CONDITION) {
			values.amortisation.forEach((row, index) => {
				(["partNo", "amount", "qty"] as const).forEach((key) => {
					const ok = key === "partNo" ? row.partNo.trim() : toNum(row[key]) !== null;
					if (!ok) {
						ctx.addIssue({
							code: "custom",
							path: ["amortisation", index, key],
							message: "Required",
						});
					}
				});
			});
		}

		// Plant split must add up to 100% once the user starts using it.
		const split = values.financial.plantSplit;
		const used = CPP_PLANTS.some((plant) => split[plant].trim() !== "");
		if (used && Math.abs(sumPlantSplit(split) - 100) > 0.01) {
			ctx.addIssue({
				code: "custom",
				path: ["financial", "plantSplit"],
				message: "Plant split must add up to 100%",
			});
		}
	});

export type CppSchemaValues = z.infer<typeof cppSchema>;
