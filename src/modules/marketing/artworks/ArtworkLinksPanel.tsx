// artworks/ArtworkLinksPanel.tsx
// The artwork team's work, shown on the proposer's own form view (the CRF tab
// of the EPC page). Give it an EPC id and it fetches GET /artworks/by-epc/:epcId
// itself.
//
//   - no artwork request for the EPC, no access, or still loading → renders nothing
//   - otherwise one card; each requested artwork shows its details, reference
//     images and the link from the artwork team with:
//         Open in new tab · Copy · Request edits
//     and, while the team still owes something, a Remind button.
//
// Request edits: the requester describes the change; the server e-mails the
// artwork team automatically (no mail is triggered from here). The team puts the
// updated link in the same box on their page; saving it notifies the requester.
// Until then the artwork shows "Edits requested" and goes back to the team's
// pending list.
//
// This is the only artworks component other modules import (see index.ts).

import { useState } from "react";
import { BellRing, Copy, ExternalLink, Pencil, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import TextareaInput from "../../../components/forms/TextareaInput";
import { useToast } from "../../../context/Auth/AuthContext";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../utils/apiError.helper";
import {
	artworkKeys,
	useArtworkByEpcQuery,
	useRemindArtworkTeamMutation,
	useRequestArtworkEditMutation,
} from "./artworks.api";
import { ArtworkCustomBadge, ArtworkStatusBadge } from "./ArtworkBadges";
import { formatArtworkDateTime, formatArtworkSize } from "./artworks.format";
import type { ArtworkDetail, ArtworkItem } from "./artworks.types";
import "./artworks.css";

export type ArtworkLinksPanelProps = {
	epcId: string;
	/** Card heading. */
	title?: string;
};

const NOTE_MIN = 5;
const NOTE_MAX = 1000;
const REMIND_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/** Hours left before "Remind" can be pressed again (0 = available now). */
const remindWaitHours = (lastReminderAt?: string | null) => {
	if (!lastReminderAt) return 0;
	const left =
		new Date(lastReminderAt).getTime() + REMIND_COOLDOWN_MS - Date.now();
	return left > 0 ? Math.ceil(left / (60 * 60 * 1000)) : 0;
};

const copyText = async (text: string) => {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		// Clipboard API blocked (http / old browser): fall back to a hidden textarea.
		const area = document.createElement("textarea");
		area.value = text;
		area.style.position = "fixed";
		area.style.opacity = "0";
		document.body.appendChild(area);
		area.select();
		const ok = document.execCommand("copy");
		document.body.removeChild(area);
		return ok;
	}
};

export default function ArtworkLinksPanel({
	epcId,
	title = "Artwork requests",
}: ArtworkLinksPanelProps) {
	const { data: request } = useArtworkByEpcQuery(epcId);
	if (!request) return null;

	return (
		<Card
			title={title}
			subtitle={`${request.sharedCount} of ${request.itemCount} links shared by the artwork team`}
			actions={<ArtworkStatusBadge status={request.status} />}
			padding="compact"
		>
			<ul className="artwork-links-list">
				{request.items.map((item) => (
					<ArtworkLinkRow key={item.id} request={request} item={item} />
				))}
			</ul>
		</Card>
	);
}

/* ========================================================================== */
/*                                    Row                                     */
/* ========================================================================== */

