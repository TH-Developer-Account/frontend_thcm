import { z } from "zod";

import { vendorContent } from "../../../content/vendor.content";
import {
	ACCOUNT_NUMBER_REGEX,
	EMAIL_REGEX,
	GSTIN_REGEX,
	IFSC_REGEX,
	MOBILE_REGEX,
	PAN_REGEX,
	PIN_CODE_REGEX,
	getAccountNumberConfirmState,
	getGstinPanMatchStatus,
} from "../helpers/vendor.onboarding.validations";

const errors = vendorContent.formOne.errors;

const requiredText = (message: string) => z.string().trim().min(1, message);

/**
 * Form One's schema is a factory, not a static object, because whether
 * `confirmAccountNumber` is required depends on `originalAccountNumber` —
 * runtime state (what's already saved for this vendor) the schema has no
 * other way to see. This mirrors `buildResetPasswordSchema(requiresOldPassword)`
 * in src/schemas/authForms.schema.ts, the existing precedent for a
 * schema-factory parameterized by a caller-supplied flag.
 *
 * `originalAccountNumber` should be "" for a brand-new record — that's what
 * makes confirmAccountNumber required for every first-time submission.
 */
export const buildVendorFormOneSchema = (originalAccountNumber: string) =>
	z
		.object({
			vendorName: requiredText(errors.vendorName),
			vendorReferenceName: z.string().trim().optional(),
			address: requiredText(errors.address),
			// "Yes" | "No" — set by the enclosure-upload controller, not typed
			// by the vendor. Not schema-validated; see isEnclosureRequired /
			// getMissingDocuments for the actual document-conditional rules.
			msmeVendor: requiredText(errors.msmeVendor),
			msmeCertificateAttached: z.string().optional(),
			city: requiredText(errors.city),
			pinCode: requiredText(errors.pinCode).regex(
				PIN_CODE_REGEX,
				errors.pinCodeFormat,
			),
			state: requiredText(errors.state),
			mobile: requiredText(errors.mobile).regex(
				MOBILE_REGEX,
				errors.mobileFormat,
			),
			email: requiredText(errors.email).regex(
				EMAIL_REGEX,
				errors.emailFormat,
			),
			bankName: requiredText(errors.bankName),
			bankBranch: requiredText(errors.bankBranch),
			ifscCode: requiredText(errors.ifscCode).regex(
				IFSC_REGEX,
				errors.ifscFormat,
			),
			bankAddress: requiredText(errors.bankAddress),
			accountNumber: requiredText(errors.accountNumber).regex(
				ACCOUNT_NUMBER_REGEX,
				errors.accountNumberFormat,
			),
			// Not `requiredText` — required-ness is conditional (see
			// superRefine below), so an empty string must be a *valid* parse
			// here; the conditional check adds its own issue when needed.
			confirmAccountNumber: z.string().trim().default(""),
			gstin: requiredText(errors.gstin).regex(GSTIN_REGEX, errors.gstinFormat),
			pan: requiredText(errors.pan).regex(PAN_REGEX, errors.panFormat),
			entityRegNo: requiredText(errors.entityRegNo),

			// Document-derived status fields (set by the enclosure-upload
			// controller as "Yes"/"No"/"" — see useVendorCreationFormOneController).
			// Never typed directly by the vendor, so no format/required rule here.
			gstCertificate: z.string().optional(),
			panNumber: z.string().optional(),
			bankCancelledCheque: z.string().optional(),
			certificateOfIncorporation: z.string().optional(),
			msmeCertificate: z.string().optional(),
			ndaCertificate: z.string().optional(),
			ndaObtained: requiredText(errors.ndaObtained),
			referenceNumber: z.string().optional(),
		})
		.superRefine((values, ctx) => {
			// GSTIN → PAN cross-check. Only fires once both fields are
			// individually well-formed (their own .regex() issues already
			// cover the malformed case) — mirrors the legacy
			// validatePanField's "nothing to cross-check yet" bail-out.
			if (
				GSTIN_REGEX.test(values.gstin) &&
				PAN_REGEX.test(values.pan) &&
				getGstinPanMatchStatus(values.gstin, values.pan) === "mismatch"
			) {
				ctx.addIssue({
					code: "custom",
					path: ["pan"],
					message: errors.panGstinMismatch,
				});
			}

			// confirmAccountNumber is only required when the account number is
			// new or has changed from what's on file — delegated to the
			// existing domain helper (getAccountNumberConfirmState) rather than
			// re-deriving the rule here, per the project's "keep domain helpers,
			// call them from superRefine" convention.
			const { confirmRequired, accountNumber, confirmAccountNumber } =
				getAccountNumberConfirmState(values, originalAccountNumber);

			if (!confirmRequired) return;

			if (!confirmAccountNumber) {
				ctx.addIssue({
					code: "custom",
					path: ["confirmAccountNumber"],
					message: errors.confirmAccountNumber,
				});
				return;
			}

			if (!ACCOUNT_NUMBER_REGEX.test(confirmAccountNumber)) {
				ctx.addIssue({
					code: "custom",
					path: ["confirmAccountNumber"],
					message: errors.accountNumberFormat,
				});
				return;
			}

			if (confirmAccountNumber !== accountNumber) {
				ctx.addIssue({
					code: "custom",
					path: ["confirmAccountNumber"],
					message: errors.accountNumberMismatch,
				});
			}
		});

export type VendorFormOneSchema = ReturnType<typeof buildVendorFormOneSchema>;
export type VendorFormOneValues = z.infer<VendorFormOneSchema>;
