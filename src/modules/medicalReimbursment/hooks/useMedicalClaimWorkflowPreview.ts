import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../context/Auth/useAuth";
import { getStoredAppId } from "../../marketing/activity-planner/helpers/localstorage";
import {
	workflowApi,
	type AssignWorkflowPayload,
	type PreviewWorkflowPayload,
	type WorkflowCriteria,
} from "../../workflows/api/workflow.api";
import type { ApprovalStageLike } from "../../workflows/types/types";

export const medicalClaimWorkflowKeys = {
	all: ["medical-claims", "workflow-preview", "workflow-assign"] as const,

	preview: (
		claimId: string,
		workspaceId: string,
		appId: string,
		criteria: WorkflowCriteria,
	) =>
		[
			...medicalClaimWorkflowKeys.all,
			claimId || "new-claim",
			workspaceId,
			appId,
			criteria,
		] as const,
};

interface UseMedicalClaimWorkflowPreviewArgs {
	claimId?: string;
	criteria?: WorkflowCriteria;
	enabled?: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	Boolean(value) && typeof value === "object";

export const getPreviewWorkflowStages = (
	response: unknown,
): ApprovalStageLike[] => {
	if (!isRecord(response)) return [];

	const data = isRecord(response.data) ? response.data : undefined;

	const workflow =
		(isRecord(response.workflow) ? response.workflow : undefined) ??
		(data && isRecord(data.workflow) ? data.workflow : undefined);

	const candidates = [response, data, workflow];

	for (const candidate of candidates) {
		if (candidate && Array.isArray(candidate.stages)) {
			return candidate.stages as ApprovalStageLike[];
		}
	}

	return [];
};

export function useMedicalClaimWorkflowPreview({
	claimId = "",
	criteria = {},
	enabled = false,
}: UseMedicalClaimWorkflowPreviewArgs) {
	const { workspaceId } = useAuth();
	const appId = useMemo(() => getStoredAppId() ?? "", []);

	const canPreview = Boolean(workspaceId && appId);

	const query = useQuery({
		queryKey: medicalClaimWorkflowKeys.preview(
			claimId,
			workspaceId ?? "",
			appId,
			criteria,
		),

		queryFn: () => {
			if (!workspaceId) {
				throw new Error("Workspace is unavailable.");
			}

			if (!appId) {
				throw new Error("Application ID is unavailable.");
			}

			return workflowApi.previewWorkflow({
				subjectType: "MEDICAL_CLAIM",
				workspaceId,
				appId,
				criteria,
			} satisfies PreviewWorkflowPayload);
		},

		// Keep false when the API must only run after clicking the button.
		enabled: enabled && canPreview,
		retry: false,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});

	const assignment = useMutation({
		mutationFn: ({
			claimId: subjectId,
			criteria: assignCriteria,
		}: {
			claimId: string;
			criteria: WorkflowCriteria;
		}) => {
			if (!workspaceId) {
				throw new Error("Workspace is unavailable.");
			}

			if (!appId) {
				throw new Error("Application ID is unavailable.");
			}

			return workflowApi.assignWorkflow({
				subjectType: "MEDICAL_CLAIM",
				subjectId,
				workspaceId,
				appId,
				criteria: assignCriteria,
			} satisfies AssignWorkflowPayload);
		},
	});

	return {
		...query,
		canPreview,
		assignWorkflow: assignment.mutateAsync,
		assignment,
	};
}
