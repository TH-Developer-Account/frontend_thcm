// modules/audit/dealerAudit/hooks/useDealerChecklistTemplateEditor.ts
//
// Owns loading an existing template and saving it back. The page stays a
// thin wrapper around the shared AuditTemplateBuilder.
// `templateId` undefined → creating a new template.

import { useMemo, useState } from "react";
import {
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { useToast } from "../../../../context/Auth/AuthContext";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import type { AuditTemplateBuilderValues } from "../../shared/templates/audit.template.types";
import { dealerAuditKeys } from "../dealer-audit.queries";
import { dealerTemplateApi } from "../templates/dealer-template.api";
import {
	mapBuilderValuesToCreateDealerTemplatePayload,
	mapBuilderValuesToUpdateDealerTemplatePayload,
	mapDealerTemplateToBuilderValues,
} from "../templates/dealer-template.mappers";
import type { DealerChecklistTemplate } from "../templates/dealer-template.types";

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

export function useDealerChecklistTemplateEditor(templateId: string | undefined) {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const detailQuery = useDealerChecklistTemplate(templateId);

	// The template saved during THIS session (a new template gets its id on
	// first save; every save returns a new version for the concurrency guard).
	const [savedTemplate, setSavedTemplate] =
		useState<DealerChecklistTemplate | null>(null);

	const [isPublishFlow, setIsPublishFlow] = useState(false);

	const currentTemplate = savedTemplate ?? detailQuery.data ?? null;

	// Read once by the builder on mount; memoized so client ids stay stable.
	const initialValues = useMemo(
		() =>
			detailQuery.data
				? mapDealerTemplateToBuilderValues(detailQuery.data)
				: undefined,
		[detailQuery.data],
	);

	const cacheSavedTemplate = (template: DealerChecklistTemplate) => {
		setSavedTemplate(template);
		queryClient.setQueryData(
			dealerAuditKeys.templateDetail(template.id),
			template,
		);
		void queryClient.invalidateQueries({
			queryKey: dealerAuditKeys.templateLists(),
		});
	};

	const saveMutation = useMutation({
		mutationFn: (values: AuditTemplateBuilderValues) =>
			currentTemplate
				? dealerTemplateApi.updateTemplate({
						templateId: currentTemplate.id,
						payload: mapBuilderValuesToUpdateDealerTemplatePayload(
							values,
							currentTemplate.version,
						),
					})
				: dealerTemplateApi.createTemplate(
						mapBuilderValuesToCreateDealerTemplatePayload(values),
					),
		onSuccess: cacheSavedTemplate,
	});

	const publishMutation = useMutation({
		mutationFn: (id: string) => dealerTemplateApi.publishTemplate(id),
		onSuccess: cacheSavedTemplate,
	});

	const showError = (error: unknown, title: string) =>
		showToast({
			type: "error",
			title,
			description: getAuditActionErrorMessage(error, TEMPLATE_SUBJECT),
		});

	/** Resolves with the server's values, or null when the save failed. */
	const saveDraft = async (
		values: AuditTemplateBuilderValues,
	): Promise<AuditTemplateBuilderValues | null> => {
		if (saveMutation.isPending || publishMutation.isPending) return null;
		try {
			const template = await saveMutation.mutateAsync(values);
			return mapDealerTemplateToBuilderValues(template);
		} catch (error) {
			showError(error, "Draft not saved");
			return null;
		}
	};

	/** Saves the latest edits, then publishes. Resolves true on success. */
	const publish = async (values: AuditTemplateBuilderValues): Promise<boolean> => {
		if (saveMutation.isPending || publishMutation.isPending) return false;
		setIsPublishFlow(true);
		try {
			const saved = await saveMutation.mutateAsync(values);
			await publishMutation.mutateAsync(saved.id);
			showToast({
				type: "success",
				title: "Template published",
				description: `"${saved.name}" is now available for new audits.`,
			});
			return true;
		} catch (error) {
			showError(error, "Template not published");
			return false;
		} finally {
			setIsPublishFlow(false);
		}
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
		isSaving: saveMutation.isPending && !isPublishFlow,
		isPublishing: isPublishFlow,
		lastSavedLabel: formatSavedLabel(savedTemplate?.updatedAt ?? null),
		saveDraft,
		publish,
	};
}
