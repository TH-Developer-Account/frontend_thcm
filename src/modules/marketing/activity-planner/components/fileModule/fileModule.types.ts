export type FileModuleListingRow = {
	id: string;
	epcId: string;
	fileName: string;
	status?: string;

	created_at?: string;
	updated_at?: string;

	proposalNumber?: string;
	event_name?: string;
};
