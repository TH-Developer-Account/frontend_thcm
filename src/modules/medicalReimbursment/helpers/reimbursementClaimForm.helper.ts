import { medicalClaimApi } from "../api/medicalClaim.api";
import type {
	ClaimHeadFormRow,
	ReimbursementClaimSubmission,
} from "../types/reimbursementClaim.types";

export const createClaimHeadRow = (): ClaimHeadFormRow => ({
	id: crypto.randomUUID(),
	claimHead: "",
	billNumber: "",
	billName: "",
	patient: "",
	billDate: "",
	amount: "",
	approvedClaimAmount: "",
	approvalStatus: "PENDING",
	file: null,
	attachment: null,
	remarks: "",
});

export const GUEST_EDITABLE_STATUSES = new Set([
	"DRAFT",
	"CLARIFIED",
	"CLARIFICATION_REQUESTED",
	"THCM_CLARIFICATION_REQUESTED",
]);

export const appendText = (
	formData: FormData,
	name: string,
	value: string | number | boolean | null | undefined,
): void => {
	if (value === undefined || value === null) return;
	formData.append(name, String(value));
};

export const appendNonBlankText = (
	formData: FormData,
	name: string,
	value: string | number | null | undefined,
): void => {
	if (value === undefined || value === null || String(value).trim() === "") {
		return;
	}
	formData.append(name, String(value));
};
export const buildMedicalClaimFormData = (
	submission: ReimbursementClaimSubmission,
): FormData => {
	const { values, lineItems } = submission;
	const formData = new FormData();

	appendText(formData, "grade", values.grade);
	appendText(formData, "location", values.location);
	appendText(formData, "claimCover", values.coverageType);
	appendText(formData, "spouseName", values.spouseName);
	appendText(formData, "signatureDate", values.claimDate);
	appendText(formData, "declarationAccepted", values.declarationAccepted);
	appendText(
		formData,
		"signatureName",
		values.employeeSignature?.trim() || values.employeeName.trim(),
	);

	const files: File[] = [];

	const bills = lineItems.map((item) => {
		const attachmentIndex =
			item.file instanceof File ? files.push(item.file) - 1 : null;

		return {
			id: item.id,
			claimHead: item.claimHead,
			billNo: item.billNumber.trim(),
			billName: item.billName.trim(),
			billDate: item.billDate || undefined,
			amount: Number(item.amount) || 0,
			attachmentIndex,
		};
	});

	formData.append("bills", JSON.stringify(bills));

	files.forEach((file) => {
		formData.append("billAttachments", file, file.name);
	});

	return formData;
};

const EXPORT_POLL_INTERVAL_MS = 2_000;
const EXPORT_POLL_TIMEOUT_MS = 2 * 60 * 1_000;

const wait = (duration: number) =>
	new Promise<void>((resolve) => {
		window.setTimeout(resolve, duration);
	});

export const waitForMedicalClaimExport = async (
	jobId: string,
): Promise<string> => {
	const startedAt = Date.now();

	while (Date.now() - startedAt < EXPORT_POLL_TIMEOUT_MS) {
		const result = await medicalClaimApi.getListingExportStatus(jobId);

		if (result.status === "completed") {
			if (!result.downloadUrl) {
				throw new Error("Export completed, but no download URL was returned.");
			}

			return result.downloadUrl;
		}

		if (result.status === "failed") {
			throw new Error(result.failedReason || "Medical claim export failed.");
		}

		await wait(EXPORT_POLL_INTERVAL_MS);
	}

	throw new Error("Medical claim export timed out.");
};
