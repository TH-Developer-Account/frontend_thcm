// types/cpp.types.ts
// Form shape for the "Create new CPP request" page. Every input is a string
// (or boolean / string[]) so react-hook-form + zod stay in lock-step; numbers
// are parsed in utils/cpp.utils.ts only when calculating.

export type CppMaterialType = "" | "Direct" | "Indirect";
export type CppEffect = "Quality" | "Cost" | "Delivery";
export type CppPlant = "DWD" | "KGP" | "SPARE";

export type CppTabKey =
	| "purchasing"
	| "other"
	| "master"
	| "financial"
	| "workflow"
	| "tracker"
	| "amortisation";

export type CppSupplier = {
	/** BusinessPartnerAsyncSelect option id ("" when typed manually). */
	partnerId: string;
	name: string;
	/** Vendor code — not on the BP option, so it is always typed. */
	code: string;
	/** True when the supplier isn't in the BP list and was entered by hand. */
	manual: boolean;
};

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
	/** a — quantity received till date */
	qtyReceived: string;
	/** b — quantity remaining on current PO */
	qtyRemaining: string;
	/** c — annualised qty (Qty per m/c × ABP) */
	qtyAnnual: string;
};

export type CppAmortRow = {
	partNo: string;
	amount: string;
	qty: string;
	perMachineQty: string;
};

export type CppFormValues = {
	materialType: CppMaterialType;
	reason: string;
	effects: CppEffect[];
	/** Optional — mapped from Ariba. The CPP approval ref itself is system generated. */
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
		/** keyed by CPP_ATTACHMENTS[].key */
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
		/** % split of the impact per plant, as typed. */
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
