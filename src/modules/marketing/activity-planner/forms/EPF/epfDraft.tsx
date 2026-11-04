// utils/epfDraft.ts
// Local (per-browser) draft for a brand-new EPF, keyed by EPC id.
//
// Purpose: don't lose typed data on refresh / Back, and never resurrect stale
// numbers. Only fields the user actually types are stored — every derived or
// live figure (CRF total, budgets, shares) is recomputed from current CRF and
// budget data when the form mounts, so an old draft can't contradict them.
//
// Drafts are only used while creating an EPF. Once an EPF exists on the
// server, the server copy is the single source of truth.

import type { LineItemOption } from "../../types/epc.types";
import type { EpfFormValues } from "../../types/epf.types";

const VERSION = 1;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const keyFor = (epcId: string) => `epfDraft:v${VERSION}:${epcId}`;

/** Never persisted — always derived from live CRF / budget data. */
const LIVE_FIELDS: (keyof EpfFormValues)[] = [
	"crfTotal",
	"eventBudget",
	"annualBudget",
	"availableBudget",
	"allotedBudget",
	"dealerShare",
	"tataHitachiPercent",
	"tataHitachiShare",
	"totalParticipants",
];

export type EpfDraft = {
	savedAt: number;
	values: Partial<EpfFormValues>;
	costItems: LineItemOption[];
};

/**
 * Saves the draft. Returns the save timestamp, or null when there was nothing
 * worth saving (untouched form) or storage is unavailable.
 */
export const saveEpfDraft = (
	epcId: string,
	values: EpfFormValues,
	costItems: LineItemOption[],
): number | null => {
	try {
		const stored: Partial<EpfFormValues> = { ...values };
		LIVE_FIELDS.forEach((field) => {
			delete stored[field];
		});

		const nothingEntered =
			costItems.length === 0 &&
			!stored.externalParticipants &&
			!stored.internalParticipants &&
			!stored.dealerPercent;

		if (nothingEntered) return null;

		const savedAt = Date.now();

		const draft: EpfDraft = {
			savedAt,
			values: stored,
			// File objects and blob preview URLs can't be serialised. Attachments
			// that already finished uploading keep their S3 key and survive.
			costItems: costItems.map((item) => ({
				...item,
				quotationFile: null,
				quotationFileUrl: undefined,
			})),
		};

		localStorage.setItem(keyFor(epcId), JSON.stringify(draft));
		return savedAt;
	} catch {
		return null;
	}
};

export const loadEpfDraft = (epcId: string): EpfDraft | null => {
	try {
		const raw = localStorage.getItem(keyFor(epcId));
		if (!raw) return null;

		const draft = JSON.parse(raw) as EpfDraft;

		if (
			typeof draft?.savedAt !== "number" ||
			Date.now() - draft.savedAt > MAX_AGE_MS
		) {
			localStorage.removeItem(keyFor(epcId));
			return null;
		}

		return {
			savedAt: draft.savedAt,
			values: draft.values ?? {},
			costItems: Array.isArray(draft.costItems) ? draft.costItems : [],
		};
	} catch {
		return null;
	}
};

export const clearEpfDraft = (epcId: string) => {
	try {
		localStorage.removeItem(keyFor(epcId));
	} catch {
		/* storage unavailable — nothing to clear */
	}
};
