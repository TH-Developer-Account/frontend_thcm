export type LeadStatus =
	| "HOT"
	| "COLD"
	| "SURESHOT"
	| "LOST"
	| "DROPPED"
	| string;

export type LeadPageMode = "create" | "edit" | "view";
export type LeadInfo = {
	epcId: string;
	leadId?: string | null;
	proposalNumber?: string;
	eventName?: string;
	location?: string;
	status?: string;
};

export type LeadRow = {
	id: string;
	epcId: string;
	name: string;
	email: string;
	phone: string;
	notes: string;
	status?: LeadStatus;

	created_at?: string;
	updated_at?: string;

	// EPC display fields from nested backend EPC object
	proposalNumber?: string;
	event_name?: string;
	location?: string;
	epcStatus?: string;
};

export type LeadFormRow = {
	id: string;
	leadName: string;
	leadPhoneNumber: string;
	leadEmail: string;
	notes: string;
};

export type LeadPayloadItem = {
	name: string;
	phone: string;
	email: string;
	notes?: string;
};

export type CreateLeadsPayload = {
	epcId: string;
	leads: LeadPayloadItem[];
};

export type UpdateLeadPayload = LeadPayloadItem & {
	epcId: string;
};

export type LeadEventDetails = {
	epcId: string;
	proposalNumber?: string;
	event_name?: string;
	location?: string;
	status?: string;
	created_at?: string;
};

export type LeadEventGroup = LeadEventDetails & {
	lead_count: number;
	leads: LeadRow[];
};

export type LeadValidationErrors = Record<string, string>;
