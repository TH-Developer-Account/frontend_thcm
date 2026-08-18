import { useCallback, useMemo } from "react";
import { ClipboardClock, Eye } from "lucide-react";

import Button from "../../../components/common/Button";
import FormHeader from "../../../components/ui/FormHeader";
import { CardEmpty } from "../../../components/ui/CardSkeleton";
import { useToast } from "../../../context/Auth/AuthContext";
import { ApprovalWorkflowTableContent } from "../../workflows/components/ApprovalWorkflowTableContent";
import type { WorkflowCriteria } from "../../workflows/api/workflow.api";
import type { ApprovalStageLike } from "../../workflows/types/types";
import {
	getPreviewWorkflowStages,
	useMedicalClaimWorkflowPreview,
} from "../hooks/useMedicalClaimWorkflowPreview";

interface MedicalClaimWorkflowSectionProps {
	claimId: string;
	criteria?: WorkflowCriteria;
	initialStages?: ApprovalStageLike[];
	showPreviewAction?: boolean;
}

const EMPTY_CRITERIA: WorkflowCriteria = {};

const MedicalClaimWorkflowSection = ({
	claimId,
	criteria = EMPTY_CRITERIA,
	initialStages = [],
	showPreviewAction = true,
}: MedicalClaimWorkflowSectionProps) => {
	const { showToast } = useToast();
	const { data, isFetching, canPreview, refetch, assignWorkflow, assignment } =
		useMedicalClaimWorkflowPreview({
			claimId,
			criteria,
			enabled: false,
		});

	const previewStages = useMemo(() => getPreviewWorkflowStages(data), [data]);

	// Before previewing, show the stages already attached to the claim. After a
	// preview request, show exactly what the preview endpoint returned.
	const resolvedStages = data === undefined ? initialStages : previewStages;

	const handlePreview = useCallback(async () => {
		if (!canPreview) {
			showToast({
				type: "error",
				title: "Unable to preview workflow",
				description: "Workspace or application information is unavailable.",
			});
			return;
		}

		const result = await refetch();

		if (result.isError) {
			showToast({
				type: "error",
				title: "Workflow preview failed",
				description:
					result.error instanceof Error
						? result.error.message
						: "Unable to fetch the applicable workflow.",
			});
		}
	}, [canPreview, refetch, showToast]);

	const handleAttach = useCallback(async () => {
		if (!canPreview) {
			showToast({
				type: "error",
				title: "Unable to attach workflow",
				description: "Workspace or application information is unavailable.",
			});
			return;
		}

		try {
			await assignWorkflow({ claimId, criteria });
		} catch (error) {
			showToast({
				type: "error",
				title: "Workflow attachment failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to attach the workflow to this claim.",
			});
		}
	}, [assignWorkflow, canPreview, claimId, criteria, showToast]);
	return (
		<section className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<FormHeader title="Approval Workflow" Icon={ClipboardClock} />

				{showPreviewAction ? (
					<>
						<Button
							type="button"
							text={isFetching ? "Fetching Workflow..." : "Preview Workflow"}
							Icon={Eye}
							size="sm"
							appearance="standard"
							variant="outline"
							disabled={isFetching || !canPreview}
							onClick={() => void handlePreview()}
						/>
						<Button
							type="button"
							text={
								assignment.isPending
									? "Attaching Workflow..."
									: "Attach Workflow"
							}
							Icon={Eye}
							size="sm"
							appearance="standard"
							variant="outline"
							disabled={assignment.isPending || !canPreview}
							onClick={() => void handleAttach()}
						/>
					</>
				) : null}
			</div>

			{isFetching ? (
				<p className="px-4.5 text-sm text-iron" role="status">
					Fetching the applicable approval workflow…
				</p>
			) : resolvedStages.length > 0 ? (
				<ApprovalWorkflowTableContent
					stages={resolvedStages}
					showEmptyState={false}
				/>
			) : (
				<CardEmpty
					title={
						data === undefined
							? "No approval workflow assigned"
							: "No applicable workflow found"
					}
					description={
						data === undefined && showPreviewAction
							? "Click Preview Workflow to fetch the applicable approval stages."
							: "No workflow stages are available for this claim."
					}
					Icon={ClipboardClock}
				/>
			)}
		</section>
	);
};

export default MedicalClaimWorkflowSection;
