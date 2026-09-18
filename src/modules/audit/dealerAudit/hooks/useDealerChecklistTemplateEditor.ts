// modules/audit/dealer-audit/hooks/useDealerChecklistTemplateEditor.ts
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { dealerAuditKeys } from "../dealer-audit.queries";
// import { dealerAuditApi } from "../dealer-audit.api";
import type {
	ChecklistSection,
	ChecklistTemplate,
} from "../../shared/shared.audit.types";
import type { ChecklistTemplateDetailsValues } from "../../shared/templates/AuditTemplateDetailsStep";

// const mapTemplateToDetails = (
// 	template: ChecklistTemplate,
// ): ChecklistTemplateDetailsValues => ({
// 	name: template.name,
// 	description: template.description,
// 	facilityType: template.facilityType,
// });

/**
 * Owns loading an existing template (edit mode) and saving it back —
 * the page itself stays a thin wrapper around ChecklistTemplateBuilder.
 * `templateId` undefined means "creating a new template".
 */
export function useDealerChecklistTemplateEditor(
	templateId: string | undefined,
) {
	const queryClient = useQueryClient();
	const [isSaving, setIsSaving] = useState(false);

	// const query = useQuery({
	// 	queryKey: templateId
	// 		? dealerAuditKeys.templateDetail(templateId)
	// 		: dealerAuditKeys.templateDetail("__new__"),
	// 	queryFn: () => dealerAuditApi.getTemplate(templateId as string),
	// 	enabled: Boolean(templateId),
	// });

	// const invalidateTemplateQueries = () => {
	// 	queryClient.invalidateQueries({ queryKey: dealerAuditKeys.templates() });
	// };

	const saveDraft = async (
		details: ChecklistTemplateDetailsValues,
		sections: ChecklistSection[],
	) => {
		// setIsSaving(true);
		// try {
		// 	if (templateId) {
		// 		await dealerAuditApi.updateTemplateDraft({
		// 			id: templateId,
		// 			...details,
		// 			sections,
		// 		});
		// 	} else {
		// 		await dealerAuditApi.createTemplate({ ...details, sections });
		// 	}
		// 	invalidateTemplateQueries();
		// } finally {
		// 	setIsSaving(false);
		// }
	};

	const publish = async (
		details: ChecklistTemplateDetailsValues,
		sections: ChecklistSection[],
	) => {
		// setIsSaving(true);
		// try {
		// 	const template = templateId
		// 		? await dealerAuditApi.updateTemplateDraft({
		// 				id: templateId,
		// 				...details,
		// 				sections,
		// 			})
		// 		: await dealerAuditApi.createTemplate({ ...details, sections });
		// 	await dealerAuditApi.publishTemplate(template.id);
		// 	invalidateTemplateQueries();
		// } finally {
		// 	setIsSaving(false);
		// }
	};

	return {
		// initialDetails: query.data ? mapTemplateToDetails(query.data) : undefined,
		// initialSections: query.data?.sections,
		// isLoading: Boolean(templateId) && query.isLoading,
		isSaving,
		saveDraft,
		publish,
	};
}
