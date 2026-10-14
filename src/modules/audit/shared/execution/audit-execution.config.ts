// modules/audit/shared/execution/audit-execution.config.ts
//
// Rules the shared execution UI depends on. Module configs (dealer, factory)
// spread this into their own rules so the values stay in one place.

export const AUDIT_EXECUTION_RULES = {
	evidence: {
		/** Used ONLY when a parameter says evidence is required but sets no limits. */
		defaultMinCount: 1,
		defaultMaxCount: 3,
		locationRequired: true,
		locationTimeoutMs: 10_000,
		/**
		 * Best-effort "live capture" check: a photo whose file timestamp is
		 * older than this was almost certainly not taken just now. The real
		 * enforcement must be server-side (capture time vs upload time).
		 */
		maxCaptureAgeMs: 5 * 60 * 1000,
	},

	text: {
		remarksMaxLength: 500,
		clarificationMaxLength: 1000,
		reasonMinLength: 3,
		reasonMaxLength: 1000,
	},

	swipe: {
		minDistancePx: 70,
		/** |dx| must exceed |dy| by this factor to count as horizontal. */
		directionRatio: 1.25,
	},
} as const;
