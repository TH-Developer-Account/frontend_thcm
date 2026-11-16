export type CppStatus =
	| "DRAFT"
	| "IN_PROGRESS"
	| "CLARIFICATION_REQUESTED"
	| "APPROVED";

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
	materialType: "" | "Direct" | "Indirect";
	reason: string;
	effects: CppEffect[];
	aribaRef: string;
	initiationDate: string;
	suppliers: {
		existing: CppSupplier;
		other: CppSupplier;
		recommended: CppSupplier;
	};
	parts: CppPartRow[];
	amortisation: CppAmortRow[];
	other: {
		remarks: string;
		attachments: Record<string, boolean>;
	};
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
	financial: {
		noChange: boolean;
		plantSplit: Record<CppPlant, string>;
	};
	workflow: {
		models: string[];
		plants: CppPlant[];
		pricingCondition: string;
		spares: boolean;
		authority: string;
	};
	justification: string;
};

/** Decimals arrive as strings from Prisma/JSON. */
export type DecimalValue = string | number | null;

export type CppListItem = {
	id: string;
	referenceNumber: string;
	title: string | null;
	status: CppStatus | string;
	materialCategory: string | null;
	requestType: string | null;
	reasonCode: string | null;
	supplierCode: string | null;
	supplierName: string | null;
	plantCodes: string[];
	itemCount: number;
	actualImpact: DecimalValue;
	annualisedImpact: DecimalValue;
	maxVariationPct: DecimalValue;
	submittedAt: string | null;
	created_at: string;
	updated_at: string;
};

export type CppListingRow = {
	id: string;
	referenceNumber: string;
	title: string;
	status: string;
	materialCategory: string;
	requestType: string;
	supplier: string;
	plants: string;
	itemCount: number;
	actualImpact: number | null;
	annualisedImpact: number | null;
	updatedAt: string;
};

export type CppListingParams = {
	tab: CppListingTab;
	search?: string;
	status?: CppStatus;
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

export type CppItem = {
	id: string;
	lineNo: number;
	plantCode: string | null;
	partNo: string | null;
	oldPartNo: string | null;
	description: string | null;
	uom: string | null;
	model: string | null;
	existingPrice: DecimalValue;
	existingWef: string | null;
	quotedPrice: DecimalValue;
	otherQuotedPrice: DecimalValue;
	newPrice: DecimalValue;
	effectiveFrom: string | null;
	validTo: string | null;
	receivedQty: DecimalValue;
	remainingQty: DecimalValue;
	abpVolume: DecimalValue;
	qtyPerMachine: DecimalValue;
	poRef: string | null;
	materialMasterChange: string | null;
	priceInclAmort: DecimalValue;
	amortCutoffDate: string | null;
	amortQty: DecimalValue;
	priceAfterAmort: DecimalValue;
};

export type CppAttachment = {
	id: string;
	type: string;
	fileName: string;
	mimeType: string;
	size: number;
	uploadedAt: string;
	/** Signed URL, only present on responses. */
	url?: string;
};

export type CppDetail = {
	id: string;
	referenceNumber: string;
	status: CppStatus | string;
	formatVersion: string;
	rowVersion: number;
	title: string | null;
	materialCategory: string | null;
	requestType: string | null;
	reasonCode: string | null;
	effectQcd: string[];
	pricingCondition: string | null;
	priceType: string | null;
	plantCodes: string[];
	models: string | null;
	supplierCode: string | null;
	supplierName: string | null;
	existingSupplierCode: string | null;
	existingSupplierName: string | null;
	itemCount: number;
	maxPartValue: DecimalValue;
	annualisedValue: DecimalValue;
	actualImpact: DecimalValue;
	annualisedImpact: DecimalValue;
	maxVariationPct: DecimalValue;
	justification: string | null;
	details: Record<string, unknown> | null;
	attachments: CppAttachment[];
	items: CppItem[];
	submittedAt: string | null;
	created_at: string;
	updated_at: string;
	initiatedBy?: { id: string; name: string | null; email: string | null };
};

/** Body of POST /cpp and PUT /cpp/:id — the contract the Create CPP form saves to. */
export type CppItemPayload = Partial<
	Omit<
		CppItem,
		| "id"
		| "lineNo"
		| "existingPrice"
		| "quotedPrice"
		| "otherQuotedPrice"
		| "newPrice"
		| "receivedQty"
		| "remainingQty"
		| "abpVolume"
		| "qtyPerMachine"
		| "priceInclAmort"
		| "amortQty"
		| "priceAfterAmort"
	>
> & {
	existingPrice?: number | string | null;
	quotedPrice?: number | string | null;
	otherQuotedPrice?: number | string | null;
	newPrice?: number | string | null;
	receivedQty?: number | string | null;
	remainingQty?: number | string | null;
	abpVolume?: number | string | null;
	qtyPerMachine?: number | string | null;
	priceInclAmort?: number | string | null;
	amortQty?: number | string | null;
	priceAfterAmort?: number | string | null;
};

export type CppRequestPayload = {
	/** Required on update. */
	rowVersion?: number;
	title?: string | null;
	materialCategory?: string | null;
	requestType?: string | null;
	reasonCode?: string | null;
	effectQcd?: string[] | null;
	pricingCondition?: string | null;
	priceType?: string | null;
	plantCodes?: string[] | null;
	models?: string | null;
	supplierCode?: string | null;
	supplierName?: string | null;
	existingSupplierCode?: string | null;
	existingSupplierName?: string | null;
	justification?: string | null;
	details?: Record<string, unknown> | null;
	items?: CppItemPayload[];
};

export type CppMutationResponse = {
	success: boolean;
	message?: string;
	data: CppDetail;
};
