import React from "react";
import { useNavigate } from "react-router-dom";

import EpcForm from "../../forms/EPC/EpcForm";
import ActivityDetailsSection from "../activityFormView/ActivityDetailsSection";
import CrfSection from "../../forms/CRF/CrfSection";
import EpfSection from "../../forms/EPF/EpfSection";

import type { EpcDetailResponse } from "../../types/epc.types";
import { EventOutcome } from "../../forms/EventOutcome/EventOutcome";
import { EventReportSection } from "../../forms/EventReport/EventReportSection";
import Button from "../../../../../components/common/Button";
import { useAuth } from "../../../../../context/Auth/useAuth";
import { getStoredAppId } from "../../helpers/localstorage";
import type { EventReportDetail } from "../../types/event.report.types";
import { useToast } from "../../../../../context/Auth/AuthContext";
import { workflowApi } from "../../../../../api/workflow.api";

import { getWorkflowCommentContext } from "../../../../../components/ui/comments/comments.helper";

import ResubmitFooterAction from "./ResubmitFooterAction";
import { ReasonActionModal } from "../../../../../components/ui/ReasonActionModal";
import type { ActivityPermissions } from "../../helpers/activityPermissions.helper";
import { CommentsSection } from "../../../../../components/ui/comments";
import { activityPlannerCommentApi } from "../../api/activityPlannerComment.adapter";
import { getAuditMessage } from "../../helpers/activityLogMessage.helper";
import {
	ApprovalWorkflowSection,
	getWorkflowApproverData,
	type ActiveWorkflowLike,
	type WorkflowUserIdentity,
} from "../../../../workflows";

import type { ApprovalStageLike } from "../../../../workflows/types/types";

import type { WorkflowStage } from "../../types/workflow.types";
import { mapEpcWorkflowStage } from "../../../../workflows/utils/approvalWorkflow.mapper";

type EditingSection = "epc" | "crf" | "epf" | null;
type ReasonModalState = {
	mode: "clarify-workflow" | "clarify-report" | null;
	loading: boolean;
};

type ActivityFormViewProps = {
	epcData?: EpcDetailResponse | null;
	report?: EventReportDetail | null;
	permissions: ActivityPermissions;

	loading?: boolean;
	hasValidatorPreviewed?: boolean;
	isValidatingReport?: boolean;
	isClarifyingReport?: boolean;

	onOpenReportPreview: () => void;
	onValidateReport: () => void;
	onClarifyReport?: (reason: string) => void | Promise<void>;
	onEPCClose?: () => void | Promise<void>;
	isEPCClose?: boolean;

	editingSection: EditingSection;
	setEditingSection: React.Dispatch<React.SetStateAction<EditingSection>>;
	onRefresh: () => Promise<void>;
	onOpenReportBuilder: () => void;

	isSubmittingClarifiedUpdate?: boolean;
	onSubmitClarifiedUpdate?: () => void | Promise<void>;

	isSubmittingDeviationUpdate?: boolean;
	onSubmitDeviationUpdate?: () => void | Promise<void>;
};

