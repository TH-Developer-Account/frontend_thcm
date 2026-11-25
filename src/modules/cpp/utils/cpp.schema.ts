// utils/cpp.schema.ts — every rule a CPP request must meet before SUBMIT.
// "Save draft" skips validation.
//
// Why one plain function instead of a zod object + superRefine:
// zod runs superRefine only when the whole base object already parses. So one
// blank field in a LATER step hid every cross-field check (part value, summary
// sheet, plant rows…) of the step being checked, and "Next" let the user through.
// collectCppIssues() always returns every problem, so "Next" (form.trigger on the
// step's paths) and "Submit" see the same, complete list.
import { z } from "zod";

import type { CppFormValues } from "../types/cpp.types";
import {
	AMORTISED_CONDITION,
	CPP_CHECKLIST,
	MIN_JUSTIFICATION,
	getCondition,
	getLocationGroup,
	isBlankRow,
	isConditionAllowed,
	isLocationApplicable,
	isNumberText,
	toNum,
} from "./cpp.utils";

/** A document must be attached when a check list row is answered "Yes". */
export const CHECKLIST_DOC_REQUIRED_ON_YES = true;

/** ME11 needs the recommended supplier's vendor code. */
export const RECOMMENDED_CODE_REQUIRED = true;

export type CppIssue = { path: (string | number)[]; message: string };

const blank = (value: unknown) => String(value ?? "").trim() === "";

const positive = (value: string) => {
	const parsed = toNum(value);
	return parsed !== null && isNumberText(value) && parsed > 0;
};

const optionalNumberOk = (value: unknown) =>
	blank(value) || isNumberText(String(value));

