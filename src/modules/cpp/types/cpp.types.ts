import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import type { PendingOn } from "../../../utils/statusAlert.helper";

/**
 * Status is a plain string end to end (the DB column is a String, not an enum),
 * so a status added on the server never breaks the build. The known values and
 * their labels live in CPP_STATUS / CPP_STATUS_LABELS (utils/cpp.constants.ts);
 * anything unknown is shown as its raw value.
 */
export type CppStatus = string;

export type CppListingTab =
	| "myRequests"
	| "drafts"
	| "pendingOnMe"
	| "approvedByMe";

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

/**
 * Steps of the Create CPP wizard. "amortisation" is only in the stepper when
 * the pricing condition is PB50 (see getCppSteps in utils/cpp.utils.ts).
 */
export type CppStepKey =
	| "basic"
	| "purchasing"
	| "amortisation"
	| "volumes"
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

/**
 * One data row of the uploaded summary sheet (part info), as the server read it.
 * Same columns as the sheet (see PartSummaryModal FORMAT_GROUPS). Read-only in the
 * form: it comes back from GET /cpp/:id as `parts` and is never sent in a save.
 */
export type CppSummaryPart = {
	slNo: string;
	plant: string;
	model: string;
	partNo: string;
	description: string;
	uom: string;
	existingPrice: string;
	newPrice: string;
	difference: string;
	currentPo: string;
	effectiveDate: string;
	receivedQty: string;
	actualImpact: string;
	abpVolume: string;
	qtyPerMachine: string;
	annualisedImpact: string;
	changePct: string;
};

/* --- plant / spares master data ("For Plants" / "For Spares" in the format) --- */

/** PLANT = DWD 1006 / KGP 3006 · SPARE = KGP WH 8445 / DWD WH 8580 / NGP 8400. */
export type CppLocationGroup = "PLANT" | "SPARE";

/**
 * One SAP plant code. Plant code + purchasing group go into both TCS text
 * files (ZINFOUPDATE_ME11 and ZCHANGEINFO).
 */
export type CppLocationRow = {
	code: string;
	name: string;
	group: CppLocationGroup;
	applicable: boolean;
	incoTerms: string;
	purchasingGroup: string;
	taxCode: string;
	/** Plants only. */
	storeLocation: string;
	/** Spares only — P&F (%). */
	pfPct: string;
};

/* --- amortisation ("In case of Amortisation Only") --- */

export type CppAmortRow = {
	partNo: string;
	priceInclAmort: string;
	cutoffDate: string;
	amortQty: string;
	priceAfterAmort: string;
};

/* --- volumes & impact (all optional) --- */

/** "Volumes Taken For Calculation": a / b for actual, c for annualised. */
export type CppVolumeRow = {
	/** Rcvd qty (till date) = a */
	received: string;
	/** Remaining qty = b */
	remaining: string;
	/** Qty/mc × ABP nos = c */
	annual: string;
};

/** "Per Machine Impact" — ₹ per machine. */
export type CppPerMachineRow = {
	plant: string;
	model: string;
	withAmort: string;
	withoutAmort: string;
};

/** "Material Cost Tracker" — all values in ₹ lakhs. */
export type CppCostTrackerRow = {
	model: string;
	perMachineImpact: string;
	budgetedIncrease: string;
	statusYtd: string;
	budgetedMaterialCost: string;
	materialCostYtd: string;
};

/** "Financial Impact" box of the CPP format — one row per plant (typed). */
export type CppFinancialPlantRow = {
	actualInr: string;
	actualPct: string;
	annualisedInr: string;
	annualisedPct: string;
};

/** Mandatory Check List answer. Blank until the requester answers. */
export type CppChecklistValue = "" | "Yes" | "No" | "NA";

/** "Price in Other Plant Location (if any)". */
export type CppOtherPlantPriceRow = {
	plant: string;
	partNumber: string;
	price: string;
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
	/**
	 * Raw numbers (no commas) — exactly what is sent to the API.
	 * `partValuePart` / `amountPart` hold the summary-sheet part the value was
	 * picked from (partKey: "PLANT::PARTNO"), blank when typed by hand.
	 */
	approvalValues: {
		partValue: string;
		variationPct: string;
		amount: string;
		partValuePart: string;
		amountPart: string;
	};

	/** Summary sheet rows read by the server. Read-only; never sent in a save. */
	summaryParts: CppSummaryPart[];

	/* --- amortisation step (PB50 only) --- */
	amortisation: CppAmortRow[];

	/* --- volumes & impact step (optional) --- */
	volumes: Record<CppPlant, CppVolumeRow>;
	perMachineImpact: CppPerMachineRow[];
	costTracker: CppCostTrackerRow[];

	/* --- remaining steps --- */
	other: {
		remarks: string;
		/** Mandatory Check List answers, keyed by CPP_CHECKLIST key. */
		checklist: Record<string, CppChecklistValue>;
		/** "Price in Other Plant Location (if any)". */
		plantPrices: CppOtherPlantPriceRow[];
	};
	/** Supporting documents, keyed by CPP_ATTACHMENTS key. Sent to TCS on approval. */
	attachments: Record<string, FileUploadValue | null>;
	masterData: {
		materialGroup: string;
		materialType: string;
		/** Older single-value fields — now per plant code in plantDetails. */
		purchasingGroup: string;
		priceType: string;
		incoTerms: string;
		taxCode: string;
		storeLocation: string;
		validFrom: string;
		updateSourceList: string;
		plants: CppPlant[];
		note: string;
		/** All five codes; the step shows the group that matches `plant`. */
		plantDetails: CppLocationRow[];
	};

	/* --- kept so the older tabs still compile --- */
	parts: CppPartRow[];
	financial: {
		noChange: boolean;
		plantSplit: Record<CppPlant, string>;
		/** Financial Impact box: per plant, as in the Excel. */
		plants: Record<CppPlant, CppFinancialPlantRow>;
		totalActualPct: string;
		totalAnnualisedPct: string;
	};
	workflow: {
		/** Step 1 "Models" */
		models: string[];
		/** No longer shown — the Plant dropdown + plantDetails replace it. */
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

export type CppSectionKey =
	| "basic"
	| "purchasing"
	| "amortisation"
	| "volumes"
	| "master"
	| "financial"
	| "other";

export type CppSection = {
	key: CppSectionKey;
	label: string;
	data: Record<string, unknown>;
};

/** The person who created the request (GET /cpp/:id and the listing). */
export type CppInitiator = {
	id: string;
	name: string | null;
	email: string | null;
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
	initiatedById?: string | null;
	/** Who has to act now (listing only). Same shape as the other modules. */
	pendingOn?: PendingOn | null;
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
	initiatedById?: string | null;
	pendingOn: PendingOn | null;
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
	/** Summary sheet only: part rows read at upload. */
	partRowCount?: number;
};

export type CppDetail = CppListItem & {
	/** Always every section, in tab order, every field present. */
	sections: CppSection[];
	attachments: CppAttachment[];
	initiatedBy?: CppInitiator | null;
	/** Rows of the saved summary sheet. Absent until the sheet is uploaded. */
	parts?: Array<Partial<Record<keyof CppSummaryPart, string | number | null>>>;
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
