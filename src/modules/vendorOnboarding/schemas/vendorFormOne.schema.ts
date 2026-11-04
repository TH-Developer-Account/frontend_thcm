import { z } from "zod";

import { vendorContent } from "../utils/vendor.content";

import {
	ACCOUNT_NUMBER_REGEX,
	EMAIL_REGEX,
	GSTIN_REGEX,
	// EMAIL_STRICT_REGEX,
	IFSC_REGEX,
	MOBILE_REGEX,
	PAN_REGEX,
	PIN_CODE_REGEX,
	getAccountNumberConfirmState,
	getGstinPanMatchStatus,
} from "../../../utils/form.validation";

const errors = vendorContent.formOne.errors;

const requiredText = (message: string) => z.string().trim().min(1, message);

export const buildVendorFormOneSchema = (originalAccountNumber: string) =>
	z
		.object({
			vendorName: requiredText(errors.vendorName),
			vendorReferenceName: z.string().trim().optional(),
			address: requiredText(errors.address),
			// "Yes" | "No" | "N/A" — set by the enclosure-upload controller, not
			// typed by the vendor. Only "Yes" makes the MSME certificate
			// mandatory; see isEnclosureRequired / getMissingDocuments.
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
			email: requiredText(errors.email).regex(EMAIL_REGEX, errors.emailFormat),
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
			// Same idea for GSTIN: when GST is marked N/A there is no GSTIN to
			// collect, so required + format are enforced in superRefine only
			// when GST is applicable.
			gstin: z.string().trim().default(""),
			pan: requiredText(errors.pan).regex(PAN_REGEX, errors.panFormat),
			entityRegNo: requiredText(errors.entityRegNo),

			// "Applicable" | "N/A" | "" — chosen by the vendor via the select
			// above the GST / Incorporation upload. Empty is treated as
			// applicable (document stays mandatory), so existing records and
			// saved drafts behave exactly as before.
			gstApplicability: z.string().optional(),
			incorporationApplicability: z.string().optional(),

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
			// Applicability selects must be answered; the fields they gate are
			// the GSTIN is only shown (and validated) when GST is "Applicable".
			if (!values.gstApplicability) {
				ctx.addIssue({
					code: "custom",
					path: ["gstApplicability"],
					message: "Select GST applicability",
				});
			}

			if (!values.incorporationApplicability) {
				ctx.addIssue({
					code: "custom",
					path: ["incorporationApplicability"],
					message: "Select incorporation applicability",
				});
			}

			// GSTIN: required + well-formed, only when GST is Applicable.
			if (values.gstApplicability === "Applicable") {
				if (!values.gstin) {
					ctx.addIssue({
						code: "custom",
						path: ["gstin"],
						message: errors.gstin,
					});
				} else if (!GSTIN_REGEX.test(values.gstin)) {
					ctx.addIssue({
						code: "custom",
						path: ["gstin"],
						message: errors.gstinFormat,
					});
				}
			}

			// GSTIN → PAN cross-check. Only fires once both fields are
			// individually well-formed (their own .regex() issues already
			// cover the malformed case) — mirrors the legacy
			// validatePanField's "nothing to cross-check yet" bail-out.
			// Naturally skipped when GSTIN is empty (GST = N/A).
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