const ActivityFormView = ({
	epcData,
	report,
	permissions,
	editingSection,
	setEditingSection,
	onRefresh,
	hasValidatorPreviewed,
	isValidatingReport,
	isClarifyingReport,
	onClarifyReport,
	onOpenReportBuilder,
	onOpenReportPreview,
	onValidateReport,
	isSubmittingClarifiedUpdate = false,
	onSubmitClarifiedUpdate,
	isSubmittingDeviationUpdate = false,
	onSubmitDeviationUpdate,
	onEPCClose,
	isEPCClose = false,
}: ActivityFormViewProps) => {
	const navigate = useNavigate();
	const { workspaceId, user } = useAuth();
	const { showToast } = useToast();
	const appId = React.useMemo(() => getStoredAppId(), []);

	const [deviationPreviewStages, setDeviationPreviewStages] = React.useState<
		ApprovalStageLike[]
	>([]);

	const [commentsRefreshKey, setCommentsRefreshKey] = React.useState(0);

	const [reasonModal, setReasonModal] = React.useState<ReasonModalState>({
		mode: null,
		loading: false,
	});

	const openReasonModal = React.useCallback(
		(mode: ReasonModalState["mode"]) => {
			setReasonModal({
				mode,
				loading: false,
			});
		},
		[],
	);

	const closeReasonModal = React.useCallback(() => {
		setReasonModal({
			mode: null,
			loading: false,
		});
	}, []);
	const refreshComments = React.useCallback(() => {
		setCommentsRefreshKey((prev) => prev + 1);
	}, []);

	const handleSuccess = React.useCallback(async () => {
		await onRefresh();
	}, [onRefresh]);

	const handleWorkflowUpdate = React.useCallback(async () => {
		await onRefresh();
		refreshComments();
	}, [onRefresh, refreshComments]);
	const handleDeviationPreviewSuccess = React.useCallback(
		(stages: WorkflowStage[]) => {
			setDeviationPreviewStages(stages.map(mapEpcWorkflowStage));
		},
		[],
	);
	const activeWorkflow = epcData?.activeWorkflow ?? null;

	const workflowStages = React.useMemo<ApprovalStageLike[]>(
		() => (activeWorkflow?.stages ?? []).map(mapEpcWorkflowStage),
		[activeWorkflow?.stages],
	);

	const mappedActiveWorkflow =
		React.useMemo<ActiveWorkflowLike<ApprovalStageLike> | null>(
			() =>
				activeWorkflow
					? {
							id: activeWorkflow.id,
							iteration: activeWorkflow.iteration,
							isActive: activeWorkflow.isActive,
							status: activeWorkflow.status,
							currentStage: activeWorkflow.currentStage,
							stages: workflowStages,
						}
					: null,
			[activeWorkflow, workflowStages],
		);

	const currentWorkflowUser = React.useMemo<WorkflowUserIdentity | null>(
		() =>
			user?.id || user?.email
				? {
						id: user?.id ?? null,
						email: user?.email ?? null,
					}
				: null,
		[user?.id, user?.email],
	);

	const workflowData = React.useMemo(
		() => getWorkflowApproverData(mappedActiveWorkflow, currentWorkflowUser),
		[mappedActiveWorkflow, currentWorkflowUser],
	);

	const eventStatus = epcData?.status ?? "unknown";
	const { currentStage, canActNow: canActOnCurrentStage } = workflowData;

	const commentContext = React.useMemo(
		() =>
			getWorkflowCommentContext({
				activeWorkflow: mappedActiveWorkflow,
				currentUser: currentWorkflowUser,
				creator: epcData?.created_by,
			}),
		[mappedActiveWorkflow, currentWorkflowUser, epcData?.created_by],
	);

	const canComment = !permissions.isClosed && commentContext.canComment;

	const reasonMode = reasonModal.mode;
	const currentStageId = currentStage?.id ?? "";
	const reportId = report?.id ?? "";

	const handleApprove = React.useCallback(async () => {
		if (!currentStage?.id) return;

		try {
			const { message } = await workflowApi.approveStage(currentStage.id);

			showToast({
				type: "success",
				title: "Success",
				description: message,
			});

			await handleWorkflowUpdate();
		} catch (err) {
			showToast({
				type: "error",
				title: "Error",
				description:
					err instanceof Error ? err.message : "Error while approving",
			});
		}
	}, [currentStage, handleWorkflowUpdate, showToast]);

	const handleReasonConfirm = React.useCallback(
		async (reason: string) => {
			if (!reasonMode) return;

			try {
				setReasonModal((prev) => ({
					...prev,
					loading: true,
				}));

				if (reasonMode === "clarify-workflow") {
					if (!currentStageId) {
						showToast({
							type: "error",
							title: "Not allowed",
							description: "No active approval stage found.",
						});
						return;
					}

					const { message } = await workflowApi.clarifyStage(
						currentStageId,
						reason,
					);

					showToast({
						type: "success",
						title: "Success",
						description: message,
					});

					await handleWorkflowUpdate();
				}

				if (reasonMode === "clarify-report") {
					if (!reportId) {
						showToast({
							type: "error",
							title: "Not allowed",
							description: "No submitted report found.",
						});
						return;
					}

					await onClarifyReport?.(reason);

					showToast({
						type: "success",
						title: "Success",
						description: "Report sent back to proposer for correction.",
					});

					await handleWorkflowUpdate();
				}

				closeReasonModal();
			} catch (err) {
				showToast({
					type: "error",
					title: "Error",
					description:
						err instanceof Error
							? err.message
							: "Unable to complete this action.",
				});
			} finally {
				setReasonModal((prev) => ({
					...prev,
					loading: false,
				}));
			}
		},
		[
			reasonMode,
			currentStageId,
			reportId,
			onClarifyReport,
			showToast,
			handleWorkflowUpdate,
			closeReasonModal,
		],
	);

	if (!epcData) {
		return (
			<div className="px-6 py-4">
				<EpcForm
					mode="create"
					onSuccess={async (savedEpc) => {
						const createdEpcId =
							savedEpc?.id ??
							savedEpc?.eventProposal?.id ??
							savedEpc?.epcId ??
							savedEpc?.epc?.id;

						if (!createdEpcId) {
							console.error("Created EPC id not found", savedEpc);
							return;
						}

						navigate(`/marketing/activity-planner/${createdEpcId}`);
					}}
				/>
			</div>
		);
	}

	return (
		<>
			<div className="px-6 py-4">
				<div className="form my-3 text-left text-sm">
					<ActivityDetailsSection
						epcData={epcData}
						isEditing={editingSection === "epc"}
						canEdit={permissions.canEditEpc}
						onEdit={() => setEditingSection("epc")}
						onCancel={() => setEditingSection(null)}
						onSuccess={async () => {
							setEditingSection(null);
							await onRefresh();
						}}
					/>

					<CrfSection
						epcData={epcData}
						isEditing={editingSection === "crf"}
						canEdit={permissions.canEditCrf}
						canCreate={permissions.canCreateCrf}
						onEdit={() => setEditingSection("crf")}
						onCancel={() => setEditingSection(null)}
						onSuccess={async () => {
							setEditingSection(null);
							await onRefresh();
						}}
					/>

					<EpfSection
						epcData={epcData}
						isEditing={editingSection === "epf"}
						canEdit={permissions.canEditEpf}
						canCreate={permissions.canCreateEpf}
						onEdit={() => setEditingSection("epf")}
						onCancel={() => setEditingSection(null)}
						onSuccess={async () => {
							setEditingSection(null);
							await onRefresh();
						}}
					/>

					{epcData.epf && editingSection !== "epf" && (
						<>
							<ApprovalWorkflowSection
								stages={workflowStages}
								additionalFlows={
									deviationPreviewStages.length > 0
										? [
												{
													key: "deviation",
													title: "Deviation Approval Flow",
													stages: deviationPreviewStages,
												},
											]
										: []
								}
							/>

							<CommentsSection
								subjectType="EPC"
								subjectId={epcData.id}
								currentUserId={user?.id}
								approvalId={commentContext.approvalId}
								mentionableUsers={commentContext.mentionableUsers}
								ccEmails={commentContext.ccEmails}
								refreshKey={commentsRefreshKey}
								canComment={canComment}
								api={activityPlannerCommentApi}
								formatAuditMessage={getAuditMessage}
								title="Comment Section"
							/>
						</>
					)}

					{permissions.canShowInitialEventOutcome && (
						<EventOutcome eventStatus={eventStatus} epcID={epcData.id} />
					)}

					{permissions.canShowReportSection && (
						<EventReportSection
							report={report ?? null}
							isProposer={permissions.isProposer}
							isValidator={permissions.isValidator}
							canCreateReport={permissions.canCreateReport}
							hasValidatorPreviewed={hasValidatorPreviewed}
							isValidating={Boolean(isValidatingReport)}
							isClarifying={Boolean(isClarifyingReport)}
							onOpenReportBuilder={onOpenReportBuilder}
							onOpenReportPreview={onOpenReportPreview}
							onValidateReport={onValidateReport}
							onClarifyReport={() => openReasonModal("clarify-report")}
						/>
					)}

					{permissions.canShowPostReportEventOutcome && (
						<EventOutcome
							eventStatus={eventStatus}
							epcID={epcData.id}
							workspaceId={workspaceId ?? undefined}
							appId={appId ?? undefined}
							onSuccess={handleSuccess}
							onDeviationPreviewSuccess={handleDeviationPreviewSuccess}
						/>
					)}
				</div>
			</div>

			{canActOnCurrentStage && (
				<div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 overflow-visible border-t border-gray-200 bg-white px-4 py-4">
					<div className="flex gap-2">
						<Button
							type="button"
							text="Send for Clarification"
							variant="outline"
							appearance="standard"
							disabled={!canActOnCurrentStage}
							onClick={() => openReasonModal("clarify-workflow")}
						/>

						<Button
							type="button"
							text="Approve"
							variant="brand"
							appearance="standard"
							disabled={!canActOnCurrentStage}
							onClick={handleApprove}
						/>
					</div>

					{permissions.canShowCloseEpcAction && (
						<Button
							type="button"
							text={
								isEPCClose
									? "Closing..."
									: permissions.isClosed
										? "EPC Closed"
										: "Close EPC"
							}
							variant="brand"
							appearance="standard"
							disabled={isEPCClose || permissions.isClosed}
							onClick={() => {
								if (permissions.isClosed || isEPCClose) return;
								onEPCClose?.();
							}}
						/>
					)}
				</div>
			)}
			{permissions.isClarifiedPending && (
				<ResubmitFooterAction
					isPending={permissions.isClarifiedPending}
					isSubmitting={isSubmittingClarifiedUpdate}
					canSubmit={permissions.canSubmitClarifiedUpdate}
					onSubmit={onSubmitClarifiedUpdate}
					tooltip="Submit clarified changes"
				/>
			)}

			{permissions.isDeviationPending && (
				<ResubmitFooterAction
					isPending={permissions.isDeviationPending}
					isSubmitting={isSubmittingDeviationUpdate}
					canSubmit={permissions.canSubmitDeviationUpdate}
					onSubmit={onSubmitDeviationUpdate}
					tooltip="Submit deviation changes"
				/>
			)}
			<ReasonActionModal
				open={Boolean(reasonModal.mode)}
				mode={reasonModal.mode}
				loading={reasonModal.loading || Boolean(isClarifyingReport)}
				onClose={closeReasonModal}
				onConfirm={handleReasonConfirm}
			/>
		</>
	);
};

export default ActivityFormView;
