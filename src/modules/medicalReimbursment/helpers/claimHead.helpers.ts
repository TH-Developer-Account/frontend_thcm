import type { ClaimHeadFormRow } from "../types/reimbursementClaim.types";

export const createClaimHeadRow = (): ClaimHeadFormRow => ({
	id: crypto.randomUUID(),

	claimHead: "",

	billNumber: "",

	billName: "",

	patient: "",

	billDate: "",

	amount: "",

	approvedAmount: "",

	approvalStatus: "PENDING",

	file: null,
});
