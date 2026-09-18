// modules/audit/dealer-audit/hooks/useDealerChecklistTemplates.ts
// import { useQuery } from "@tanstack/react-query";
// import { dealerAuditKeys } from "../dealer-audit.queries";
// import { dealerAuditApi } from "../dealer-audit.api";
// import type { ChecklistTemplate } from "../checklist-library.constants";
// import type { ChecklistCardProps } from "../../shared/checklist/ChecklistCard";

// const mapTemplateToCardProps = (
// 	template: ChecklistTemplate,
// ): ChecklistCardProps => {
// 	const parameterCount = template.sections.reduce(
// 		(sum, section) => sum + section.parameters.length,
// 		0,
// 	);

// 	return {
// 		id: template.id,
// 		title: template.name,
// 		description: template.description,
// 		status: template.status,
// 		sectionCount: template.sections.length,
// 		pointCount: parameterCount,
// 		readiness: template.status === "published" ? 100 : 0,
// 		updatedLabel: new Date(template.updatedAt).toLocaleDateString(),
// 	};
// };

export function useDealerChecklistTemplates() {
	// const query = useQuery({
	// 	queryKey: dealerAuditKeys.templateList({
	// 		officeType: undefined,
	// 		isActive: undefined,
	// 	}),
	// 	queryFn: () => dealerAuditApi.getTemplates({}),
	// });
	// return {
	// 	templates: (query.data ?? []).map(mapTemplateToCardProps),
	// 	isLoading: query.isLoading,
	// 	error: query.isError
	// 		? "Couldn't load checklist templates. Please retry."
	// 		: null,
	// };
}