function ArtworkLinkRow({
	request,
	item,
}: {
	request: ArtworkDetail;
	item: ArtworkItem;
}) {
	const { showToast } = useToast();
	const queryClient = useQueryClient();
	const requestEdit = useRequestArtworkEditMutation();
	const remind = useRemindArtworkTeamMutation();

	const [editing, setEditing] = useState(false);
	const [note, setNote] = useState("");
	const [noteError, setNoteError] = useState<string>();

	const { permissions } = request;
	const editRequested = item.status === "EDIT_REQUESTED";
	const rounds = item.editRounds?.length ?? 0;
	const maxRounds = permissions.maxEditRounds ?? 5;
	const roundsLeft = Math.max(0, maxRounds - rounds);
	const openRound = item.editRounds?.find((round) => !round.resolvedAt);
	const waitHours = remindWaitHours(item.lastReminderAt);

	const canAskForEdits =
		Boolean(permissions.canRequestEdit) &&
		Boolean(item.link) &&
		!editRequested &&
		request.canShare;
	const canRemind =
		Boolean(permissions.canRemind) &&
		(!item.link || editRequested) &&
		request.canShare;

	const refresh = () =>
		queryClient.invalidateQueries({ queryKey: artworkKeys.all });

	const handleCopy = async () => {
		if (!item.link) return;
		const ok = await copyText(item.link);
		if (ok) showSuccessToast(showToast, "Link copied.", "Copied");
		else
			showApiErrorToast(
				showToast,
				new Error("copy"),
				"Select the link and copy it manually.",
				"Could not copy",
			);
	};

	const handleSend = async () => {
		const text = note.trim();
		if (text.length < NOTE_MIN) {
			setNoteError(`Describe the change in at least ${NOTE_MIN} characters.`);
			return;
		}
		if (text.length > NOTE_MAX) {
			setNoteError(`Keep it under ${NOTE_MAX} characters.`);
			return;
		}
		setNoteError(undefined);

		try {
			await requestEdit.mutateAsync({
				id: request.id,
				itemId: item.id,
				note: text,
			});
			await refresh();
			setEditing(false);
			setNote("");
			showSuccessToast(
				showToast,
				"The artwork team has been emailed. You'll be notified when the updated link is ready.",
				"Edits requested",
			);
		} catch (err) {
			showApiErrorToast(
				showToast,
				err,
				"The request could not be sent.",
				"Unable to request edits",
			);
		}
	};

	const handleRemind = async () => {
		try {
			await remind.mutateAsync({ id: request.id, itemId: item.id });
			await refresh();
			showSuccessToast(
				showToast,
				"The artwork team has been reminded.",
				"Reminder sent",
			);
		} catch (err) {
			showApiErrorToast(
				showToast,
				err,
				"The reminder could not be sent.",
				"Unable to remind",
			);
		}
	};

	const meta = [
		item.productName,
		item.artworkType,
		formatArtworkSize(item.width, item.height, item.unit),
		`Qty ${item.quantity}`,
	]
		.filter((part) => part && part !== "--")
		.join(" · ");

	return (
		<li className="artwork-links-row artwork-links-row--stack">
			{/* --------------------------- What was asked --------------------------- */}
			<div className="artwork-event-cell">
				<strong>
					{item.title} {item.isCustom ? <ArtworkCustomBadge /> : null}
				</strong>
				{meta ? <small>{meta}</small> : null}
				{item.description ? <small>Brief: {item.description}</small> : null}

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
			</div>

			{/* ------------------------------ The link ------------------------------ */}
			{item.link ? (
				<div className="artwork-link-box">
					<input
						className="artwork-link-input"
						readOnly
						value={item.link}
						aria-label={`Artwork link for ${item.title}`}
						onFocus={(event) => event.currentTarget.select()}
					/>
					<a
						className="artwork-link-btn"
						href={item.link}
						target="_blank"
						rel="noopener noreferrer"
					>
						<ExternalLink size={14} aria-hidden="true" />
						Open in new tab
					</a>
					<button type="button" className="artwork-link-btn" onClick={handleCopy}>
						<Copy size={14} aria-hidden="true" />
						Copy
					</button>
					{canAskForEdits ? (
						<button
							type="button"
							className="artwork-link-btn artwork-link-btn--accent"
							onClick={() => setEditing((open) => !open)}
							aria-expanded={editing}
						>
							<Pencil size={14} aria-hidden="true" />
							Request edits
						</button>
					) : null}
				</div>
			) : (
				<span className="artwork-link-missing">
					Awaiting link from the artwork team
				</span>
			)}

			{item.link && item.sharedAt ? (
				<small className="artwork-link-shared">
					{editRequested ? "Previous link, shared" : "Shared"}{" "}
					{formatArtworkDateTime(item.sharedAt)}
					{item.sharedByName ? ` by ${item.sharedByName}` : ""}
				</small>
			) : null}

			{/* --------------------------- Edit request state --------------------------- */}
			{editRequested && openRound ? (
				<div className="artwork-edit-state" role="status">
					<strong>Edits requested</strong>{" "}
					<small>{formatArtworkDateTime(openRound.createdAt)}</small>
					<p>{openRound.note}</p>
					<small>
						Waiting for the artwork team to share an updated link in the same
						place.
					</small>
				</div>
			) : null}

			{/* ------------------------------ Request edits ------------------------------ */}
			{editing && canAskForEdits ? (
				<div className="artwork-edit-form">
					<TextareaInput
						id={`edit-note-${item.id}`}
						label="What should change?"
						required
						rows={4}
						maxLength={NOTE_MAX}
						placeholder="Describe the changes you need — text, colours, sizes, logos…"
						value={note}
						error={noteError}
						onChange={(event) => setNote(event.target.value)}
					/>
					<div className="artwork-actions">
						<small className="artwork-note">
							{roundsLeft} of {maxRounds} edit requests left for this artwork ·
							the artwork team is emailed automatically.
						</small>
						<Button
							type="button"
							text="Cancel"
							appearance="standard"
							variant="outline"
							size="sm"
							disabled={requestEdit.isPending}
							onClick={() => {
								setEditing(false);
								setNote("");
								setNoteError(undefined);
							}}
						/>
						<Button
							type="button"
							text="Send to artwork team"
							Icon={Send}
							iconPosition="left"
							appearance="cta"
							variant="brand"
							size="sm"
							loading={requestEdit.isPending}
							disabled={roundsLeft === 0}
							onClick={handleSend}
						/>
					</div>
				</div>
			) : null}

			{/* --------------------------------- Remind --------------------------------- */}
			{canRemind ? (
				<div className="artwork-remind">
					<Button
						type="button"
						text={waitHours > 0 ? `Remind again in ${waitHours} h` : "Remind team"}
						Icon={BellRing}
						iconPosition="left"
						appearance="standard"
						variant="outline"
						size="sm"
						loading={remind.isPending}
						disabled={waitHours > 0}
						onClick={handleRemind}
					/>
				</div>
			) : null}
		</li>
	);
}
