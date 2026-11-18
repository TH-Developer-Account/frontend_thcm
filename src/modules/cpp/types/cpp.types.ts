import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";

/**
 * Status is a plain string end to end (the DB column is a String, not an enum),
 * so a status added on the server never breaks the build. The known values and
 * their labels live in CPP_STATUS / CPP_STATUS_LABELS (utils/cpp.constants.ts);
 * anything unknown is shown as its raw value.
 */
export type CppStatus = string;

export type CppListingTab = "myRequests" | "drafts";

export type CppStatusFilter = "all" | CppStatus;

/* ----------------------------- form types ------------------------------ */
// Used by utils/cpp.utils.ts and utils/cpp.schema.ts (Create CPP form).

export type CppPlant = "DWD" | "KGP" | "SPARE";

export type CppEffect = "Quality" | "Cost" | "Delivery";

export type CppTabKey =
	| "purchasing"
	| "financial"
	| "amortisation"
	| "tracker"
	| "master"
	| "other"
	| "workflow";

/** Steps of the Create CPP wizard (the old tab keys are left untouched). */
export type CppStepKey =
	| "basic"
	| "purchasing"
	| "master"
	| "other"
	| "attachments"
	| "workflow";

export type CppStep = { id: number; key: CppStepKey; label: string };

/** Which conditions a category can pick (Indirect category → indirect sheets). */
export type CppConditionGroup = "DIRECT" | "INDIRECT";

/** What the first approval band reads. null = the sheet has no first band. */
export type CppPartBasis = "PART_VALUE" | "VARIATION_PCT" | null;

/** What the amount band reads. */
export type CppAmountBasis =
	| "ANNUALISED_VALUE"
	| "ANNUALISED_IMPACT"
	| "ACTUAL_IMPACT";

export type CppConditionOption = {
	/** Stable code the backend resolver will match on. */
	value: string;
	label: string;
	/** Workbook sheet this condition maps to (traceability). */
	sheet: string;
	group: CppConditionGroup;
	partBasis: CppPartBasis;
	amountBasis: CppAmountBasis;
};

export type CppSupplier = {
	partnerId: string;
	name: string;
	code: string;
	manual: boolean;
};

/** All values are strings because they come straight from inputs. */
export type CppPartRow = {
	partNo: string;
	description: string;
	uom: string;
	existingRate: string;
	existingWef: string;
	quotedRate: string;
	quotedWef: string;
	finalRate: string;
	finalWef: string;
	qtyReceived: string;
	qtyRemaining: string;
	qtyAnnual: string;
};

export type CppAmortRow = {
	partNo: string;
	amount: string;
	qty: string;
	perMachineQty: string;
};

export type CppFormValues = {
	/* --- step 1: basic details --- */
	category: string;
	plant: string;
	/** Workbook sheet code, see CPP_CONDITIONS. */
	condition: string;
	materialType: "" | "Direct" | "Indirect";
	/** "Commodity price adjustment – effect on" (Quality / Cost / Delivery). */
	effects: CppEffect[];
	reason: string;
	priceType: string;
	justification: string;
	initiationDate: string;

	/* --- step 2: purchasing details --- */
	suppliers: {
		existing: CppSupplier;
		other: CppSupplier;
		recommended: CppSupplier;
	};
	/** The attached purchasing-details Excel. Not parsed or stored by the app. */
	purchasingFile: FileUploadValue | null;
	/** Typed by the requester; only the values the chosen condition needs. */
	approvalValues: {
		partValue: string;
		variationPct: string;
		amount: string;
	};

	/* --- remaining steps --- */
	other: {
		remarks: string;
	};
	/** Supporting documents, keyed by CPP_ATTACHMENTS key. Sent to TCS on approval. */
	attachments: Record<string, FileUploadValue | null>;
	masterData: {
		materialGroup: string;
		materialType: string;
		purchasingGroup: string;
		priceType: string;
		incoTerms: string;
		taxCode: string;
		storeLocation: string;
		validFrom: string;
		updateSourceList: string;
		plants: CppPlant[];
		note: string;
	};

	/* --- kept so the older tabs still compile; not rendered in the wizard --- */
	parts: CppPartRow[];
	amortisation: CppAmortRow[];
	financial: {
		noChange: boolean;
		plantSplit: Record<CppPlant, string>;
	};
	workflow: {
		/** Step 1 "Models" */
		models: string[];
		/** Step 1 "Applicable plants" */
		plants: CppPlant[];
		/** Step 1 "Pricing condition" */
		pricingCondition: string;
		spares: boolean;
		authority: string;
	};
};

