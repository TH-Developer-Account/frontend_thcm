// modules/audit/dealerAudit/hooks/useChecklistItemDraft.ts
//
// Editable draft for ONE checklist item (dealer self-assessment).
//
//  • The server copy (query cache) and the draft are kept apart; a refetch
//    never overwrites what the user is typing.
//  • Drafts survive navigating to another item (module-level Map, memory
//    only — nothing audit-related is written to browser storage).
//  • Autosave is debounced and only fires for valid, settled drafts.
//  • "Save & complete" validates everything and is the only way an item
//    becomes complete.

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type Dispatch,
	type SetStateAction,
} from "react";

import { DEALER_AUDIT_RULES } from "../dealer-audit.config";
import { auditExecutionContent as content } from "../../shared/execution/audit-execution.content";
import {
	mapItemToFormValues,
} from "../dealer-audit.mappers";
import {
	collectSelfItemIssues,
	toSelfSnapshot,
	type ItemFieldName,
} from "../../shared/execution/audit-execution.validation";
import type {
	ChecklistItemFormValues,
	DealerAuditChecklistItem,
} from "../dealer-audit.types";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import type { LivePhotoValue } from "../../shared/checklist/evidence.types";
import type { SaveStatus } from "../../shared/execution/audit-execution.types";
import { useSaveAuditItem } from "./useDealerAuditMutations";


/** In-memory only. Cleared on refresh by design (privacy: no storage). */
const draftStore = new Map<string, ChecklistItemFormValues>();

export const clearAuditDrafts = (auditId?: string): void => {
	if (!auditId) {
		draftStore.clear();
		return;
	}
	for (const key of [...draftStore.keys()]) {
		if (key.startsWith(`${auditId}:`)) draftStore.delete(key);
	}
};

const evidenceSignature = (evidence: readonly LivePhotoValue[]): string =>
	evidence.map((photo) => `${photo.id}:${photo.uploadStatus}`).join("|");

export const isSameFormValues = (
	a: ChecklistItemFormValues,
	b: ChecklistItemFormValues,
): boolean =>
	a.score === b.score &&
	a.remarks === b.remarks &&
	evidenceSignature(a.evidence) === evidenceSignature(b.evidence);

export type ItemFieldErrors = Partial<Record<ItemFieldName, string>>;

interface UseChecklistItemDraftOptions {
	auditId: string;
	item: DealerAuditChecklistItem;
	editable: boolean;
}

export interface ChecklistItemDraft {
	values: ChecklistItemFormValues;
	setScore: (score: number) => void;
	setRemarks: (remarks: string) => void;
	/** Functional update — safe for concurrent photo uploads. */
	updateEvidence: (
		updater: (previous: LivePhotoValue[]) => LivePhotoValue[],
	) => void;
	errors: ItemFieldErrors;
	isDirty: boolean;
	isUploading: boolean;
	saveStatus: SaveStatus;
	saveError: string | null;
	isSaving: boolean;
	saveDraft: () => Promise<boolean>;
	saveAndComplete: () => Promise<boolean>;
	/** Saves a dirty draft before the user leaves; false = stay here. */
	confirmLeave: () => Promise<boolean>;
	discard: () => void;
}

