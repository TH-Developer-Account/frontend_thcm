import type {
	ClaimHeadFormRow,
	ReimbursementClaimSubmission,
} from "../types/reimbursementClaim.types";

export {
	GUEST_EDITABLE_STATUSES,
	PUBLIC_EDITABLE_STATUSES,
} from "../utils/medicalClaimStatus.constants";

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
	isPersisted: false,
});

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

/**
 * "2026-10-01" → "2026-10-01T00:00:00.000Z". Prisma DateTime columns reject a
 * bare date, and the current backend passes signatureDate straight through.
 */
export const toIsoDateTime = (date?: string | null): string | undefined => {
	const value = date?.trim();
	if (!value) return undefined;
	return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;
};

export type ClaimFormDataMode = "submit" | "draft";

export type BuildClaimFormDataOptions = {
	/** submit → amounts must be > 0 and declaration fields are sent. */
	mode?: ClaimFormDataMode;
	/** Contact details to send (public form / guest create). */
	contact?: { mobile?: string | null; email?: string | null };
	/**
	 * The claim's bills as the server has them (id + s3Key). Used to order
	 * the payload so a new upload never lands on another bill's S3 key.
	 */
	existingBills?: Array<{ id: string; s3Key?: string | null }>;
};

/** Same mapping as the backend's getBillAttachmentExtension. */
const BILL_EXTENSION_BY_MIME: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"application/pdf": "pdf",
};

const keyBaseName = (key: string): string => key.slice(key.lastIndexOf("/") + 1);

/**
 * The current backend stores a new upload at `<index>-<claimHead>.<ext>`,
 * where index is the bill's position in the payload, and deletes removed
 * bills' files AFTER uploading. If a new upload's key equals another bill's
 * existing key (e.g. a bill was deleted and the rows shifted up), that file
 * gets overwritten or deleted. Bill order has no meaning to the server, so
 * pick positions for the new uploads whose keys are free.
 */
export function orderBillsForUpload<T extends {
	id: string;
	claimHead: string;
	isPersisted?: boolean;
	file?: File | null;
}>(items: T[], existingBills: Array<{ id: string; s3Key?: string | null }> = []): T[] {
	const keyOwner = new Map<string, string>();
	for (const bill of existingBills) {
		if (bill.s3Key) keyOwner.set(keyBaseName(bill.s3Key), bill.id);
	}
	if (!keyOwner.size) return items;

	const isFree = (item: T, index: number) => {
		if (!(item.file instanceof File)) return true;
		const ext = BILL_EXTENSION_BY_MIME[item.file.type] ?? "bin";
		const owner = keyOwner.get(`${index}-${item.claimHead}.${ext}`);
		return !owner || (item.isPersisted === true && owner === item.id);
	};

	if (items.every((item, index) => isFree(item, index))) return items;

	const slots: Array<T | undefined> = new Array(items.length).fill(undefined);
	const uploads = items.filter((item) => item.file instanceof File);
	const others = items.filter((item) => !(item.file instanceof File));

	for (const item of uploads) {
		const index = slots.findIndex((slot, i) => slot === undefined && isFree(item, i));
		if (index === -1) return items; // no safe order — keep the user's order
		slots[index] = item;
	}
	let next = 0;
	for (const item of others) {
		while (slots[next] !== undefined) next += 1;
		slots[next] = item;
	}
	return slots as T[];
}

export type SerializedBill = {
	id?: string;
	claimHead: string;
	billNo: string;
	billName: string;
	billDate?: string;
	amount: number;
	attachmentIndex: number | null;
};

/**
 * Single multipart builder for every claim write:
 *   public submit / public draft / guest create / guest resubmit.
 *
 *  - Claimant-only fields: grade, location, claimCover, spouseName,
 *    medicalAdvanceTaken (+ declaration/signature on submit).
 *  - Employee name and ticket number are NEVER sent — HR owns them.
 *  - Bills go as one JSON `bills` field; new files are appended as
 *    `billAttachments` and referenced by `attachmentIndex`.
 *  - Only server-side bill ids are sent, so a brand-new row is always
 *    created (never confused with an existing bill).
 */
export const buildMedicalClaimFormData = (
	submission: ReimbursementClaimSubmission,
	{ mode = "submit", contact, existingBills }: BuildClaimFormDataOptions = {},
): FormData => {
	const { values } = submission;
	const lineItems = orderBillsForUpload(submission.lineItems, existingBills);
	const formData = new FormData();

	appendNonBlankText(formData, "grade", values.grade);
	appendNonBlankText(formData, "location", values.location?.trim());
	appendNonBlankText(formData, "claimCover", values.coverageType);
	appendText(
		formData,
		"spouseName",
		values.coverageType === "SELF" ? "" : values.spouseName?.trim() ?? "",
	);
	appendNonBlankText(formData, "medicalAdvanceTaken", values.medicalAdvanceAmount);
	appendNonBlankText(formData, "mobile", contact?.mobile?.trim());
	appendNonBlankText(formData, "email", contact?.email?.trim());

	if (mode === "submit") {
		appendText(formData, "declarationAccepted", values.declarationAccepted);
		appendNonBlankText(formData, "signatureDate", toIsoDateTime(values.claimDate));
		appendText(
			formData,
			"signatureName",
			values.employeeSignature?.trim() || values.employeeName.trim(),
		);
	} else {
		appendNonBlankText(formData, "signatureDate", toIsoDateTime(values.claimDate));
	}

	const files: File[] = [];
	const bills: SerializedBill[] = lineItems.map((item, index) => {
		const amount = Number(item.amount);
		if (mode === "submit" && (!Number.isFinite(amount) || amount <= 0)) {
			throw new Error(`Bill #${index + 1} must have a valid amount.`);
		}

		const attachmentIndex =
			item.file instanceof File ? files.push(item.file) - 1 : null;

		return {
			...(item.isPersisted ? { id: item.id } : {}),
			claimHead: item.claimHead,
			billNo: item.billNumber.trim().toUpperCase(),
			billName: item.billName.trim(),
			billDate: item.billDate || undefined,
			amount: Number.isFinite(amount) ? amount : 0,
			attachmentIndex,
		};
	});

	formData.append("bills", JSON.stringify(bills));
	files.forEach((file) => formData.append("billAttachments", file, file.name));

	return formData;
};
