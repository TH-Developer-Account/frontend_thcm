export type LeadRow = {
	id: string;
	epcId: string;

	name: string;
	email: string;
	phone: string;
	notes: string;

	status?: string;
	created_at?: string;
	updated_at?: string;
};

export type LeadEventDetails = {
	epcId: string;
	event_name?: string;
	location?: string;
	created_at?: string;
};

export type LeadEventGroup = LeadEventDetails & {
	lead_count: number;
	leads: LeadRow[];
};

export type LeadsStatus = "HOT" | "COLD" | "SURESHOT" | "LOST" | "DROPPED";
