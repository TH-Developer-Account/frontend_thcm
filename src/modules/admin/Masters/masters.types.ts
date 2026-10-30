// Types for the Masters hub + split view. Data comes from the existing
// GET /master-data feed (via useMasterData); saves go to POST /master-data/manage.

export type MasterKey =
	| "branch"
	| "department"
	| "eventName"
	| "budgetMaster"
	| "division"
	| "designation"
	| "costCenter"
	| "zone"
	| "gradeEligibility";

/** One option as returned by GET /master-data (extra keys vary per master). */
export type FeedOption = {
	value: string | number;
	label: string;
	code?: string | null;
	description?: string | null;
	budgetAmount?: number | string | null;
	annualCap?: number | string | null;
	[key: string]: unknown;
};

/** One row as the Masters screen shows it, identical for every master. */
export type MasterRow = {
	id: string;
	name: string;
	code: string | null;
	fiscal_year: string | null;
	id_desc: string | null;
	value: number | null;
};

/** Values the form edits. Strings so inputs stay controlled. */
export type MasterFormValues = {
	name: string;
	code: string;
	fiscal_year: string;
	id_desc: string;
	value: string;
};

/** Body for POST /master-data/manage. */
export type SaveMasterPayload = {
	type: MasterKey;
	action: "create" | "update";
	data: {
		id?: string;
		name?: string;
		code?: string;
		fiscal_year?: string;
		id_desc?: string;
		value?: number;
		grade?: string;
		annualCap?: number;
	};
};
