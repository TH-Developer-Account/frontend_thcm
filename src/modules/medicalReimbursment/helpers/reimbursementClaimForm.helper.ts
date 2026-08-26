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
});

export const GUEST_EDITABLE_STATUSES = new Set([
	"DRAFT",
	"CLARIFIED",
	"CLARIFICATION_REQUESTED",
	"THCM_CLARIFICATION_REQUESTED",
]);

const appendText = (
	formData: FormData,
	name: string,
	value: string | number | boolean | null | undefined,
) => {
	if (value !== undefined && value !== null) {
		formData.append(name, String(value));
	}
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
