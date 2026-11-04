// One entry per master. The hub cards, list rows, form and save payload are
// all driven from this file, so adding a master (or a field) is a config change.
import type {
	FeedOption,
	MasterFormValues,
	MasterKey,
	MasterRow,
	SaveMasterPayload,
} from "./masters.types";

export type FieldName = "name" | "code" | "fiscal_year" | "id_desc" | "value";

export type FieldDef = {
	name: FieldName;
	label: string;
	/** Key the backend expects, when it differs from `name` (e.g. grade). */
	payloadKey?: keyof SaveMasterPayload["data"];
	required?: boolean;
	type?: "text" | "number";
	maxLength?: number;
	placeholder?: string;
	/** Span both columns of the form (long text). */
	wide?: boolean;
};

export type ColumnDef = {
	key: string;
	label: string;
	align?: "right";
	/** Text shown in the cell. */
	render: (row: MasterRow) => string;
	/** Drop the column when no row has a value (e.g. data the feed does not send). */
	hideIfEmpty?: boolean;
};

export type MasterDef = {
	key: MasterKey;
	/** Key of this master's array in the GET /master-data response. */
	feedKey: string;
	/** Plural, used in titles and the hub. */
	label: string;
	/** Singular, used in "Add branch". */
	singular: string;
	/** Hub-card subtitle: which fields this master has. */
	fieldsSummary: string;
	fields: FieldDef[];
	/** Columns of the listing table: every field the feed provides. */
	columns: ColumnDef[];
	searchPlaceholder: string;
	/** Feed option -> row shown on this screen. */
	toRow: (option: FeedOption) => MasterRow;
	/** Title of a record (form heading). */
	primary: (row: MasterRow) => string;
};

const NAME_MAX = 120;
const CODE_MAX = 30;

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

// The feed builds some strings with a template literal, so a missing value can
// arrive as the text "null" / "undefined" (e.g. budget description).
const text = (v: unknown): string | null => {
	if (v === undefined || v === null) return null;
	const out = String(v).trim();
	return out === "" || out === "null" || out === "undefined" ? null : out;
};

const num = (v: unknown): number | null =>
	v === undefined || v === null || v === "" || !Number.isFinite(Number(v))
		? null
		: Number(v);

const colName: ColumnDef = {
	key: "name",
	label: "Name",
	render: (r) => r.name,
};
const colCode: ColumnDef = {
	key: "code",
	label: "Code",
	render: (r) => r.code ?? "",
};

const baseRow = (o: FeedOption): MasterRow => ({
	id: String(o.value),
	name: String(o.label ?? ""),
	code: text(o.code),
	fiscal_year: null,
	id_desc: null,
	value: null,
});

const byName = { primary: (r: MasterRow) => r.name };

