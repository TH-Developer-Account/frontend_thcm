// modules/audit/shared/templates/audit-template.status.ts
//
// The ONLY place template status → label / badge variant is defined.

import type { TemplateLifecycleStatus } from "./audit.template.types";

export type TemplateStatusBadgeVariant = "neutral" | "success" | "warning";

const assertNever = (value: never): never => {
	throw new Error(`Unhandled template status: ${String(value)}`);
};

export function getTemplateStatusLabel(status: TemplateLifecycleStatus): string {
	switch (status) {
		case "DRAFT":
			return "Draft";
		case "PUBLISHED":
			return "Published";
		case "ARCHIVED":
			return "Archived";
		default:
			return assertNever(status);
	}
}

export function getTemplateStatusBadgeVariant(
	status: TemplateLifecycleStatus,
): TemplateStatusBadgeVariant {
	switch (status) {
		case "DRAFT":
			return "neutral";
		case "PUBLISHED":
			return "success";
		case "ARCHIVED":
			return "neutral";
		default:
			return assertNever(status);
	}
}

export const TEMPLATE_STATUS_FILTER_TABS: ReadonlyArray<{
	label: string;
	value: TemplateLifecycleStatus | "ALL";
}> = [
	{ label: "All", value: "ALL" },
	{ label: "Published", value: "PUBLISHED" },
	{ label: "Drafts", value: "DRAFT" },
	{ label: "Archived", value: "ARCHIVED" },
];
