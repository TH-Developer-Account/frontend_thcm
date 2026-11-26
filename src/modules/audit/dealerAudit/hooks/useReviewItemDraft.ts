// modules/audit/dealerAudit/hooks/useReviewItemDraft.ts
//
// Editable draft for ONE item's reviewer assessment. Reviews are decisions,
// so there is no autosave: the reviewer saves explicitly. The draft survives
// moving between items (memory only) and warns before it would be lost.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { auditExecutionContent as content } from "../../shared/execution/audit-execution.content";
import { mapItemToReviewFormValues } from "../dealer-audit.mappers";
import {
	collectReviewItemIssues,
	type ReviewFieldName,
} from "../../shared/execution/audit-execution.validation";
import type {
	DealerAuditChecklistItem,
	ReviewItemFormValues,
} from "../dealer-audit.types";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import type { SaveStatus } from "../../shared/execution/audit-execution.types";
import { useReviewAuditItem } from "./useDealerAuditMutations";

const reviewDraftStore = new Map<string, ReviewItemFormValues>();

export const clearReviewDrafts = (auditId?: string): void => {
	if (!auditId) {
		reviewDraftStore.clear();
		return;
	}
	for (const key of [...reviewDraftStore.keys()]) {
		if (key.startsWith(`${auditId}:`)) reviewDraftStore.delete(key);
	}
};

export const isSameReviewValues = (
	a: ReviewItemFormValues,
	b: ReviewItemFormValues,
): boolean =>
	a.score === b.score &&
	a.remarks === b.remarks &&
	a.decision === b.decision &&
	a.scoreChangeReason === b.scoreChangeReason;

export type ReviewFieldErrors = Partial<Record<ReviewFieldName, string>>;

interface UseReviewItemDraftOptions {
	auditId: string;
	item: DealerAuditChecklistItem;
}

export interface ReviewItemDraft {
	values: ReviewItemFormValues;
	setScore: (score: number) => void;
	setRemarks: (remarks: string) => void;
	setDecision: (decision: ReviewItemFormValues["decision"]) => void;
	setScoreChangeReason: (reason: string) => void;
	errors: ReviewFieldErrors;
	isDirty: boolean;
	saveStatus: SaveStatus;
	saveError: string | null;
	isSaving: boolean;
	/** Validates, then saves. false = invalid or the request failed. */
	save: () => Promise<boolean>;
	confirmLeave: () => Promise<boolean>;
	discard: () => void;
}

export function useReviewItemDraft({
	auditId,
	item,
}: UseReviewItemDraftOptions): ReviewItemDraft {
	const key = `${auditId}:${item.id}`;
	const baseline = useMemo(() => mapItemToReviewFormValues(item), [item]);

	const [values, setValues] = useState<ReviewItemFormValues>(
		() => reviewDraftStore.get(key) ?? baseline,
	);
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const [saveError, setSaveError] = useState<string | null>(null);
	const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

	const { mutateAsync: reviewItem } = useReviewAuditItem();

	const isDirty = !isSameReviewValues(values, baseline);
	const latest = useRef({ values, isDirty });
	useEffect(() => {
		latest.current = { values, isDirty };
	}, [values, isDirty]);

	useEffect(() => {
		if (isDirty) reviewDraftStore.set(key, values);
		else reviewDraftStore.delete(key);
	}, [isDirty, key, values]);

	useEffect(() => {
		if (!isDirty) return;
		const handler = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [isDirty]);

	const errors = useMemo<ReviewFieldErrors>(() => {
		const result: ReviewFieldErrors = {};
		for (const issue of collectReviewItemIssues(
			item,
			item.self.score,
			values,
			hasAttemptedSave ? "complete" : "draft",
		)) {
			if (!result[issue.field]) result[issue.field] = issue.message;
		}
		return result;
	}, [hasAttemptedSave, item, values]);

	const update = useCallback((patch: Partial<ReviewItemFormValues>) => {
		setValues((current) => ({ ...current, ...patch }));
		setSaveStatus((current) => (current === "saving" ? current : "idle"));
	}, []);

	const save = useCallback(async (): Promise<boolean> => {
		const current = latest.current.values;
		const issues = collectReviewItemIssues(
			item,
			item.self.score,
			current,
			"complete",
		);
		if (issues.length > 0) {
			setHasAttemptedSave(true);
			return false;
		}
		setSaveStatus("saving");
		setSaveError(null);
		try {
			await reviewItem({
				auditId,
				itemId: item.id,
				values: current,
				selfScore: item.self.score,
			});
			setSaveStatus("saved");
			return true;
		} catch (error) {
			setSaveStatus("failed");
			setSaveError(getAuditActionErrorMessage(error, "review"));
			return false;
		}
	}, [auditId, item, reviewItem]);

	const confirmLeave = useCallback(async (): Promise<boolean> => {
		if (!latest.current.isDirty) return true;
		return window.confirm(content.item.leaveWithUnsavedDraft);
	}, []);

	const discard = useCallback(() => {
		reviewDraftStore.delete(key);
		setValues(baseline);
		setSaveStatus("idle");
		setSaveError(null);
		setHasAttemptedSave(false);
	}, [baseline, key]);

	return {
		values,
		setScore: (score) => update({ score }),
		setRemarks: (remarks) => update({ remarks }),
		setDecision: (decision) =>
			// Accepting the dealer's answer keeps their score unless changed.
			update(
				decision === "ACCEPTED" &&
					latest.current.values.score === null &&
					item.self.score !== null
					? { decision, score: item.self.score }
					: { decision },
			),
		setScoreChangeReason: (scoreChangeReason) => update({ scoreChangeReason }),
		errors,
		isDirty,
		saveStatus,
		saveError,
		isSaving: saveStatus === "saving",
		save,
		confirmLeave,
		discard,
	};
}
