// modules/audit/dealerAudit/hooks/useDealerChecklistTemplates.ts
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { useToast } from "../../../../context/Auth/AuthContext";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import { dealerAuditKeys } from "../dealer-audit.queries";
import { dealerTemplateApi } from "../templates/dealer-template.api";
import {
	mapDealerTemplateListItemToRow,
	normalizeDealerTemplateListParams,
} from "../templates/dealer-template.mappers";
import type {
	DealerChecklistTemplate,
	DealerChecklistTemplateListParams,
} from "../templates/dealer-template.types";

/** Server-side paginated / sorted / filtered template list. */
export function useDealerChecklistTemplates(
	params: DealerChecklistTemplateListParams,
) {
	const normalizedParams = normalizeDealerTemplateListParams(params);

	const query = useQuery({
		queryKey: dealerAuditKeys.templateList(normalizedParams),
		queryFn: ({ signal }) =>
			dealerTemplateApi.getTemplates(normalizedParams, signal),
		// Keep the current page visible while the next one loads.
		placeholderData: keepPreviousData,
		staleTime: 30_000,
	});

	return {
		rows: (query.data?.items ?? []).map(mapDealerTemplateListItemToRow),
		totalItems: query.data?.totalItems ?? 0,
		totalPages: query.data?.totalPages ?? 0,
		isLoading: query.isLoading,
		isFetching: query.isFetching,
		isError: query.isError,
		errorMessage: query.isError
			? getAuditActionErrorMessage(query.error, "template list")
			: null,
		refetch: query.refetch,
	};
}

/** Delete with targeted cache cleanup — no whole-app invalidation. */
export function useDeleteDealerChecklistTemplate() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	return useMutation({
		mutationFn: (templateId: string) =>
			dealerTemplateApi.deleteTemplate(templateId),
		onSuccess: (_result, templateId) => {
			queryClient.removeQueries({
				queryKey: dealerAuditKeys.templateDetail(templateId),
			});
			void queryClient.invalidateQueries({
				queryKey: dealerAuditKeys.templateLists(),
			});
			showToast({
				type: "success",
				title: "Template deleted",
				description: "The checklist template has been removed.",
			});
		},
		// Error is rendered inside the confirm dialog (see page), not toasted,
		// so the user keeps context and can retry.
	});
}

/**
 * A lifecycle change on one version (archive / new draft) can also change
 * its siblings (publishing archives the previous version), so every other
 * cached detail is marked stale. The changed template itself is written
 * straight into the cache from the response.
 */
function useCacheLifecycleResult() {
	const queryClient = useQueryClient();

	return (template: DealerChecklistTemplate) => {
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
}

/** PUBLISHED → ARCHIVED. Error is shown inside the confirm dialog. */
export function useArchiveDealerChecklistTemplate() {
	const { showToast } = useToast();
	const cacheResult = useCacheLifecycleResult();

	return useMutation({
		mutationFn: (templateId: string) =>
			dealerTemplateApi.archiveTemplate(templateId),
		onSuccess: (template) => {
			cacheResult(template);
			showToast({
				type: "success",
				title: "Template archived",
				description: `"${template.name}" v${template.version} can no longer be used for new audits.`,
			});
		},
	});
}

/**
 * PUBLISHED / ARCHIVED → next DRAFT version. The caller navigates to the
 * returned draft's editor. Errors (e.g. "a draft already exists") are
 * toasted with the server's own message.
 */
export function useCreateDealerChecklistTemplateVersion() {
	const { showToast } = useToast();
	const cacheResult = useCacheLifecycleResult();

	return useMutation({
		mutationFn: (templateId: string) =>
			dealerTemplateApi.createNewDraft(templateId),
		onSuccess: (draft) => {
			cacheResult(draft);
			showToast({
				type: "success",
				title: `Draft v${draft.version} created`,
				description: "Make your changes, then publish when ready.",
			});
		},
		onError: (error) =>
			showToast({
				type: "error",
				title: "New version not created",
				description: getAuditActionErrorMessage(error, "template"),
			}),
	});
}
