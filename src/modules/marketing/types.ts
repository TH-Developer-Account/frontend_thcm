export interface CostItem {
	id: string;
	particular: string;
	description: string;
	rate: number;
	quantity: number;
}

export interface CrfProps {
	items: CostItem[];
	onChange: (items: CostItem[]) => void;
	isViewer?: boolean;
}

export interface EpcFormProps {
	epcId?: string;
	userRole: "ADMIN" | "MANAGER" | "VIEWER";
}

export type EpcStatus = "DRAFT" | "SUBMITTED";

export interface EpcFormValues {
	id?: string; // for edit mode
	epfNo: string;
	poDocumentRefNo: string;
	department: string;
	zone: string;
	branch: string;
	budgetCode: string;
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

export interface UseEpcFormProps {
	epcId?: string;
}
export interface Option {
	label: string;
	value: string;
}