export function useChecklistItemDraft({
	auditId,
	item,
	editable,
}: UseChecklistItemDraftOptions): ChecklistItemDraft {
	const key = `${auditId}:${item.id}`;
	const baseline = useMemo(() => mapItemToFormValues(item), [item]);

	const [values, setValuesState] = useState<ChecklistItemFormValues>(
		() => draftStore.get(key) ?? baseline,
	);
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const [saveError, setSaveError] = useState<string | null>(null);
	const [hasAttemptedComplete, setHasAttemptedComplete] = useState(false);

	const { mutateAsync: saveItem } = useSaveAuditItem();

	const isDirty = !isSameFormValues(values, baseline);
	const isUploading = values.evidence.some(
		(photo) => photo.uploadStatus === "LOCAL" || photo.uploadStatus === "UPLOADING",
	);

	// Latest values for async callbacks (no stale closures).
	const latest = useRef({ values, isDirty, isUploading });
	useEffect(() => {
		latest.current = { values, isDirty, isUploading };
	}, [values, isDirty, isUploading]);

	// Any user edit clears a stale "saved"/"failed" indicator.
	const setValues: Dispatch<SetStateAction<ChecklistItemFormValues>> =
		useCallback((update) => {
			setValuesState(update);
			setSaveStatus((current) => (current === "saving" ? current : "idle"));
		}, []);

	// Keep the draft across item navigation; drop it once it matches the server.
	useEffect(() => {
		if (isDirty) draftStore.set(key, values);
		else draftStore.delete(key);
	}, [isDirty, key, values]);

	const errors = useMemo<ItemFieldErrors>(() => {
		const issues = collectSelfItemIssues(
			item,
			toSelfSnapshot(values),
			hasAttemptedComplete ? "complete" : "draft",
		);
		const result: ItemFieldErrors = {};
		for (const issue of issues) {
			if (!result[issue.field]) result[issue.field] = issue.message;
		}
		return result;
	}, [hasAttemptedComplete, item, values]);

	const runSave = useCallback(
		async (markComplete: boolean): Promise<boolean> => {
			const current = latest.current.values;
			const issues = collectSelfItemIssues(
				item,
				toSelfSnapshot(current),
				markComplete ? "complete" : "draft",
			);
			if (issues.length > 0) {
				if (markComplete) setHasAttemptedComplete(true);
				return false;
			}

			setSaveStatus("saving");
			setSaveError(null);
			try {
				await saveItem({ auditId, itemId: item.id, values: current, markComplete });
				setSaveStatus("saved");
				return true;
			} catch (error) {
				setSaveStatus("failed");
				setSaveError(getAuditActionErrorMessage(error, "checklist item"));
				return false;
			}
		},
		[auditId, item, saveItem],
	);

	// Debounced autosave — valid, settled, dirty drafts only. A failed save
	// is NOT retried automatically (that would loop); the user retries.
	useEffect(() => {
		if (!editable || !isDirty || isUploading) return;
		if (saveStatus === "saving" || saveStatus === "failed") return;
		if (collectSelfItemIssues(item, toSelfSnapshot(values), "draft").length > 0) {
			return;
		}
		const timer = window.setTimeout(() => {
			void runSave(false);
		}, DEALER_AUDIT_RULES.autosaveDelayMs);
		return () => window.clearTimeout(timer);
	}, [editable, isDirty, isUploading, item, runSave, saveStatus, values]);

	// Warn on refresh / tab close while there is unsaved work.
	useEffect(() => {
		if (!isDirty && !isUploading) return;
		const handler = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [isDirty, isUploading]);

	const confirmLeave = useCallback(async (): Promise<boolean> => {
		const { isDirty: dirty, isUploading: uploading } = latest.current;
		if (!dirty) return true;
		if (uploading) return window.confirm(content.item.leaveWhileUploading);
		if (await runSave(false)) return true;
		return window.confirm(content.item.leaveWithUnsavedDraft);
	}, [runSave]);

	const discard = useCallback(() => {
		draftStore.delete(key);
		setValuesState(baseline);
		setSaveStatus("idle");
		setSaveError(null);
		setHasAttemptedComplete(false);
	}, [baseline, key]);

	return {
		values,
		setScore: (score) => setValues((current) => ({ ...current, score })),
		setRemarks: (remarks) => setValues((current) => ({ ...current, remarks })),
		updateEvidence: (updater) =>
			setValues((current) => ({
				...current,
				evidence: updater(current.evidence),
			})),
		errors,
		isDirty,
		isUploading,
		saveStatus,
		saveError,
		isSaving: saveStatus === "saving",
		saveDraft: () => runSave(false),
		saveAndComplete: () => runSave(true),
		confirmLeave,
		discard,
	};
}