export const collectCppIssues = (values: CppFormValues): CppIssue[] => {
	const issues: CppIssue[] = [];
	const add = (path: CppIssue["path"], message: string) =>
		issues.push({ path, message });

	/* ------------------------------ basic details ----------------------------- */
	if (blank(values.category)) add(["category"], "Select a category");
	if (blank(values.plant)) add(["plant"], "Select a plant");
	if (blank(values.condition)) add(["condition"], "Select a condition");
	else if (
		!blank(values.category) &&
		!isConditionAllowed(values.condition, values.category)
	)
		add(["condition"], "This condition does not apply to the selected category");
	if (!values.materialType) add(["materialType"], "Select Direct or Indirect");
	if (blank(values.reason)) add(["reason"], "Select a reason");
	if (blank(values.priceType)) add(["priceType"], "Select a price type");
	if ((values.workflow?.models ?? []).length === 0)
		add(["workflow", "models"], "Select at least one model");
	if (blank(values.workflow?.pricingCondition))
		add(["workflow", "pricingCondition"], "Select a pricing condition");
	if (String(values.justification ?? "").trim().length < MIN_JUSTIFICATION)
		add(["justification"], `Enter at least ${MIN_JUSTIFICATION} characters`);

	/* ---------------------------- purchasing details -------------------------- */
	if (blank(values.suppliers?.existing?.name))
		add(["suppliers", "existing", "name"], "Supplier name is required");
	if (blank(values.suppliers?.recommended?.name))
		add(["suppliers", "recommended", "name"], "Supplier name is required");
	if (RECOMMENDED_CODE_REQUIRED && blank(values.suppliers?.recommended?.code))
		add(["suppliers", "recommended", "code"], "Vendor code is required");

	if (!values.attachments?.partSummary)
		add(["attachments", "partSummary"], "Upload the summary sheet (part info)");

	const condition = getCondition(values.condition);
	if (condition) {
		const approval = values.approvalValues;
		const hasParts = (values.summaryParts ?? []).length > 0;
		const message = "Enter a value greater than 0";

		if (condition.partBasis === "PART_VALUE") {
			if (hasParts && blank(approval.partValuePart))
				add(["approvalValues", "partValuePart"], "Select the part");
			else if (!positive(approval.partValue))
				add(["approvalValues", "partValue"], message);
		}
		if (condition.partBasis === "VARIATION_PCT" && !positive(approval.variationPct))
			add(["approvalValues", "variationPct"], message);

		if (hasParts && blank(approval.amountPart))
			add(["approvalValues", "amountPart"], "Select the part");
		else if (!positive(approval.amount))
			add(["approvalValues", "amount"], message);
	}

	/* ------------------------- amortisation (PB50 only) ----------------------- */
	if (values.workflow?.pricingCondition === AMORTISED_CONDITION) {
		const rows = values.amortisation ?? [];
		const noneFilled = rows.every(isBlankRow);
		rows.forEach((row, index) => {
			if (isBlankRow(row) && !(noneFilled && index === 0)) return;
			const at = (field: keyof typeof row, text: string) =>
				add(["amortisation", index, field], text);
			if (blank(row.partNo)) at("partNo", "Enter the part number");
			if (!positive(row.priceInclAmort))
				at("priceInclAmort", "Enter a price greater than 0");
			if (blank(row.cutoffDate)) at("cutoffDate", "Enter the cut-off date");
			if (!positive(row.amortQty)) at("amortQty", "Enter a quantity greater than 0");
			if (blank(row.priceAfterAmort) || !isNumberText(row.priceAfterAmort))
				at("priceAfterAmort", "Enter the price after amortisation");
			else if (
				positive(row.priceInclAmort) &&
				(toNum(row.priceAfterAmort) ?? 0) >= (toNum(row.priceInclAmort) ?? 0)
			)
				at("priceAfterAmort", "Must be lower than the price incl. amortisation");
		});
	}

	/* ------------------- volumes & impact (optional, numbers only) ------------ */
	for (const plant of ["DWD", "KGP", "SPARE"] as const) {
		const row = values.volumes?.[plant];
		for (const field of ["received", "remaining", "annual"] as const)
			if (row && !optionalNumberOk(row[field]))
				add(["volumes", plant, field], "Enter a number");
	}
	(values.perMachineImpact ?? []).forEach((row, index) => {
		for (const field of ["withAmort", "withoutAmort"] as const)
			if (!optionalNumberOk(row[field]))
				add(["perMachineImpact", index, field], "Enter a number");
	});
	(values.costTracker ?? []).forEach((row, index) => {
		for (const field of [
			"perMachineImpact",
			"budgetedIncrease",
			"statusYtd",
			"budgetedMaterialCost",
			"materialCostYtd",
		] as const)
			if (!optionalNumberOk(row[field]))
				add(["costTracker", index, field], "Enter a number");
	});

	/* ------------------------------- master data ------------------------------ */
	const group = getLocationGroup(values.plant);
	if (group) {
		const inGroup = (values.masterData?.plantDetails ?? [])
			.map((row, index) => ({ row, index }))
			.filter(({ row }) => row.group === group);
		const applicable = inGroup.filter(({ row }) =>
			isLocationApplicable(row, values.plant),
		);
		if (applicable.length === 0 && inGroup[0])
			add(
				["masterData", "plantDetails", inGroup[0].index, "applicable"],
				group === "SPARE"
					? "Select at least one warehouse"
					: "Select at least one plant",
			);
		applicable.forEach(({ row, index }) => {
			if (blank(row.purchasingGroup))
				add(
					["masterData", "plantDetails", index, "purchasingGroup"],
					"Enter the purchasing group",
				);
			if (blank(row.taxCode))
				add(["masterData", "plantDetails", index, "taxCode"], "Select the tax code");
			if (!optionalNumberOk(row.pfPct))
				add(["masterData", "plantDetails", index, "pfPct"], "Enter a number");
		});
	}

	/* -------------------------------- other data ------------------------------ */
	(values.other?.plantPrices ?? []).forEach((row, index) => {
		if (!optionalNumberOk(row.price))
			add(["other", "plantPrices", index, "price"], "Enter a number");
	});

	/* ------------------------ attachments: check list ------------------------- */
	for (const item of CPP_CHECKLIST) {
		const answer = values.other?.checklist?.[item.key] ?? "";
		if (!answer) add(["other", "checklist", item.key], "Choose Yes, No or NA");
		else if (
			CHECKLIST_DOC_REQUIRED_ON_YES &&
			answer === "Yes" &&
			!values.attachments?.[item.key]
		)
			add(["attachments", item.key], "Attach the document for this item");
	}

	return issues;
};

/**
 * zodResolver wrapper: no shape checks (the form owns the shape), every rule in
 * collectCppIssues. The parsed value is the form values unchanged.
 */
export const cppSchema = z
	.custom<CppFormValues>(() => true)
	.superRefine((values, ctx) => {
		for (const issue of collectCppIssues(values))
			ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
	});

export type CppSchemaValues = CppFormValues;
