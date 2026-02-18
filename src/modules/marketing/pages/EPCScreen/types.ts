export type EpcStatus = "DRAFT" | "SUBMITTED";

export interface EpcFormValues {
	id?: string; // for edit mode
	epfNo: string;
	poDocumentRefNo: string;
	department: string;
	zone: string;
	branch: string;
	vertical: string;
	scale: string;
	eventName: string;
	eventDescription: string;
	eventFrom: string;
	eventTo: string;
	location: string;
	objective: string;
	status: EpcStatus;
}

export type UserRole = "ADMIN" | "EMPLOYEE" | "DEALER";
