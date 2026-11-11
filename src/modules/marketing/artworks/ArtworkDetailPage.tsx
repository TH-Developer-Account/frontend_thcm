// artworks/ArtworkDetailPage.tsx
// The marketing team's "form view" for ONE event: what the event is, which
// artworks were requested (from the approved CRF), and a link box per
// artwork. This page is deliberately read-only apart from those links — there
// is no edit form and no approval here. What is shown is driven by the
// server's `permissions` flags on GET /artworks/:id.
//
// Same structure as the Handouts detail page (DetailPageLayout):
//   header : back + EPC number + status (left)
//   main   : event details, then the artwork table with link inputs
//   side   : audit trail (shared AuditLogSection)

import { useState } from "react";
import { ArrowLeft, ExternalLink, History } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import NavigateButton from "../../../components/common/NavigateButton";
import FormInput from "../../../components/forms/FormInput";
import { AuditLogSection } from "../../../components/ui/audit";
import { PageHeader } from "../../../components/ui/PageHeader";
import ManagementTable from "../../../components/ui/tables/ManagementTable/ManagementTable";
import type { ManagementTableColumn } from "../../../components/ui/tables/ManagementTable/ManagementTable.types";
import { useToast } from "../../../context/Auth/AuthContext";
import DetailPageLayout from "../../../layout/DetailPageLayout";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../utils/apiError.helper";
import "../activity-planner/utils/activity-planner.styles.css";

import {
	ARTWORK_AUDIT_MESSAGES,
	ARTWORK_AUDIT_SUBJECT,
	artworkAuditApi,
	artworkKeys,
	useArtworkQuery,
	useShareArtworkLinksMutation,
} from "./artworks.api";
import {
	ArtworkCustomBadge,
	ArtworkStatusBadge,
	getEventTiming,
} from "./ArtworkBadges";
import { ARTWORK_LIMITS, ARTWORKS_BASE_PATH } from "./artworks.constants";
import {
	formatArtworkDateRange,
	formatArtworkSize,
	isValidHttpUrl,
} from "./artworks.format";
import type { ArtworkItem, ShareLinkInput } from "./artworks.types";
import { ArtworkMockToggle } from "./artworks.mock"; // MOCK-LAYER
import { useArtworkPermissions } from "./useArtworkPermissions";
import "./artworks.css";

