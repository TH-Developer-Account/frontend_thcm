import type { ClaimHeadFormRow } from "./reimbursementClaim.types";

export const createClaimHeadRow = (): ClaimHeadFormRow => ({
	id: crypto.randomUUID(),

	claimHead: "",

	billNumber: "",

	billName: "",

	patient: "",

	billDate: "",

	amount: "",

	file: null,
});
