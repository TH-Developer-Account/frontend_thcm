// modules/audit/dealerAudit/hooks/useDealerChecklistTemplateEditor.ts
//
// Owns loading an existing template and saving it back. The page stays a
// thin wrapper around the shared AuditTemplateBuilder.
// `templateId` undefined → creating a new template.
//
// TODO: save / publish API calls are commented out until the backend is
// ready. Search for "TODO(api)" to re-enable them.

import { useMemo, useState } from "react";
import {
	// TODO(api): useMutation, useQueryClient
	useQuery,
} from "@tanstack/react-query";

import { useToast } from "../../../../context/Auth/AuthContext";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import type { AuditTemplateBuilderValues } from "../../shared/templates/audit.template.types";
import { dealerAuditKeys } from "../dealer-audit.queries";
import { dealerTemplateApi } from "../templates/dealer-template.api";
import {
	// TODO(api): mapBuilderValuesToCreateDealerTemplatePayload,
	// TODO(api): mapBuilderValuesToUpdateDealerTemplatePayload,
	mapDealerTemplateToBuilderValues,
} from "../templates/dealer-template.mappers";
// TODO(api): import type { DealerChecklistTemplate } from "../templates/dealer-template.types";

const TEMPLATE_SUBJECT = "template";

/** Detail query — shared by the editor and the view page. */
export function useDealerChecklistTemplate(templateId: string | undefined) {
	return useQuery({
		queryKey: dealerAuditKeys.templateDetail(templateId ?? ""),
		queryFn: ({ signal }) =>
			dealerTemplateApi.getTemplate(templateId ?? "", signal),
		enabled: Boolean(templateId),
		staleTime: 60_000,
	});
}

const formatSavedLabel = (isoDate: string | null): string | null => {
	if (!isoDate) return null;
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) return null;
	return `Draft saved at ${date.toLocaleTimeString("en-IN", {
		hour: "2-digit",
		minute: "2-digit",
	})}`;
};

export function useDealerChecklistTemplateEditor(
	templateId: string | undefined,
) {
	// TODO(api): const queryClient = useQueryClient();
	const { showToast } = useToast();
	const detailQuery = useDealerChecklistTemplate(templateId);

	// Temporary: time of the last local "save", used only for the footer label.
	const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

	// TODO(api): replace lastSavedAt with the template saved during THIS session
	// (a new template gets its id on first save; every save returns a new
	// version for the concurrency guard).
	// const [savedTemplate, setSavedTemplate] =
	// 	useState<DealerChecklistTemplate | null>(null);
	// const [isPublishFlow, setIsPublishFlow] = useState(false);
	// const currentTemplate = savedTemplate ?? detailQuery.data ?? null;

	// Read once by the builder on mount; memoized so client ids stay stable.
	const initialValues = useMemo(
		() =>
			detailQuery.data
				? mapDealerTemplateToBuilderValues(detailQuery.data)
				: undefined,
		[detailQuery.data],
	);

	// TODO(api)
	// const cacheSavedTemplate = (template: DealerChecklistTemplate) => {
	// 	setSavedTemplate(template);
	// 	queryClient.setQueryData(
	// 		dealerAuditKeys.templateDetail(template.id),
	// 		template,
	// 	);
	// 	void queryClient.invalidateQueries({
	// 		queryKey: dealerAuditKeys.templateLists(),
	// 	});
	// };

	// TODO(api)
	// const saveMutation = useMutation({
	// 	mutationFn: (values: AuditTemplateBuilderValues) =>
	// 		currentTemplate
	// 			? dealerTemplateApi.updateTemplate({
	// 					templateId: currentTemplate.id,
	// 					payload: mapBuilderValuesToUpdateDealerTemplatePayload(
	// 						values,
	// 						currentTemplate.version,
	// 					),
	// 				})
	// 			: dealerTemplateApi.createTemplate(
	// 					mapBuilderValuesToCreateDealerTemplatePayload(values),
	// 				),
	// 	onSuccess: cacheSavedTemplate,
	// });

	// TODO(api)
	// const publishMutation = useMutation({
	// 	mutationFn: (id: string) => dealerTemplateApi.publishTemplate(id),
	// 	onSuccess: cacheSavedTemplate,
	// });

	// TODO(api)
	// const showError = (error: unknown, title: string) =>
	// 	showToast({
	// 		type: "error",
	// 		title,
	// 		description: getAuditActionErrorMessage(error, TEMPLATE_SUBJECT),
	// 	});

	/**
	 * Temporary: no request is sent. Echoing the values back lets the builder
	 * clear its dirty flag and continue to the next step.
	 */
	const saveDraft = async (
		values: AuditTemplateBuilderValues,
	): Promise<AuditTemplateBuilderValues | null> => {
		setLastSavedAt(new Date().toISOString());
		return values;

		// TODO(api): restore the real save below and remove the stub above.
		// if (saveMutation.isPending || publishMutation.isPending) return null;
		// try {
		// 	const template = await saveMutation.mutateAsync(values);
		// 	return mapDealerTemplateToBuilderValues(template);
		// } catch (error) {
		// 	showError(error, "Draft not saved");
		// 	return null;
		// }
	};

	/** Temporary: no request is sent. Resolves true so the page can navigate. */
	const publish = async (
		_values: AuditTemplateBuilderValues,
	): Promise<boolean> => {
		showToast({
			type: "success",
			title: "Publish skipped",
			description: "The API is not connected yet, so nothing was published.",
		});
		return true;

		// TODO(api): restore the real save-then-publish flow below.
		// if (saveMutation.isPending || publishMutation.isPending) return false;
		// setIsPublishFlow(true);
		// try {
		// 	const saved = await saveMutation.mutateAsync(values);
		// 	await publishMutation.mutateAsync(saved.id);
		// 	showToast({
		// 		type: "success",
		// 		title: "Template published",
		// 		description: `"${saved.name}" is now available for new audits.`,
		// 	});
		// 	return true;
		// } catch (error) {
		// 	showError(error, "Template not published");
		// 	return false;
		// } finally {
		// 	setIsPublishFlow(false);
		// }
	};

	return {
		template: detailQuery.data ?? null,
		initialValues,
		isLoading: Boolean(templateId) && detailQuery.isLoading,
		isError: detailQuery.isError,
		loadErrorMessage: detailQuery.isError
			? getAuditActionErrorMessage(detailQuery.error, TEMPLATE_SUBJECT)
			: null,
		refetch: detailQuery.refetch,
		isSaving: false, // TODO(api): saveMutation.isPending && !isPublishFlow
		isPublishing: false, // TODO(api): isPublishFlow
		lastSavedLabel: formatSavedLabel(lastSavedAt),
		saveDraft,
		publish,
	};
}