export default function ArtworkDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { canOpenArtworks } = useArtworkPermissions();

	const { data: request, isLoading, error } = useArtworkQuery(id);
	const share = useShareArtworkLinksMutation();

	// Only the boxes the user has typed in; everything else shows the saved link.
	const [drafts, setDrafts] = useState<Record<string, string>>({});
	const [errors, setErrors] = useState<Record<string, string>>({});

	const back = () => navigate(ARTWORKS_BASE_PATH);

	if (!canOpenArtworks) {
		return (
			<PageSectionLayout>
				<PageHeader
					headerText="Artworks"
					subtitleText="You do not have access to Artworks."
				>
					<ArtworkMockToggle /> {/* MOCK-LAYER */}
				</PageHeader>
			</PageSectionLayout>
		);
	}

	if (isLoading) {
		return (
			<PageSectionLayout>
				<PageHeader headerText="Loading artwork request…" />
			</PageSectionLayout>
		);
	}

	if (error || !request) {
		return (
			<PageSectionLayout>
				<PageHeader headerText="Artwork request" />
				<Alert
					type="banner"
					variant="error"
					title="Request not found"
					description="It may have been removed, or you may not have access to it."
				/>
				{/* MOCK-LAYER: flip here if a mock id was opened with mock off */}
				<ArtworkMockToggle />
				<Button
					type="button"
					text="Back to Artworks"
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

	const { permissions } = request;
	const canEditLinks = permissions.canShareLinks;
	const timing = getEventTiming(request.eventState, request.daysUntil);
	const pendingCount = request.itemCount - request.sharedCount;

	const isEditRequested = (item: ArtworkItem) => item.status === "EDIT_REQUESTED";

	// An item the requester asked to change starts with an EMPTY box: the team
	// pastes the updated link there (even if it is the same URL re-uploaded),
	// and that save is what notifies the requester.
	const valueOf = (item: ArtworkItem) =>
		drafts[item.id] ?? (isEditRequested(item) ? "" : (item.link ?? ""));
	const dirtyItems = request.items.filter((item) => {
		if (!(item.id in drafts)) return false;
		const draft = drafts[item.id].trim();
		return isEditRequested(item) ? draft !== "" : draft !== (item.link ?? "");
	});
	const editRequestCount = request.items.filter(isEditRequested).length;

	/* ------------------------------ Actions ------------------------------- */

	const handleChange = (item: ArtworkItem, value: string) => {
		setDrafts((previous) => ({ ...previous, [item.id]: value }));
		if (errors[item.id]) {
			setErrors((previous) => {
				const next = { ...previous };
				delete next[item.id];
				return next;
			});
		}
	};

	const handleSave = async () => {
		// Same rule as the backend, so the user sees the problem on the row.
		const nextErrors: Record<string, string> = {};
		for (const item of dirtyItems) {
			const value = drafts[item.id].trim();
			if (!value) continue; // empty = clear the link
			if (value.length > ARTWORK_LIMITS.LINK) {
				nextErrors[item.id] = "This link is too long.";
			} else if (!isValidHttpUrl(value)) {
				nextErrors[item.id] =
					"Enter a full link starting with http:// or https://";
			}
		}
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		const links: ShareLinkInput[] = dirtyItems.map((item) => ({
			itemId: item.id,
			link: drafts[item.id].trim() || null,
		}));

		try {
			await share.mutateAsync({ id: request.id, links });
			await queryClient.invalidateQueries({ queryKey: artworkKeys.all });
			setDrafts({});
			showSuccessToast(
				showToast,
				"The proposer can now see the links on their CRF.",
				links.some((link) => link.link) ? "Links saved" : "Links removed",
			);
		} catch (err) {
			showApiErrorToast(
				showToast,
				err,
				"The links could not be saved.",
				"Unable to save links",
			);
		}
	};

	/* ------------------------------- Table -------------------------------- */

	const columns: ManagementTableColumn<ArtworkItem>[] = [
		{
			key: "artwork",
			header: "Artwork",
			render: (item) => (
				<div className="artwork-event-cell">
					<strong>
						{item.title} {item.isCustom ? <ArtworkCustomBadge /> : null}
					</strong>
					{item.productName || item.artworkType ? (
						<small>
							{[item.productName, item.artworkType].filter(Boolean).join(" · ")}
						</small>
					) : null}
					{item.description ? (
						<small>
							{item.isCustom ? "Brief: " : ""}
							{item.description}
						</small>
					) : null}

					{item.attachments?.length ? (
						<span className="artwork-thumbs">
							{item.attachments.map((file) => (
								<a
									key={file.id}
									href={file.url}
									target="_blank"
									rel="noopener noreferrer"
									title={
										file.description
											? `${file.fileName} — ${file.description}`
											: file.fileName
									}
								>
									<img src={file.url} alt={file.fileName} />
								</a>
							))}
						</span>
					) : null}

					{/* The requester's open change request, newest round. */}
					{isEditRequested(item)
						? (() => {
								const round = item.editRounds?.find((r) => !r.resolvedAt);
								return round ? (
									<span className="artwork-edit-flag">
										<strong>Edits requested</strong> by{" "}
										{round.requestedByName ?? "the requester"} —{" "}
										{round.note}
									</span>
								) : null;
							})()
						: null}
				</div>
			),
		},
		{
			key: "size",
			header: "Size",
			hideBelow: "md",
			render: (item) => formatArtworkSize(item.width, item.height, item.unit),
		},
		{
			key: "quantity",
			header: "Qty",
			align: "right",
			hideBelow: "sm",
			render: (item) => item.quantity,
		},
		{
			key: "link",
			header: "Artwork link",
			width: "40%",
			render: (item) =>
				canEditLinks ? (
					<div className="artwork-link-cell">
						<FormInput
							name={`artwork-link-${item.id}`}
							aria-label={`Link for ${item.title}`}
							type="url"
							placeholder={
								isEditRequested(item) ? "Paste the updated link…" : "https://…"
							}
							value={valueOf(item)}
							error={errors[item.id]}
							onChange={(event) => handleChange(item, event.target.value)}
						/>
						{item.link && !(item.id in drafts) && !isEditRequested(item) ? (
							<a
								className="artwork-link-open"
								href={item.link}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`Open ${item.title}`}
							>
								<ExternalLink size={16} aria-hidden="true" />
							</a>
						) : null}
					</div>
				) : item.link ? (
					<a
						className="artwork-link-anchor"
						href={item.link}
						target="_blank"
						rel="noopener noreferrer"
					>
						Open artwork
						<ExternalLink size={14} aria-hidden="true" />
					</a>
				) : (
					<span className="artwork-link-missing">Not shared yet</span>
				),
		},
	];

	/* ------------------------------- Render ------------------------------- */

	return (
		<PageSectionLayout>
			<DetailPageLayout className="activity-form-view">
				<DetailPageLayout.Header
					back={<NavigateButton direction="back" />}
					title={request.epcNumber ?? "Artwork request"}
					badge={<ArtworkStatusBadge status={request.status} />}
					subtitle={[
						request.eventName,
						formatArtworkDateRange(request.eventFromDate, request.eventToDate),
					]
						.filter(Boolean)
						.join(" · ")}
				>
					<ArtworkMockToggle /> {/* MOCK-LAYER */}
				</DetailPageLayout.Header>

				{/* The countdown the marketing team asked for. */}
				{request.canShare && pendingCount > 0 ? (
					<Alert
						type="banner"
						variant="warning"
						title={`${timing.text} — ${pendingCount} artwork ${
							pendingCount === 1 ? "link is" : "links are"
						} still pending`}
						description="Share a link for each artwork below so the proposer can use them."
					/>
				) : null}

				{request.canShare && editRequestCount > 0 ? (
					<Alert
						type="banner"
						variant="warning"
						title={`${editRequestCount} ${
							editRequestCount === 1 ? "artwork has" : "artworks have"
						} edit requests from the requester`}
						description="Paste the updated link in the same box and save. The requester is notified by email."
					/>
				) : null}

				{!request.canShare ? (
					<Alert
						type="banner"
						variant="warning"
						title={timing.text}
						description="Links can only be added or changed while the event is approved and not yet conducted. This request is now read-only."
					/>
				) : null}

				<DetailPageLayout.Body>
					<DetailPageLayout.Main>
						<div className="artwork-stack">
							<Card title="Event details">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
									<FormInput
										mode="view"
										name="epcNumber"
										label="EPC Number"
										value={request.epcNumber ?? ""}
									/>
									<FormInput
										mode="view"
										name="eventName"
										label="Event"
										value={request.eventName ?? ""}
									/>
									<FormInput
										mode="view"
										name="eventDate"
										label="Event Date"
										value={formatArtworkDateRange(
											request.eventFromDate,
											request.eventToDate,
										)}
									/>
									<FormInput
										mode="view"
										name="requestedBy"
										label="Requested By"
										value={request.proposer?.name ?? ""}
									/>
									<FormInput
										mode="view"
										name="requesterEmail"
										label="Email"
										value={request.proposer?.email ?? ""}
									/>
									<FormInput
										mode="view"
										name="requesterPhone"
										label="Phone"
										value={request.proposer?.phone ?? ""}
									/>
								</div>
							</Card>

							<Card
								padding="none"
								title={`Artworks requested (${request.sharedCount} of ${request.itemCount} links shared)`}
								footer={
									canEditLinks ? (
										<div className="artwork-actions">
											<Button
												type="button"
												text="Discard changes"
												appearance="standard"
												variant="outline"
												size="sm"
												disabled={dirtyItems.length === 0 || share.isPending}
												onClick={() => {
													setDrafts({});
													setErrors({});
												}}
											/>
											<Button
												type="button"
												text={
													dirtyItems.length > 0
														? `Save links (${dirtyItems.length})`
														: "Save links"
												}
												appearance="cta"
												variant="brand"
												size="sm"
												loading={share.isPending}
												disabled={dirtyItems.length === 0}
												onClick={handleSave}
											/>
										</div>
									) : undefined
								}
							>
								<ManagementTable
									rows={request.items}
									columns={columns}
									getRowId={(item) => item.id}
									ariaLabel="Requested artworks"
									pagination={false}
									emptyTitle="No artworks"
									emptyDescription="This request has no artwork lines."
								/>
							</Card>
						</div>
					</DetailPageLayout.Main>

					<DetailPageLayout.Side label="Request activity">
						<Card
							className="activity-form-view-panel activity-form-view-panel--audit"
							accordion
							defaultExpanded
							title={
								<span className="activity-form-view-panel-title">
									<History size={15} aria-hidden="true" />
									Audit Trail
								</span>
							}
							padding="none"
							bodyClassName="activity-form-view-panel-body"
						>
							<AuditLogSection
								subjectType={ARTWORK_AUDIT_SUBJECT}
								subjectId={request.id}
								entityName="artwork request"
								refreshKey={`${request.status}-${request.sharedCount}-${request.timeline.length}`}
								api={artworkAuditApi}
								actionMessages={ARTWORK_AUDIT_MESSAGES}
							/>
						</Card>

						{canEditLinks ? (
							<Card title="What you can do here">
								<p className="artwork-note">
									This request is read-only. You cannot edit the CRF or approve
									anything — just add a link for each artwork and save. The
									proposer is notified and sees the links on their CRF.
								</p>
							</Card>
						) : null}
					</DetailPageLayout.Side>
				</DetailPageLayout.Body>
			</DetailPageLayout>
		</PageSectionLayout>
	);
}
