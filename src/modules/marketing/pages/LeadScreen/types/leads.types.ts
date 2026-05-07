// Leads Listing Table

export interface LeadRow {
	id: string;
	lead_no: string;

	lead_first_name?: string;
	lead_last_name?: string;
	lead_contact_no: number;

	// ✅ Lead origin source
	epc_id: string;
	event_proposal_id: string;

	// ✅ Picked from EPC
	event_name: string;
	location: string;
	proposal_number?: string | null;

	// ✅ Lead-specific fields
	status: LeadsStatus;
	remarks?: string | null;

	created_at?: string;
	updated_at?: string;
}

export type LeadsStatus = "HOT" | "COLD" | "SURESHOT" | "LOST" | "DROPPED";