export const MASTER_DEFS: MasterDef[] = [
	{
		key: "branch",
		columns: [colName, colCode],
		feedKey: "branches",
		label: "Branches",
		singular: "branch",
		fieldsSummary: "name · code",
		searchPlaceholder: "Search name or code",
		fields: [
			{ name: "name", label: "Name", required: true, maxLength: NAME_MAX },
			{ name: "code", label: "Code", maxLength: CODE_MAX },
		],
		toRow: baseRow,
		...byName,
	},
	{
		key: "department",
		columns: [colName, colCode],
		feedKey: "departments",
		label: "Departments",
		singular: "department",
		fieldsSummary: "name · code",
		searchPlaceholder: "Search name or code",
		fields: [
			{ name: "name", label: "Name", required: true, maxLength: NAME_MAX },
			{ name: "code", label: "Code", maxLength: CODE_MAX },
		],
		toRow: baseRow,
		...byName,
	},
	{
		key: "eventName",
		columns: [colName],
		feedKey: "eventNames",
		label: "Event Names",
		singular: "event name",
		fieldsSummary: "name",
		searchPlaceholder: "Search event name",
		fields: [
			{ name: "name", label: "Name", required: true, maxLength: NAME_MAX },
		],
		toRow: baseRow,
		...byName,
	},
	{
		key: "budgetMaster",
		columns: [
			{ key: "code", label: "Budget code", render: (r) => r.code ?? r.name },
			{ key: "id_desc", label: "Description", render: (r) => r.id_desc ?? "" },
			{
				key: "fiscal_year",
				label: "Fiscal year",
				render: (r) => r.fiscal_year ?? "",
				hideIfEmpty: true,
			},
			{
				key: "value",
				label: "Amount (₹)",
				align: "right",
				render: (r) => (r.value !== null ? inr.format(r.value) : ""),
			},
		],
		feedKey: "budgetMasters",
		label: "Budget",
		singular: "budget code",
		fieldsSummary: "code · description · amount",
		searchPlaceholder: "Search code or description",
		// The feed sends label = code, description = id_desc, budgetAmount = value.
		// (fiscal_year is not in the feed, so it is not shown; it can still be set.)
		fields: [
			{
				name: "code",
				label: "Budget code",
				required: true,
				maxLength: CODE_MAX,
			},
			{
				name: "fiscal_year",
				label: "Fiscal year",
				maxLength: 9,
				placeholder: "2026-27",
			},
			{ name: "id_desc", label: "Description", maxLength: 200, wide: true },
			{ name: "value", label: "Amount (₹)", type: "number" },
		],
		toRow: (o) => ({
			id: String(o.value),
			name: String(o.label ?? ""),
			code: text(o.label),
			fiscal_year: text(o.fiscalYear),
			id_desc: text(o.description),
			value: num(o.budgetAmount),
		}),
		primary: (r) => r.code ?? r.name,
	},
	{
		key: "division",
		columns: [colName],
		feedKey: "divisions",
		label: "Divisions",
		singular: "division",
		fieldsSummary: "name",
		searchPlaceholder: "Search division",
		fields: [
			{ name: "name", label: "Name", required: true, maxLength: NAME_MAX },
		],
		toRow: baseRow,
		...byName,
	},
	{
		key: "designation",
		columns: [colName],
		feedKey: "designations",
		label: "Designations",
		singular: "designation",
		fieldsSummary: "name",
		searchPlaceholder: "Search designation",
		fields: [
			{ name: "name", label: "Name", required: true, maxLength: NAME_MAX },
		],
		toRow: baseRow,
		...byName,
	},
	{
		key: "costCenter",
		columns: [colCode, colName],
		feedKey: "costCenters",
		label: "Cost Centers",
		singular: "cost center",
		fieldsSummary: "code · name",
		searchPlaceholder: "Search code or name",
		fields: [
			{ name: "code", label: "Code", required: true, maxLength: CODE_MAX },
			{ name: "name", label: "Name", required: true, maxLength: NAME_MAX },
		],
		toRow: baseRow,
		...byName,
	},
	{
		key: "zone",
		columns: [colName, colCode],
		feedKey: "zones",
		label: "Zones",
		singular: "zone",
		fieldsSummary: "name · code",
		searchPlaceholder: "Search name or code",
		fields: [
			{ name: "name", label: "Name", required: true, maxLength: NAME_MAX },
			{ name: "code", label: "Code", required: true, maxLength: CODE_MAX },
		],
		toRow: baseRow,
		...byName,
	},
	{
		key: "gradeEligibility",
		columns: [
			{ key: "grade", label: "Grade", render: (r) => r.name },
			{
				key: "annualCap",
				label: "Annual cap (₹)",
				align: "right",
				render: (r) => (r.value !== null ? inr.format(r.value) : ""),
			},
		],
		feedKey: "gradeEligibilities",
		label: "Grade Eligibility",
		singular: "grade",
		fieldsSummary: "grade · annual cap",
		searchPlaceholder: "Search grade",
		// Feed: label = grade, annualCap = the cap. The backend expects `grade`
		// and `annualCap` in the payload, hence payloadKey.
		fields: [
			{
				name: "name",
				label: "Grade",
				payloadKey: "grade",
				required: true,
				maxLength: 20,
			},
			{
				name: "value",
				label: "Annual cap (₹)",
				payloadKey: "annualCap",
				type: "number",
				required: true,
			},
		],
		toRow: (o) => ({
			id: String(o.value),
			name: String(o.label ?? ""),
			code: null,
			fiscal_year: null,
			id_desc: null,
			value: num(o.annualCap),
		}),
		primary: (r) => r.name,
	},
];

export const DEFAULT_MASTER_KEY: MasterKey = "branch";

export const getMasterDef = (key: MasterKey): MasterDef =>
	MASTER_DEFS.find((def) => def.key === key) ?? MASTER_DEFS[0];

export const emptyFormValues = (): MasterFormValues => ({
	name: "",
	code: "",
	fiscal_year: "",
	id_desc: "",
	value: "",
});

export const rowToFormValues = (row: MasterRow): MasterFormValues => ({
	name: row.name ?? "",
	code: row.code ?? "",
	fiscal_year: row.fiscal_year ?? "",
	id_desc: row.id_desc ?? "",
	value: row.value === null ? "" : String(row.value),
});

/** Form values -> the `data` object POST /master-data/manage expects. */
export const buildPayloadData = (
	def: MasterDef,
	values: MasterFormValues,
): SaveMasterPayload["data"] => {
	const data: Record<string, string | number> = {};

	for (const field of def.fields) {
		const raw = String(values[field.name] ?? "").trim();
		if (!raw) continue;

		data[field.payloadKey ?? field.name] =
			field.type === "number" ? Number(raw) : raw;
	}

	return data as SaveMasterPayload["data"];
};

/** Returns field-name → message. Empty object means valid. */
export const validateForm = (
	def: MasterDef,
	values: MasterFormValues,
): Partial<Record<FieldName, string>> => {
	const errors: Partial<Record<FieldName, string>> = {};

	for (const field of def.fields) {
		const raw = String(values[field.name] ?? "").trim();

		if (field.required && !raw) {
			errors[field.name] = `${field.label} is required`;
			continue;
		}

		if (field.maxLength && raw.length > field.maxLength) {
			errors[field.name] =
				`${field.label} must be ${field.maxLength} characters or fewer`;
			continue;
		}

		if (field.type === "number" && raw) {
			const n = Number(raw);
			if (!Number.isFinite(n) || n < 0) {
				errors[field.name] = `${field.label} must be a number, 0 or more`;
			}
		}
	}

	return errors;
};
