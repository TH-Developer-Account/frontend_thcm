import React from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import EpcForm from "../../forms/EPC/EpcForm";
import ActivityDetailsSection from "../activityFormView/ActivityDetailsSection";
import CrfSection from "../../forms/CRF/CrfSection";
import EpfSection from "../../forms/EPF/EpfSection";
import CommentsSection from "../commentSection/CommentsSection";
import ApprovalWorkflowSection from "./ApprovalWorkflowSection";

import type { EpcDetailResponse } from "../../types/epc.types";
import { EventOutcome } from "../../forms/EventOutcome/EventOutcome";
import { EventReportSection } from "../../forms/EventReport/EventReportSection";
import Button from "../../../../../components/common/Button";
import type { WorkflowStage } from "../../types/workflow.types";
import { useAuth } from "../../../../../context/Auth/useAuth";
import { getStoredAppId } from "../../helpers/localstorage";
import type { EventReportDetail } from "../../types/event.report.types";
import TextareaInput from "../../../../../components/FormElements/TextareaInput";
import { Modal } from "../../../../../components/common/Modal";
import { useToast } from "../../../../../context/Auth/AuthContext";
import { workflowApi } from "../../api/workflow.api";
import {
	getApprovalIdForUser,
	getApprovedStageCcEmails,
	getMentionableUsersFromStages,
	getCurrentApprovalStage,
	getIsUserInCurrentStage,
} from "../../helpers/approvalWorkflow.helpers";

type EditingSection = "epc" | "crf" | "epf" | null;

type ActivityFormViewProps = {
	epcData?: EpcDetailResponse | null;
	report?: EventReportDetail | null;
	isProposer?: boolean;
	isValidator?: boolean;
	hasValidatorPreviewed?: boolean;
	isValidatingReport?: boolean;
	onOpenReportPreview: () => void;
	onValidateReport: () => void;
	editingSection: EditingSection;
	setEditingSection: React.Dispatch<React.SetStateAction<EditingSection>>;
	onRefresh: () => Promise<void>;
	isClarifiedUpdate?: boolean;
	onOpenReportBuilder: () => void;
	loading?: boolean;
	isClarifiedPending?: boolean;
	isSubmittingClarifiedUpdate?: boolean;
	onSubmitClarifiedUpdate?: () => void | Promise<void>;
};

