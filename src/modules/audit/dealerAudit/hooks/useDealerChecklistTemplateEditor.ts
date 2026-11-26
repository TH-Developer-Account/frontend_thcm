// modules/audit/dealerAudit/hooks/useDealerChecklistTemplateEditor.ts
//
// Owns loading an existing template and saving it back. The page stays a
// thin wrapper around the shared AuditTemplateBuilder.
// `templateId` undefined → creating a new template.
//
// Save flow:
//   first save            → POST  /dealer-audit/templates            (DRAFT v1)
//   later saves (draft)   → PATCH /dealer-audit/templates/:id        (sends expectedUpdatedAt)
//   publish               → save, then POST /templates/:id/publish
//
// Published / archived versions are immutable. They are opened read-only
// (`isReadOnlyVersion`) and changed through "New version" (library / view
// page), which creates the next draft and opens THAT draft here. The
// new-draft-on-save branch below is only a safety net for a stale tab.
//
// Reference images are uploaded the moment they are picked
// (POST /templates/reference-photos); the form then holds only the returned
// key, which is saved with the parameter.

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "../../../../context/Auth/AuthContext";
import {
	getApiFieldErrors,
	getAuditActionErrorMessage,
	getHttpStatus,
	type ServerFieldError,
} from "../../shared/audit-error.utils";
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

/** "…was updated by another user." → "…was updated by another user" */
const withoutTrailingPunctuation = (message: string): string =>
	message.replace(/[.\s]+$/, "");

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

	// Status of the version this page was OPENED on. Publishing from here
	// flips the cached status to PUBLISHED, which must not turn the page
	// read-only mid-flow, so it is captured once per template.
	const [loaded, setLoaded] = useState<{
		id: string;
		status: DealerChecklistTemplate["status"];
	} | null>(null);
	if (detailQuery.data && loaded?.id !== detailQuery.data.id) {
		setLoaded({ id: detailQuery.data.id, status: detailQuery.data.status });
	}
	const isReadOnlyVersion = loaded !== null && loaded.status !== "DRAFT";

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
		// Publishing archives the previous version, so other cached details
		// are stale. Marked only — nothing refetches until it is opened.
		void queryClient.invalidateQueries({
			queryKey: dealerAuditKeys.templateDetails(),
			refetchType: "none",
		});
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

			// Safety net: a published / archived version is immutable, so a
			// stale tab starts the next draft and saves onto that instead.
			const target =
				currentTemplate.status === "DRAFT"
					? currentTemplate
					: await dealerTemplateApi.createNewDraft(currentTemplate.id);

			return dealerTemplateApi.updateTemplate({
				templateId: target.id,
				payload: mapBuilderValuesToUpdateDealerTemplatePayload(
					values,
					target.updatedAt,
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
	// A 409 means someone else saved first: say so and how to recover.
	const showError = (
		error: unknown,
		title: string,
		applyServerErrors?: (errors: ServerFieldError[]) => void,
	) => {
		const fieldErrors = getApiFieldErrors(error);
		if (fieldErrors.length > 0) applyServerErrors?.(fieldErrors);

		const message = getAuditActionErrorMessage(error, TEMPLATE_SUBJECT);
		const isConflict = getHttpStatus(error) === 409;
		showToast({
			type: "error",
			title: isConflict ? "Template was changed elsewhere" : title,
			description: isConflict
				? `${withoutTrailingPunctuation(message)}. Reload the page to get the latest version; edits not saved here will be lost.`
				: message,
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

	/** Uploads one reference image; the builder stores the returned key. */
	const uploadReferencePhoto = (file: File) =>
		dealerTemplateApi.uploadReferencePhoto(file);

	return {
		template: currentTemplate,
		initialValues,
		/** Opened on a PUBLISHED / ARCHIVED version — send to the view page. */
		isReadOnlyVersion,
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
		uploadReferencePhoto,
	};
}
