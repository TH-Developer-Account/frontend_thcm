import { z } from "zod";

import { vendorContent } from "../../../content/vendor.content";

const errors = vendorContent.formTwo.errors;

const requiredText = (message: string) => z.string().trim().min(1, message);

/**
 * Every Form Two field is mandatory except vendorCode — this reproduces
 * the legacy `validateMandatoryValues` behavior exactly (it iterated every
 * key of the form values except `NON_MANDATORY_FIELDS = {"vendorCode"}`),
 * NOT just the fields the old JSX happened to mark with a `required`
 * asterisk. paymentTerm, tds, vendorCategory, materialType,
 * materialSubType, vendorSelfAssessmentObtained, gpaObtained,
 * relatedPartyToThcm and vendorAuditReportPrepared were already enforced
 * as mandatory at submit time even though the UI never visually flagged
 * them as required — VendorCreationFormTwo.tsx now adds the missing
 * `required` markers so the form is honest about what it actually
 * enforces, without changing the enforcement itself.
 *
 * vendorCode is intentionally excluded — it's set by the external
 * approver at a later workflow stage (see canEditVendorCode /
 * useVendorCreationSummaryController), not part of THCM's Form Two
 * submission.
 */
export const vendorFormTwoSchema = z.object({
	vendorCode: z.string().trim().optional(),
	vendorType: requiredText(errors.vendorType),
	companyCode: requiredText(errors.companyCode),
	purchaseOrg: requiredText(errors.purchaseOrg),
	paymentTerm: requiredText(errors.paymentTerm),
	tds: requiredText(errors.tds),
	vendorCategory: requiredText(errors.vendorCategory),
	materialType: requiredText(errors.materialType),
	materialSubType: requiredText(errors.materialSubType),
	vendorSelfAssessmentObtained: requiredText(
		errors.vendorSelfAssessmentObtained,
	),
	gpaObtained: requiredText(errors.gpaObtained),
	relatedPartyToThcm: requiredText(errors.relatedPartyToThcm),
	vendorAuditReportPrepared: requiredText(errors.vendorAuditReportPrepared),
	natureOfService: requiredText(errors.natureOfService),
	reasonForOnboarding: requiredText(errors.reasonForOnboarding),
});

export type VendorFormTwoValues = z.infer<typeof vendorFormTwoSchema>;
