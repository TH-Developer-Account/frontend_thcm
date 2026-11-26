// modules/audit/shared/audit-api-log.ts
//
// Development-only console logging for audit API calls, so every request
// and response can be checked while the backend is still being built.
//
// Safety: nothing is logged outside development builds, and values that
// must never reach a console (tokens, files, base64 image data, blob URLs)
// are replaced before printing.

const SENSITIVE_KEY = /token|authorization|password|secret|cookie/i;
const MAX_STRING_LENGTH = 200;

const sanitize = (value: unknown, depth = 0): unknown => {
	if (value === null || value === undefined) return value;
	if (depth > 8) return "[max depth]";

	if (typeof value === "string") {
		if (value.startsWith("data:")) return "[data-uri omitted]";
		if (value.startsWith("blob:")) return "[blob-url omitted]";
		return value.length > MAX_STRING_LENGTH
			? `${value.slice(0, MAX_STRING_LENGTH)}… [${value.length} chars]`
			: value;
	}
	if (typeof value !== "object") return value;

	if (typeof File !== "undefined" && value instanceof File) {
		return `[File ${value.name} ${value.size}B ${value.type}]`;
	}
	if (typeof Blob !== "undefined" && value instanceof Blob) {
		return `[Blob ${value.size}B ${value.type}]`;
	}
	if (typeof FormData !== "undefined" && value instanceof FormData) {
		const entries: Record<string, unknown> = {};
		value.forEach((entry, key) => {
			entries[key] = sanitize(entry, depth + 1);
		});
		return { "[FormData]": entries };
	}
	if (Array.isArray(value)) return value.map((v) => sanitize(v, depth + 1));

	return Object.fromEntries(
		Object.entries(value).map(([key, entry]) => [
			key,
			SENSITIVE_KEY.test(key) ? "[redacted]" : sanitize(entry, depth + 1),
		]),
	);
};

export type AuditApiLogSource = "MOCK" | "LIVE";

export interface AuditApiLogEntry {
	/** Human readable operation, e.g. "saveAuditItem". */
	operation: string;
	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	/** Path the LIVE call will use. */
	url: string;
	source: AuditApiLogSource;
	params?: unknown;
	payload?: unknown;
	response?: unknown;
	error?: unknown;
}

const isLoggingEnabled = (): boolean => import.meta.env.DEV === true;

export function logAuditApi(entry: AuditApiLogEntry): void {
	if (!isLoggingEnabled()) return;

	const title = `[DealerAudit API · ${entry.source}] ${entry.method} ${entry.url} — ${entry.operation}`;
	console.groupCollapsed(title);
	if (entry.params !== undefined) console.log("params  :", sanitize(entry.params));
	if (entry.payload !== undefined) console.log("payload :", sanitize(entry.payload));
	if (entry.response !== undefined) console.log("response:", sanitize(entry.response));
	if (entry.error !== undefined) console.error("error   :", sanitize(entry.error));
	console.groupEnd();
}

export { sanitize as sanitizeForAuditLog };
