// utils/cpp.schema.ts — zod rules for SUBMIT. "Save draft" skips validation.
// The wizard also runs this schema per step (form.trigger on that step's fields).
import { z } from "zod";

import {
	AMORTISED_CONDITION,
	MIN_JUSTIFICATION,
	getCondition,
	getLocationGroup,
	isBlankRow,
	isConditionAllowed,
	isLocationApplicable,
	isNumberText,
	toNum,
} from "./cpp.utils";

const required = (message: string) => z.string().trim().min(1, message);

/** Optional number: blank is fine, anything typed must be a number. */
const optionalNumber = z
	.string()
	.refine(
		(value) => value.trim() === "" || isNumberText(value),
		"Enter a number",
	);

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
	return parsed !== null && isNumberText(value) && parsed > 0;
};

const locationRow = z.object({
	code: z.string(),
	name: z.string(),
	group: z.enum(["PLANT", "SPARE"]),
	applicable: z.boolean(),
	incoTerms: z.string(),
	purchasingGroup: z.string(),
	taxCode: z.string(),
	storeLocation: z.string(),
	pfPct: optionalNumber,
});

// Amortisation cells are checked in superRefine — only when PB50 is picked.
const amortRow = z.object({
	partNo: z.string(),
	priceInclAmort: z.string(),
	cutoffDate: z.string(),
	amortQty: z.string(),
	priceAfterAmort: z.string(),
});

const volumeRow = z.object({
	received: optionalNumber,
	remaining: optionalNumber,
	annual: optionalNumber,
});

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

		/* amortisation (PB50 only) */
		amortisation: z.array(amortRow),

		/* volumes & impact — every table is optional */
		volumes: z.object({ DWD: volumeRow, KGP: volumeRow, SPARE: volumeRow }),
		perMachineImpact: z.array(
			z.object({
				plant: z.string(),
				model: z.string(),
				withAmort: optionalNumber,
				withoutAmort: optionalNumber,
			}),
		),
		costTracker: z.array(
			z.object({
				model: z.string(),
				perMachineImpact: optionalNumber,
				budgetedIncrease: optionalNumber,
				statusYtd: optionalNumber,
				budgetedMaterialCost: optionalNumber,
				materialCostYtd: optionalNumber,
			}),
		),

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
			plantDetails: z.array(locationRow),
		}),

		/* not rendered in the wizard — kept so older tabs still type-check */
		parts: z.array(z.any()),
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

		/* ---- amortisation: required only for PB50 ----
		 * Every filled row is checked. If no row is filled, the first row is
		 * checked, so its cells go red and the step shows "add at least one part". */
		if (values.workflow.pricingCondition === AMORTISED_CONDITION) {
			const noneFilled = values.amortisation.every(isBlankRow);
			values.amortisation.forEach((row, index) => {
				if (isBlankRow(row) && !(noneFilled && index === 0)) return;
				const at = (field: keyof typeof row, message: string) =>
					ctx.addIssue({
						code: "custom",
						path: ["amortisation", index, field],
						message,
					});
				if (!row.partNo.trim()) at("partNo", "Enter the part number");
				if (!positive(row.priceInclAmort))
					at("priceInclAmort", "Enter a price greater than 0");
				if (!positive(row.amortQty))
					at("amortQty", "Enter a quantity greater than 0");
				if (!row.priceAfterAmort.trim() || !isNumberText(row.priceAfterAmort))
					at("priceAfterAmort", "Enter the price after amortisation");
				else if (
					positive(row.priceInclAmort) &&
					(toNum(row.priceAfterAmort) ?? 0) >= (toNum(row.priceInclAmort) ?? 0)
				)
					at(
						"priceAfterAmort",
						"Must be lower than the price incl. amortisation",
					);
			});
		}

		/* ---- plant / spares details: purchasing group is needed for the TCS files ---- */
		const group = getLocationGroup(values.plant);
		if (group) {
			const rows = values.masterData.plantDetails;
			const inGroup = rows
				.map((row, index) => ({ row, index }))
				.filter(({ row }) => row.group === group);
			const applicable = inGroup.filter(({ row }) =>
				isLocationApplicable(row, values.plant),
			);
			if (applicable.length === 0 && inGroup[0]) {
				ctx.addIssue({
					code: "custom",
					path: ["masterData", "plantDetails", inGroup[0].index, "applicable"],
					message:
						group === "SPARE"
							? "Select at least one warehouse"
							: "Select at least one plant",
				});
			}
			applicable.forEach(({ row, index }) => {
				if (!row.purchasingGroup.trim())
					ctx.addIssue({
						code: "custom",
						path: ["masterData", "plantDetails", index, "purchasingGroup"],
						message: "Enter the purchasing group",
					});
			});
		}
	});

export type CppSchemaValues = z.infer<typeof cppSchema>;