const ActivityFormView = ({
	epcData,
	editingSection,
	setEditingSection,
	onRefresh,
	loading,
	isProposer,
	isValidator,
	hasValidatorPreviewed,
	isValidatingReport,
	onOpenReportBuilder,
	onOpenReportPreview,
	onValidateReport,
	report,
	isClarifiedUpdate = false,
	isClarifiedPending = false,
	isSubmittingClarifiedUpdate = false,
	onSubmitClarifiedUpdate,
}: ActivityFormViewProps) => {
	const navigate = useNavigate();
	const { workspaceId, user } = useAuth();
	const { showToast } = useToast();
	const appId = React.useMemo(() => getStoredAppId(), []);

	const [deviationPreviewStages, setDeviationPreviewStages] = React.useState<
		WorkflowStage[]
	>([]);

	const [commentsRefreshKey, setCommentsRefreshKey] = React.useState(0);
	const [isClarifyModalOpen, setIsClarifyModalOpen] = React.useState(false);
	const [clarifyLoading, setClarifyLoading] = React.useState(false);
	const [clarifyReason, setClarifyReason] = React.useState("");

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

	const activeWorkflow = epcData?.activeWorkflow ?? null;
	const workflowStages = activeWorkflow?.stages ?? [];
	const eventStatus = epcData?.status ?? "unknown";

	const userId = user?.id as string | undefined;
	const isProposerUser = userId === epcData?.created_by_id;

	const currentStage = React.useMemo(
		() => getCurrentApprovalStage(workflowStages),
		[workflowStages],
	);

	const isUserInCurrentStage = React.useMemo(
		() => getIsUserInCurrentStage(workflowStages, userId),
		[workflowStages, userId],
	);

	const canActOnCurrentStage = Boolean(currentStage && isUserInCurrentStage);

	const approvalId = React.useMemo(
		() => getApprovalIdForUser(workflowStages, userId),
		[workflowStages, userId],
	);
	const isReportFlowStatus = [
		"CONDUCTED",
		"CLARIFY_REPORT",
		"REPORT_SUBMITTED",
	].includes(eventStatus);

	const isReportCreated = Boolean(report?.id);

	const canShowReportSection =
		isReportFlowStatus && (Boolean(isProposer) || isReportCreated);
	const mentionableUsers = React.useMemo(
		() => getMentionableUsersFromStages(workflowStages),
		[workflowStages],
	);

	const ccEmails = React.useMemo(
		() => getApprovedStageCcEmails(workflowStages),
		[workflowStages],
	);
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

	const handleClarify = React.useCallback(async () => {
		const trimmedReason = clarifyReason.trim();

		if (!trimmedReason) {
			showToast({
				type: "error",
				title: "Reason required",
				description: "Please enter a reason before sending for clarification.",
			});
			return;
		}

		if (!currentStage?.id) {
			showToast({
				type: "error",
				title: "Not allowed",
				description: "No active approval stage found",
			});
			return;
		}

		try {
			setClarifyLoading(true);

			const { message } = await workflowApi.clarifyStage(
				currentStage.id,
				trimmedReason,
			);

			showToast({
				type: "success",
				title: "Success",
				description: message,
			});

			setClarifyReason("");
			setIsClarifyModalOpen(false);

			await handleWorkflowUpdate();
		} catch (err) {
			showToast({
				type: "error",
				title: "Error",
				description:
					err instanceof Error
						? err.message
						: "Error while sending clarification request",
			});
		} finally {
			setClarifyLoading(false);
		}
	}, [clarifyReason, currentStage, handleWorkflowUpdate, showToast]);

	if (!epcData) {
		return (
			<div className="px-6 py-4 ">
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
				<div className="form text-left my-3 text-sm">
					<ActivityDetailsSection
						epcData={epcData}
						isClarifiedUpdate={isClarifiedUpdate}
						isEditing={editingSection === "epc"}
						onEdit={() => setEditingSection("epc")}
						onCancel={() => setEditingSection(null)}
						onSuccess={async () => {
							setEditingSection(null);
							await onRefresh();
						}}
					/>

					<CrfSection
						epcData={epcData}
						isClarifiedUpdate={isClarifiedUpdate}
						isEditing={editingSection === "crf"}
						onEdit={() => setEditingSection("crf")}
						onCancel={() => setEditingSection(null)}
						onSuccess={async () => {
							setEditingSection(null);
							await onRefresh();
						}}
					/>

					<EpfSection
						epcData={epcData}
						isClarifiedUpdate={isClarifiedUpdate}
						isEditing={editingSection === "epf"}
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
								deviationPreviewStages={deviationPreviewStages}
								onWorkflowUpdate={handleWorkflowUpdate}
							/>

							<CommentsSection
								epcId={epcData.id}
								approvalId={approvalId}
								isProposer={isProposerUser}
								mentionableUsers={mentionableUsers}
								ccEmails={ccEmails}
								refreshKey={commentsRefreshKey}
							/>
						</>
					)}
					{isProposerUser && eventStatus === "APPROVED" && (
						<EventOutcome eventStatus={eventStatus} epcID={epcData?.id} />
					)}
					{canShowReportSection && (
						<EventReportSection
							report={report ?? null}
							isProposer={Boolean(isProposer)}
							isValidator={Boolean(isValidator)}
							hasValidatorPreviewed={hasValidatorPreviewed}
							isValidating={Boolean(isValidatingReport)}
							onOpenReportBuilder={onOpenReportBuilder}
							onOpenReportPreview={onOpenReportPreview}
							onValidateReport={onValidateReport}
						/>
					)}
					{eventStatus === "VALIDATED" && (
						<EventOutcome
							eventStatus={eventStatus}
							epcID={epcData.id}
							workspaceId={workspaceId ?? undefined}
							appId={appId ?? undefined}
							onSuccess={handleSuccess}
							onDeviationPreviewSuccess={setDeviationPreviewStages}
						/>
					)}
				</div>
			</div>
			{/* Footer Actions */}
			{canActOnCurrentStage && (
				<div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-4 py-4">
					<div className="flex gap-2">
						<Button
							type="button"
							text="Send for Clarification"
							status="outline"
							disabled={!canActOnCurrentStage}
							onClick={() => setIsClarifyModalOpen(true)}
						/>

						<Button
							type="button"
							text="Approve"
							status="brand"
							disabled={!canActOnCurrentStage}
							onClick={handleApprove}
						/>
					</div>
				</div>
			)}

			{isClarifiedPending && (
				<div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-4 py-4">
					<div className="flex gap-2">
						<Button
							type="button"
							text={
								isSubmittingClarifiedUpdate
									? "Submitting..."
									: "Save & Final Submit"
							}
							Icon={Send}
							iconPosition="right"
							onClick={onSubmitClarifiedUpdate}
							status="brand"
							disabled={
								!epcData ||
								loading ||
								isSubmittingClarifiedUpdate ||
								!onSubmitClarifiedUpdate
							}
							size="sm"
							className="text-xs cursor-pointer"
						/>
					</div>
				</div>
			)}

			<Modal open={isClarifyModalOpen}>
				<div className="w-full rounded-2xl bg-white p-5 shadow-xl border border-zinc-200">
					<div className="mb-4">
						<h3 className="text-sm font-semibold text-zinc-900">
							Send for Clarification
						</h3>

						<p className="mt-1 text-xs text-zinc-500">
							Please mention why this request needs clarification. This reason
							will be shown in the comment section.
						</p>
					</div>

					<TextareaInput
						name="clarifyReason"
						value={clarifyReason}
						onChange={(e) => setClarifyReason(e.target.value)}
						placeholder="Example: Please update the budget breakup before approval."
						rows={4}
						autoFocus
						disabled={clarifyLoading}
						className="bg-white overflow-y-auto px-2 py-1.5 min-h-[90px]"
					/>

					<div className="mt-4 flex justify-end gap-3">
						<Button
							type="button"
							text="Cancel"
							status="outline"
							disabled={clarifyLoading}
							onClick={() => {
								setClarifyReason("");
								setIsClarifyModalOpen(false);
							}}
						/>

						<Button
							type="button"
							text={clarifyLoading ? "Sending..." : "Send Clarification"}
							status="brand"
							disabled={!clarifyReason.trim() || clarifyLoading}
							onClick={handleClarify}
						/>
					</div>
				</div>
			</Modal>
		</>
	);
};

export default ActivityFormView;
