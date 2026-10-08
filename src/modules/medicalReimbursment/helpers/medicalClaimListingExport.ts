import * as XLSX from "xlsx";

import type { MedicalClaimListItem } from "../types/medicalClaimListing.types";

type ExportableClaim = MedicalClaimListItem & {
	patientName?: string | null;
	claimCover?: string | null;
	spouseName?: string | null;
	medicalAdvanceTaken?: number | string | null;
	alreadySettled?: number | string | null;
};

const amount = (value: unknown): number | string => {
	if (value === null || value === undefined || value === "") return "";
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed !== 0 ? parsed : "";
};

/**
 * Same columns as the backend export (mapMedicalClaimToXlsxRow), so a
 * status-filtered export built here looks like the server-built one.
 */
export const toMedicalClaimExportRow = (claim: ExportableClaim) => ({
	"Reference Number": claim.referenceNumber,
	"Employee Name": claim.employeeName ?? "",
	"Ticket Number": claim.ticketNumber ?? "",
	Mobile: claim.mobile ?? "",
	Email: claim.email ?? "",
	Grade: claim.grade ?? "",
	Location: claim.location ?? "",
	"Patient Name": claim.patientName ?? "",
	"Claim Cover": claim.claimCover ?? "",
	"Spouse Name": claim.spouseName ?? "",
	"Medical Advance Taken": amount(claim.medicalAdvanceTaken),
	"Eligible Amount": amount(claim.eligibleAmount),
	"Already Settled": amount(claim.alreadySettled),
	"Total Claimed": amount(claim.totalClaimed),
	Status: claim.status,
	"Submitted At": claim.submittedAt ?? "",
	"Created At": claim.created_at,
});

/** Builds the workbook and starts the download in the browser. */
export function downloadMedicalClaimListingXlsx(
	claims: MedicalClaimListItem[],
	fileName: string,
): void {
	const sheet = XLSX.utils.json_to_sheet(claims.map(toMedicalClaimExportRow));
	sheet["!cols"] = Object.keys(toMedicalClaimExportRow({} as ExportableClaim)).map(
		(header) => ({
			wch:
				header === "Reference Number"
					? 26
					: header === "Employee Name"
						? 24
						: header === "Email"
							? 28
							: 16,
		}),
	);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, sheet, "MedicalClaims");
	XLSX.writeFile(workbook, fileName);
}
