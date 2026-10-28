// handouts/HandoutDetailPage.tsx
// One request, three audiences. What shows is driven by the server's
// `permissions` flags on GET /handouts/:id, not re-derived from roles here:
//   requester     → read-only + Cancel while pending
//   approver      → Approve / Reject (reason) while pending
//   delivery team → check items + hand over + close while approved

import { useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import {
	ReasonActionModal,
	type ReasonActionMode,
} from "../../../components/ui/ReasonActionModal";
import { useToast } from "../../../context/Auth/AuthContext";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../utils/apiError.helper";

import {
	handoutKeys,
	useApproveHandoutMutation,
	useCancelHandoutMutation,
	useHandoutQuery,
	useHandoutStockQuery,
	useRejectHandoutMutation,
} from "./handouts.api";
import { HANDOUTS_BASE_PATH } from "./handouts.constants";
import {
	formatHandoutDate,
	formatHandoutDateTime,
} from "./handouts.format";
import HandoutDeliveryPanel from "./HandoutDeliveryPanel";
import HandoutItemsTable from "./HandoutItemsTable";
import HandoutStatusPill from "./HandoutStatusPill";
import "./handouts.css";

const ACTION_LABEL = {
	SUBMITTED: "Submitted",
	APPROVED: "Approved",
	REJECTED: "Rejected",
	CANCELLED: "Cancelled",
	DELIVERED: "Hand delivered, closed",
} as const;

export default function HandoutDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	const { data: handout, isLoading, error } = useHandoutQuery(id);

	// Live availability only matters while a decision / delivery is pending.
	const needsStock =
		handout?.status === "PENDING_APPROVAL" || handout?.status === "APPROVED";
	const stockQuery = useHandoutStockQuery(handout?.items ?? [], needsStock);

	const approve = useApproveHandoutMutation();
	const reject = useRejectHandoutMutation();
	const cancel = useCancelHandoutMutation();

	const [modalMode, setModalMode] = useState<ReasonActionMode | null>(null);

	const refresh = () =>
		queryClient.invalidateQueries({ queryKey: handoutKeys.all });

	const back = () => navigate(HANDOUTS_BASE_PATH);

	if (isLoading) {
		return (
			<PageSectionLayout>
				<PageHeader headerText="Loading request…" />
			</PageSectionLayout>
		);
	}

	if (error || !handout) {
		return (
			<PageSectionLayout>
				<PageHeader headerText="Handout request" />
				<Alert
					type="banner"
					variant="error"
					title="Request not found"
					description="It may have been removed, or you may not have access to it."
				/>
				<Button
					type="button"
					text="Back to Handouts"
					Icon={ArrowLeft}
					iconPosition="left"
					appearance="standard"
					variant="outline"
					size="sm"
					onClick={back}
				/>
			</PageSectionLayout>
		);
	}

	const { permissions } = handout;
	const stock = stockQuery.data;
	const shortLines = (stock?.lines ?? []).filter(
		(line) => line.status !== "AVAILABLE",
	);

	const handleApprove = async () => {
		try {
			await approve.mutateAsync(handout.id);
			await refresh();
			showSuccessToast(
				showToast,
				`${handout.requestNumber} was approved and sent to the delivery team.`,
				"Request approved",
			);
		} catch (err) {
			showApiErrorToast(
				showToast,
				err,
				"The request could not be approved.",
				"Unable to approve",
			);
		}
	};

	// One modal, two reasons — the mode picks the copy and the call.
	const handleReason = async (reason: string) => {
		try {
			if (modalMode === "reject-handout") {
				await reject.mutateAsync({ id: handout.id, reason });
			} else {
				await cancel.mutateAsync({ id: handout.id, reason });
			}
			await refresh();
			showSuccessToast(
				showToast,
				modalMode === "reject-handout"
					? `${handout.requestNumber} was rejected.`
					: `${handout.requestNumber} was cancelled.`,
				modalMode === "reject-handout" ? "Request rejected" : "Request cancelled",
			);
			setModalMode(null);
		} catch (err) {
			showApiErrorToast(
				showToast,
				err,
				"The action could not be completed.",
				"Unable to continue",
			);
		}
	};

	const showDecision = permissions.canApprove || permissions.canReject;

	return (
		<PageSectionLayout>
			<div className="handout-page">
				<PageHeader
					headerText={`${handout.requestNumber} · ${handout.purpose}`}
					navigation={{
						variant: "breadcrumbs",
						ariaLabel: "Handout page location",
						breadcrumbs: [
							{ label: "Home Screen", href: "/" },
							{ label: "EPC Listing", href: "/marketing/activity-planner/listing" },
							{ label: "Handouts", href: HANDOUTS_BASE_PATH },
							{ label: handout.requestNumber },
						],
						separator: "›",
					}}
					headerChildren={<HandoutStatusPill status={handout.status} />}
				>
					<Button
						type="button"
						text="Back to list"
						Icon={ArrowLeft}
						iconPosition="left"
						appearance="standard"
						variant="outline"
						size="sm"
						onClick={back}
					/>
				</PageHeader>

				{handout.status === "REJECTED" && handout.rejectionReason ? (
					<Alert
						type="banner"
						variant="error"
						title="Rejected"
						description={handout.rejectionReason}
					/>
				) : null}

				<div className="handout-split">
					<div className="handout-stack">
						<Card padding="compact" title="Request details">
							<dl className="handout-kv">
								<div>
									<dt>Requested by</dt>
									<dd>{handout.requestedByName}</dd>
								</div>
								<div>
									<dt>Designation</dt>
									<dd>{handout.requestedByDesignation ?? "--"}</dd>
								</div>
								<div>
									<dt>Department</dt>
									<dd>{handout.requestedByDepartment ?? "--"}</dd>
								</div>
								<div>
									<dt>Requested on</dt>
									<dd>{formatHandoutDate(handout.createdAt)}</dd>
								</div>
								<div>
									<dt>Required by</dt>
									<dd>{formatHandoutDate(handout.requiredBy)}</dd>
								</div>
								<div>
									<dt>Contact</dt>
									<dd>{handout.contactPhone}</dd>
								</div>
								<div className="is-wide">
									<dt>Deliver to</dt>
									<dd>{handout.deliverTo}</dd>
								</div>
								<div>
									<dt>Remarks</dt>
									<dd style={{ fontWeight: 400 }}>{handout.remarks || "--"}</dd>
								</div>
							</dl>
						</Card>

						{permissions.canDeliver ? (
							<HandoutDeliveryPanel
								handout={handout}
								stock={stock}
								stockLoading={stockQuery.isLoading}
								onDelivered={refresh}
							/>
						) : (
							<Card padding="none" title="Requested items">
								<HandoutItemsTable
									items={handout.items}
									stock={needsStock ? stock : undefined}
									stockLoading={needsStock && stockQuery.isLoading}
								/>
							</Card>
						)}

						{handout.delivery ? (
							<Card padding="compact" title="Delivery">
								<dl className="handout-kv">
									<div>
										<dt>Handed to</dt>
										<dd>{handout.delivery.handedToName}</dd>
									</div>
									<div>
										<dt>Delivered on</dt>
										<dd>{formatHandoutDateTime(handout.delivery.deliveredOn)}</dd>
									</div>
									<div>
										<dt>Delivered by</dt>
										<dd>{handout.delivery.deliveredByName}</dd>
									</div>
									<div className="is-wide">
										<dt>Note</dt>
										<dd style={{ fontWeight: 400 }}>
											{handout.delivery.note || "--"}
										</dd>
									</div>
								</dl>
							</Card>
						) : null}
					</div>

					<div className="handout-stack">
						{showDecision ? (
							<Card
								padding="compact"
								title="Your decision"
								footer={
									<div className="handout-actions">
										{permissions.canReject ? (
											<Button
												type="button"
												text="Reject"
												Icon={X}
												iconPosition="left"
												appearance="standard"
												variant="outline"
												size="sm"
												disabled={approve.isPending}
												onClick={() => setModalMode("reject-handout")}
											/>
										) : null}
										{permissions.canApprove ? (
											<Button
												type="button"
												text={approve.isPending ? "Approving..." : "Approve"}
												Icon={Check}
												iconPosition="left"
												appearance="standard"
												variant="brand"
												size="sm"
												disabled={approve.isPending}
												onClick={() => void handleApprove()}
											/>
										) : null}
									</div>
								}
							>
								<p className="handout-note">
									Single-step approval. Approving sends the request to the
									delivery team and notifies the requester; rejecting needs a
									reason.
								</p>
							</Card>
						) : null}

						{shortLines.length > 0 && needsStock ? (
							<Alert
								type="banner"
								variant="warning"
								title="Stock shortage"
								description={`${shortLines.length} ${
									shortLines.length === 1 ? "item has" : "items have"
								} less stock than requested. You can still proceed; stock is not reserved.`}
							/>
						) : null}

						{permissions.canCancel ? (
							<Card
								padding="compact"
								title="Your request"
								footer={
									<div className="handout-actions">
										<Button
											type="button"
											text="Cancel request"
											appearance="standard"
											variant="outline"
											size="sm"
											onClick={() => setModalMode("cancel-handout")}
										/>
									</div>
								}
							>
								<p className="handout-note">
									You can cancel while the request is waiting for approval.
								</p>
							</Card>
						) : null}

						<Card padding="compact" title="Activity">
							<ol className="handout-timeline">
								{handout.timeline.map((entry) => (
									<li key={entry.id}>
										<span className="handout-timeline-dot" aria-hidden="true" />
										<div>
											<strong>{ACTION_LABEL[entry.action]}</strong> by{" "}
											{entry.byName}
											<small>{formatHandoutDateTime(entry.at)}</small>
											{entry.comment ? <small>{entry.comment}</small> : null}
										</div>
									</li>
								))}
							</ol>
						</Card>
					</div>
				</div>
			</div>

			<ReasonActionModal
				open={modalMode !== null}
				mode={modalMode}
				loading={reject.isPending || cancel.isPending}
				onClose={() => setModalMode(null)}
				onConfirm={handleReason}
			/>
		</PageSectionLayout>
	);
}
