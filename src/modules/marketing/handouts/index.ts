// handouts/index.ts
// Public API of the Handouts module. Routes lazy-load the pages directly;
// everything else imports only from here.

export { default as HandoutsPage } from "./HandoutsPage";
export { default as NewHandoutPage } from "./NewHandoutPage";
export { default as HandoutDetailPage } from "./HandoutDetailPage";
export { default as HandoutStatusPill } from "./HandoutStatusPill";

export { useHandoutPermissions } from "./useHandoutPermissions";
export { HANDOUTS_BASE_PATH, HANDOUT_APP, HANDOUT_MODULES } from "./handouts.constants";
export type {
	HandoutDetail,
	HandoutStatus,
	HandoutSummary,
	HandoutView,
} from "./handouts.types";
