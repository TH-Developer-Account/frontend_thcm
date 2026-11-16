// modules/audit/dealerAudit/hooks/useDealerChecklistTemplateEditor.ts
//
// Owns loading an existing template and saving it back. The page stays a
// thin wrapper around the shared AuditTemplateBuilder.
// `templateId` undefined → creating a new template.
//
// Save flow:
//   first save            → POST  /dealer-audit/templates            (DRAFT v1)
//   later saves (draft)   → PATCH /dealer-audit/templates/:id        (sends expectedUpdatedAt)
//   editing a published / archived template
//                         → POST  /templates/:id/new-draft, then PATCH the new draft
//   publish               → save, then POST /templates/:id/publish

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "../../../../context/Auth/AuthContext";
import {
	getApiFieldErrors,
	getAuditActionErrorMessage,
	type ServerFieldError,
} from "../../shared/audit-error.utils";
import type { AuditTemplateBuilderValues } from "../../shared/templates/audit.template.types";
import { dealerAuditKeys } from "../dealer-audit.queries";
import { dealerTemplateApi } from "../templates/dealer-template.api";
import {
	getReferencePhotoKeys,
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

export function useDealerChecklistTemplateEditor(
	templateId: string | undefined,
) {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const detailQuery = useDealerChecklistTemplate(templateId);

	// Template saved during THIS session. A new template gets its id on the
	// first save; later saves must target that id, not create another draft.
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
		mutationFn: async (values: AuditTemplateBuilderValues) => {
			if (!currentTemplate) {
				return dealerTemplateApi.createTemplate(
					mapBuilderValuesToCreateDealerTemplatePayload(values),
				);
			}

			// Published / archived versions are immutable: editing one starts
			// the next draft version, then the changes are saved onto it.
			// (Photo keys are looked up from the version the form was loaded
			// from, so they must be read BEFORE switching to the new draft.)
			const photoKeys = getReferencePhotoKeys(currentTemplate);
			const target =
				currentTemplate.status === "DRAFT"
					? currentTemplate
					: await dealerTemplateApi.createNewDraft(currentTemplate.id);

			return dealerTemplateApi.updateTemplate({
				templateId: target.id,
				payload: mapBuilderValuesToUpdateDealerTemplatePayload(
					values,
					target.updatedAt,
					photoKeys,
				),
			});
		},
		onSuccess: cacheSavedTemplate,
	});

	const publishMutation = useMutation({
		mutationFn: (template: DealerChecklistTemplate) =>
			dealerTemplateApi.publishTemplate(template.id, template.updatedAt),
		onSuccess: cacheSavedTemplate,
	});

	// Toast shows the server's real message (e.g. "A template with this name
	// already exists…"); field errors are also pushed onto the form fields.
	const showError = (
		error: unknown,
		title: string,
		applyServerErrors?: (errors: ServerFieldError[]) => void,
	) => {
		const fieldErrors = getApiFieldErrors(error);
		if (fieldErrors.length > 0) applyServerErrors?.(fieldErrors);
		showToast({
			type: "error",
			title,
			description: getAuditActionErrorMessage(error, TEMPLATE_SUBJECT),
		});
	};

	const saveDraft = async (
		values: AuditTemplateBuilderValues,
		applyServerErrors?: (errors: ServerFieldError[]) => void,
	): Promise<AuditTemplateBuilderValues | null> => {
		if (saveMutation.isPending || publishMutation.isPending) return null;
		try {
			const template = await saveMutation.mutateAsync(values);
			return mapDealerTemplateToBuilderValues(template);
		} catch (error) {
			showError(error, "Draft not saved", applyServerErrors);
			return null;
		}
	};

	const publish = async (
		values: AuditTemplateBuilderValues,
		applyServerErrors?: (errors: ServerFieldError[]) => void,
	): Promise<boolean> => {
		if (saveMutation.isPending || publishMutation.isPending) return false;
		setIsPublishFlow(true);
		try {
			const saved = await saveMutation.mutateAsync(values);
			await publishMutation.mutateAsync(saved);
			showToast({
				type: "success",
				title: "Template published",
				description: `"${saved.name}" is now available for new audits.`,
			});
			return true;
		} catch (error) {
			showError(error, "Template not published", applyServerErrors);
			return false;
		} finally {
			setIsPublishFlow(false);
		}
	};

	return {
		template: currentTemplate,
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
