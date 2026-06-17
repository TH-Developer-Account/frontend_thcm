export type FileModuleListingRow = {
	id: string;

	epcID: string;
	proposal_number: string;
	fileName?: string;
	status?: string;

	created_at?: string;
	updated_at?: string;

	event_name?: string;
	errorFile?: boolean;
	errorFileS3Key?: string;
};
