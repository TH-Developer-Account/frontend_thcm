// helpers/cpp.mapper.ts — the ONLY place the form shape and the API shape meet.
//
//   form  ->  formToPayload()   ->  POST/PUT /cpp   { category, plant, condition, sections[] }
//   API   ->  detailToForm()    ->  form (edit a draft)
//   API   ->  toCppListingRow() ->  listing table
//
// Files never travel in the JSON: they are uploaded one by one to
// POST /cpp/:id/attachments (see pendingFileChanges) and come back as
// `attachments`, which detailToForm turns into remote FileUploadValues.
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import type {
	CppAttachment,
	CppDetail,
	CppFormValues,
	CppListItem,
	CppListingRow,
	CppRequestPayload,
	CppSection,
	CppSectionKey,
	DecimalValue,
} from "../types/cpp.types";
import { CPP_ATTACHMENTS, getDefaultValues } from "../utils/cpp.utils";

export const CPP_PURCHASING_FILE_TYPE = "purchasingFile";

/** Every slot that can hold a file: the purchasing Excel + the 10 supporting documents. */
export const CPP_FILE_SLOTS = [
	CPP_PURCHASING_FILE_TYPE,
	...CPP_ATTACHMENTS.map((item) => item.key),
] as const;

/* --------------------------------- numbers -------------------------------- */

