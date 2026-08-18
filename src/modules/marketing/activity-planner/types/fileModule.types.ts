export type FileDownloadKind = "output" | "error";

export type FileModuleTriggeredBy = {
	id: string;
	firstName: string;
	lastName: string;
	fullName: string;
	email: string;
};

export type FileModuleEpc = {
	id: string;
	proposalNumber: string;
};

export type FileModuleApiItem = {
	id?: unknown;
	type?: unknown;
	status?: unknown;

	totalRecords?: unknown;
	successRecords?: unknown;
	failedRecords?: unknown;

	hasOutputFile?: unknown;
	hasErrorFile?: unknown;

	createdAt?: unknown;

	triggeredBy?: {
		id?: unknown;
		first_name?: unknown;
		last_name?: unknown;
		email?: unknown;
	} | null;

	epc?: {
		id?: unknown;
		proposal_number?: unknown;
	} | null;
};

export type FileModuleListingRow = {
	id: string;
	type: string;
	status: string;

	totalRecords: number;
	successRecords: number;
	failedRecords: number;

	hasOutputFile: boolean;
	hasErrorFile: boolean;

	createdAt: string;

	triggeredBy: FileModuleTriggeredBy | null;
	epc: FileModuleEpc | null;
};

export type FileModuleEventGroupRow = {
	id: string;
	epc: FileModuleEpc | null;

	operationCount: number;
	operationTypes: string[];

	totalRecords: number;
	successRecords: number;
	failedRecords: number;

	outputFileCount: number;
	errorFileCount: number;

	latestStatus: string;
	latestCreatedAt: string;

	triggeredBy: FileModuleTriggeredBy[];
	logs: FileModuleListingRow[];
};

export type FileDownloadUrlResponse = {
	success: boolean;
	url: string;
};