/* ------------------------------ API contract ----------------------------- */
// Mirrors the backend (cpp.helper.ts / cpp.sections.ts). Every tab is saved as
// one { key, label, data } section — the same shape as the attachments list.

/** Decimals arrive as strings from Prisma/JSON. */
export type DecimalValue = string | number | null;

export type CppSectionKey = "basic" | "purchasing" | "master" | "other";

export type CppSection = {
	key: CppSectionKey;
	label: string;
	data: Record<string, unknown>;
};

export type CppListItem = {
	id: string;
	referenceNumber: string;
	status: CppStatus | string;
	category: string | null;
	plant: string | null;
	condition: string | null;
	isSpare: boolean;
	reasonCode: string | null;
	supplierCode: string | null;
	supplierName: string | null;
	maxPartValue: DecimalValue;
	maxVariationPct: DecimalValue;
	annualisedValue: DecimalValue;
	annualisedImpact: DecimalValue;
	actualImpact: DecimalValue;
	submittedAt: string | null;
	created_at: string;
	updated_at: string;
};

export type CppListingRow = {
	id: string;
	referenceNumber: string;
	status: string;
	category: string;
	plant: string;
	condition: string;
	supplier: string;
	reason: string;
	/** Whichever amount the condition's bands read (annualised value / impact / actual impact). */
	amount: number | null;
	amountLabel: string;
	isSpare: boolean;
	updatedAt: string;
};

export type CppListingParams = {
	tab: CppListingTab;
	search?: string;
	status?: string;
	pageIndex: number;
	pageSize: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
};

export type CppListingResult = {
	rows: CppListItem[];
	totalCount: number;
	pageIndex: number;
	pageSize: number;
};

export type CppListingApiResponse = {
	success: boolean;
	data: CppListItem[];
	total: number;
	page_index: number;
	page_size: number;
};

export type CppAttachment = {
	id: string;
	/** "purchasingFile" or a CPP_ATTACHMENTS key. */
	type: string;
	fileName: string;
	uploadedAt: string;
	/** Signed URL, only present on responses. */
	url?: string;
};

export type CppDetail = CppListItem & {
	/** Always all four sections, in tab order, every field present. */
	sections: CppSection[];
	attachments: CppAttachment[];
};

/** Body of POST /cpp and PUT /cpp/:id. */
export type CppRequestPayload = {
	category?: string | null;
	plant?: string | null;
	condition?: string | null;
	sections?: Array<{
		key: CppSectionKey;
		label?: string;
		data: Record<string, unknown>;
	}>;
};

export type CppMutationResponse = {
	success: boolean;
	message?: string;
	data: CppDetail;
};

/* ----------------------------- approval matrix ---------------------------- */

export type CppSlotScope = "ALL" | "KGP" | "DWD";

export type CppPerson = {
	id: string;
	name: string | null;
	email: string | null;
};

export type CppMatrixRole = {
	key: string;
	label: string;
	group: string;
	/** PLANT = one assignment each for KGP and DWD; ALL = a single assignment. */
	scope: "PLANT" | "ALL";
	scopes: CppSlotScope[];
	assignable: boolean;
	observer: boolean;
	note: string | null;
	/** How many of the 71 workflow bands use this role. */
	usedByBands: number;
};

export type CppMatrixAssignment = {
	roleKey: string;
	scope: CppSlotScope;
	users: CppPerson[];
};

export type CppCoverageIssue = {
	roleKey: string;
	scope: string;
	severity: "error" | "warning";
	message: string;
};

export type CppApprovalMatrix = {
	roles: CppMatrixRole[];
	assignments: CppMatrixAssignment[];
	coverage: CppCoverageIssue[];
	updatedAt: string | null;
};

export type CppMatrixSlotUpdate = {
	roleKey: string;
	scope: CppSlotScope;
	userIds: string[];
};

export type CppChainStep = {
	stage: "WF1" | "WF2";
	kind:
		| "PROPOSER"
		| "RECOMMENDER"
		| "CHECKER"
		| "APPROVER"
		| "COMMITTEE"
		| "REPORTING";
	label: string;
	title: string;
	roleKeys: string[];
	mode?: "ANY_ONE";
	required?: number;
	variants?: Record<string, string>;
	alsoPriceFeeding?: boolean;
};

export type CppChain = {
	ruleId: string;
	sheet: string;
	block: "MAIN" | "SPARES";
	bandLabel: string;
	wf1: CppChainStep[];
	wf2: CppChainStep[];
	priceFeeding: { roleKey: string; implied: boolean };
};