export const toNumber = (value: DecimalValue | undefined): number | null => {
	if (value === null || value === undefined || value === "") return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

/* ------------------------------ form -> payload --------------------------- */

const text = (value: unknown): string =>
	typeof value === "string" ? value.trim() : "";

const supplier = (value: CppFormValues["suppliers"]["existing"]) => ({
	partnerId: text(value.partnerId),
	name: text(value.name),
	code: text(value.code),
	manual: value.manual === true,
});

/** Plain data of each wizard tab. Only fields the server stores are sent. */
export const formToSections = (
	values: CppFormValues,
): NonNullable<CppRequestPayload["sections"]> => [
	{
		key: "basic",
		data: {
			materialType: values.materialType,
			effects: values.effects,
			reason: text(values.reason),
			priceType: values.priceType,
			justification: text(values.justification),
			initiationDate: values.initiationDate,
			workflow: {
				models: values.workflow.models,
				plants: values.workflow.plants,
				pricingCondition: text(values.workflow.pricingCondition),
			},
		},
	},
	{
		key: "purchasing",
		data: {
			suppliers: {
				existing: supplier(values.suppliers.existing),
				other: supplier(values.suppliers.other),
				recommended: supplier(values.suppliers.recommended),
			},
			approvalValues: {
				partValue: text(values.approvalValues.partValue),
				variationPct: text(values.approvalValues.variationPct),
				amount: text(values.approvalValues.amount),
			},
		},
	},
	{
		key: "master",
		data: {
			materialGroup: text(values.masterData.materialGroup),
			materialType: text(values.masterData.materialType),
			purchasingGroup: text(values.masterData.purchasingGroup),
			incoTerms: text(values.masterData.incoTerms),
			taxCode: text(values.masterData.taxCode),
			storeLocation: text(values.masterData.storeLocation),
			validFrom: values.masterData.validFrom,
			updateSourceList: text(values.masterData.updateSourceList),
			note: text(values.masterData.note),
		},
	},
	{ key: "other", data: { remarks: text(values.other.remarks) } },
];

export const formToPayload = (values: CppFormValues): CppRequestPayload => ({
	category: values.category || null,
	plant: values.plant || null,
	condition: values.condition || null,
	sections: formToSections(values),
});

/* ------------------------------- files (form) ----------------------------- */

const MIME_BY_EXTENSION: Record<string, string> = {
	pdf: "application/pdf",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	doc: "application/msword",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	xls: "application/vnd.ms-excel",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	csv: "text/csv",
};

const extensionOf = (fileName: string): string =>
	fileName.includes(".") ? (fileName.split(".").pop() ?? "").toLowerCase() : "";

/** The server stores only the file name; the type is worked out from the extension. */
export const mimeFromName = (fileName: string): string =>
	MIME_BY_EXTENSION[extensionOf(fileName)] ?? "application/octet-stream";

/** A file that already lives on the server, shaped for FileUploadField. */
export const attachmentToFileValue = (
	attachment: CppAttachment,
): FileUploadValue => ({
	id: attachment.id,
	file: null,
	url: attachment.url ?? "",
	name: attachment.fileName,
	type: mimeFromName(attachment.fileName),
	size: 0,
	extension: extensionOf(attachment.fileName),
	sizeLabel: "",
	isLocal: false,
});

const fileForSlot = (
	values: CppFormValues,
	slot: string,
): FileUploadValue | null =>
	slot === CPP_PURCHASING_FILE_TYPE
		? values.purchasingFile
		: (values.attachments[slot] ?? null);

export type FileChange =
	| { kind: "upload"; slot: string; file: File }
	| { kind: "delete"; slot: string; attachmentId: string };

/**
 * What has to happen on the server so its files match the form:
 *  - a freshly picked file (isLocal + File)  -> upload (server replaces the slot)
 *  - a slot emptied in the form that has a stored file -> delete
 * Deletes come first so a slot is never uploaded to and then deleted.
 */
export const pendingFileChanges = (
	values: CppFormValues,
	stored: CppAttachment[],
): FileChange[] => {
	const changes: FileChange[] = [];
	for (const slot of CPP_FILE_SLOTS) {
		const current = fileForSlot(values, slot);
		const existing = stored.find((item) => item.type === slot);
		if (!current && existing)
			changes.push({ kind: "delete", slot, attachmentId: existing.id });
		else if (current?.isLocal && current.file instanceof File)
			changes.push({ kind: "upload", slot, file: current.file });
	}
	return changes.sort((a, b) =>
		a.kind === b.kind ? 0 : a.kind === "delete" ? -1 : 1,
	);
};

/* ------------------------------ payload -> form --------------------------- */

const sectionData = (
	sections: CppSection[],
	key: CppSectionKey,
): Record<string, unknown> =>
	sections.find((section) => section.key === key)?.data ?? {};

const pick = <T extends object>(base: T, source: unknown): T => {
	// Copies only keys that exist in `base`, so a new server field never leaks into the form.
	if (typeof source !== "object" || source === null) return base;
	const out = { ...base } as Record<string, unknown>;
	for (const key of Object.keys(base)) {
		const incoming = (source as Record<string, unknown>)[key];
		const fallback = (base as Record<string, unknown>)[key];
		if (incoming === undefined || incoming === null) continue;
		out[key] =
			typeof fallback === "object" &&
			fallback !== null &&
			!Array.isArray(fallback)
				? pick(fallback as object, incoming)
				: incoming;
	}
	return out as T;
};

export const detailToForm = (detail: CppDetail): CppFormValues => {
	const defaults = getDefaultValues();
	const basic = sectionData(detail.sections, "basic");
	const purchasing = sectionData(detail.sections, "purchasing");
	const master = sectionData(detail.sections, "master");
	const other = sectionData(detail.sections, "other");

	const files = Object.fromEntries(
		detail.attachments.map((item) => [item.type, attachmentToFileValue(item)]),
	);

	return {
		...defaults,
		category: detail.category ?? "",
		plant: detail.plant ?? "",
		condition: detail.condition ?? "",
		materialType: (basic.materialType as CppFormValues["materialType"]) || "",
		effects: Array.isArray(basic.effects)
			? (basic.effects as CppFormValues["effects"])
			: [],
		reason: String(basic.reason ?? ""),
		priceType: String(basic.priceType ?? "") || defaults.priceType,
		justification: String(basic.justification ?? ""),
		initiationDate:
			String(basic.initiationDate ?? "") || defaults.initiationDate,
		workflow: {
			...defaults.workflow,
			...pick(
				{
					models: [] as string[],
					plants: [] as CppFormValues["workflow"]["plants"],
					pricingCondition: "",
				},
				basic.workflow,
			),
		},
		suppliers: pick(defaults.suppliers, purchasing.suppliers),
		approvalValues: pick(defaults.approvalValues, purchasing.approvalValues),
		purchasingFile: files[CPP_PURCHASING_FILE_TYPE] ?? null,
		masterData: {
			...defaults.masterData,
			...pick(
				{
					materialGroup: "",
					materialType: "",
					purchasingGroup: "",
					incoTerms: "",
					taxCode: "",
					storeLocation: "",
					validFrom: "",
					updateSourceList: "",
					note: "",
				},
				master,
			),
		},
		other: pick(defaults.other, other),
		attachments: Object.fromEntries(
			CPP_ATTACHMENTS.map((item) => [item.key, files[item.key] ?? null]),
		),
	};
};

/* --------------------------------- listing -------------------------------- */

/** Which amount the condition's bands read, with its label. */
const amountOf = (
	item: CppListItem,
): { amount: number | null; label: string } => {
	const annualisedValue = toNumber(item.annualisedValue);
	if (annualisedValue !== null)
		return { amount: annualisedValue, label: "Annualised value" };
	const annualisedImpact = toNumber(item.annualisedImpact);
	if (annualisedImpact !== null)
		return { amount: annualisedImpact, label: "Annualised impact" };
	const actualImpact = toNumber(item.actualImpact);
	if (actualImpact !== null)
		return { amount: actualImpact, label: "Actual impact" };
	return { amount: null, label: "—" };
};

export const toCppListingRow = (item: CppListItem): CppListingRow => {
	const { amount, label } = amountOf(item);
	return {
		id: item.id,
		referenceNumber: item.referenceNumber || "—",
		status: item.status || "--",
		category: item.category || "—",
		plant: item.plant || "—",
		condition: item.condition || "—",
		supplier:
			[item.supplierCode, item.supplierName].filter(Boolean).join(" · ") || "—",
		reason: item.reasonCode?.trim() || "—",
		amount,
		amountLabel: label,
		isSpare: item.isSpare,
		updatedAt: item.updated_at,
	};
};
