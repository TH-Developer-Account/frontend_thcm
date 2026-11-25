// handouts/HandoutApproverDecisionCard.tsx
// The approver's three options (Approve / Reject / Send for clarification)
// as ONE card: one reason box, three buttons. ApprovalActionsBar (shared by
// CRF, medical claims and vendor onboarding) only supports two reason-based
// actions per instance, which is why this used to be two stacked cards each
// with their own reason box — cluttered, and unclear which box belonged to
// which action. This component is Handouts-only, so the shared bar stays
// untouched for everyone else.
//
// Approve needs no reason. Reject and Clarify share the one box below and
// both require at least `minReasonLength` characters — the box is validated
// only when one of those two buttons is actually clicked, not continuously,
// so Approve stays available without typing anything.
//
// Card title is plain text, and the description is a body paragraph (not an
// eyebrow+title+subtitle block in the accordion header, as ApprovalActionsBar
// does it) — that header pattern clips anything longer than its original,
// shorter subtitles. Plain title + body copy is the same layout already used
// by the "Clarification requested" card on this page, which never clips.

import { useState } from "react";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import TextareaInput from "../../../components/forms/TextareaInput";

type Props = {
  canApprove: boolean;
  canReject: boolean;
  canClarify: boolean;
  onApprove: () => void | Promise<void>;
  onReject: (reason: string) => void | Promise<void>;
  onClarify: (reason: string) => void | Promise<void>;
  minReasonLength?: number;
  maxReasonLength?: number;
};

type BusyAction = "approve" | "reject" | "clarify" | null;

const DEFAULT_MIN_REASON_LENGTH = 5;
const DEFAULT_MAX_REASON_LENGTH = 500;

export default function HandoutApproverDecisionCard({
  canApprove,
  canReject,
  canClarify,
  onApprove,
  onReject,
  onClarify,
  minReasonLength = DEFAULT_MIN_REASON_LENGTH,
  maxReasonLength = DEFAULT_MAX_REASON_LENGTH,
}: Props) {
  const [reason, setReason] = useState("");
  const [reasonTouched, setReasonTouched] = useState(false);
  const [busy, setBusy] = useState<BusyAction>(null);

  if (!canApprove && !canReject && !canClarify) return null;

  const trimmedReason = reason.trim();
  const isReasonValid = trimmedReason.length >= minReasonLength;
  const isBusy = busy !== null;

  const reasonError =
    reasonTouched && !isReasonValid
      ? `Enter at least ${minReasonLength} characters.`
      : undefined;

  const submitDecision = async (action: Exclude<BusyAction, null>) => {
    if (isBusy) return;
    if (action !== "approve") {
      setReasonTouched(true);
      if (!isReasonValid) return;
    }
    setBusy(action);
    try {
      if (action === "approve") {
        await onApprove();
      } else if (action === "reject") {
        await onReject(trimmedReason);
      } else {
        await onClarify(trimmedReason);
      }
      setReason("");
      setReasonTouched(false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card
      className="activity-form-view-panel handout-decision-card"
      accordion
      defaultExpanded
      title="Request awaiting approval"
    >
      <section aria-label="Your decision" aria-busy={isBusy}>
        <p className="mb-3 text-sm text-iron-muted">
          Approve to send it to the delivery team, reject it outright, or send
          it back to the requester for clarification.
        </p>

        <TextareaInput
          name="handout-decision-reason"
          label="Reason"
          value={reason}
          placeholder="Required to reject or send for clarification"
          rows={3}
          disabled={isBusy}
          required
          maxLength={maxReasonLength}
          helperText="Required to reject or send for clarification."
          error={reasonError}
          onChange={(event) => {
            setReason(event.target.value);
            if (reasonTouched) setReasonTouched(false);
          }}
        />

        <div className="approval-decision-card-actions mt-2 flex flex-col gap-2">
          {canApprove && (
            <Button
              type="button"
              text={busy === "approve" ? "Approving..." : "Approve"}
              size="sm"
              appearance="standard"
              variant="brand"
              disabled={isBusy}
              onClick={() => void submitDecision("approve")}
            />
          )}
          {canClarify && (
            <Button
              type="button"
              text={
                busy === "clarify" ? "Sending..." : "Send for clarification"
              }
              size="sm"
              appearance="standard"
              variant="outline"
              disabled={isBusy}
              onClick={() => void submitDecision("clarify")}
            />
          )}
          {canReject && (
            <Button
              type="button"
              text={busy === "reject" ? "Rejecting..." : "Reject"}
              size="sm"
              appearance="standard"
              variant="outline"
              disabled={isBusy}
              onClick={() => void submitDecision("reject")}
            />
          )}
        </div>
      </section>
    </Card>
  );
}
