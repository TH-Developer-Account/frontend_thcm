const DEALER_AUDIT_BASE_PATH = "/audit/dealer";
const CHECKLIST_TEMPLATE_BASE_PATH = `${DEALER_AUDIT_BASE_PATH}/checklist`;

const AUDIT_REPORTS_PATH = `${DEALER_AUDIT_BASE_PATH}/reports`;

const AUDITS_PATH = `${DEALER_AUDIT_BASE_PATH}/audits`;

const DEALERS_PATH = `${DEALER_AUDIT_BASE_PATH}/dealers`;

const auditPath = (auditId: string): string =>
	`${AUDITS_PATH}/${encodeURIComponent(auditId)}`;

export const DEALER_AUDIT_ROUTES = {
	home: "/",

	root: DEALER_AUDIT_BASE_PATH,
	dashboard: `${DEALER_AUDIT_BASE_PATH}/dashboard`,

	// Role landing screens.
	tracker: `${DEALER_AUDIT_BASE_PATH}/tracker`,
	myAudits: `${DEALER_AUDIT_BASE_PATH}/my-audits`,
	reviewQueue: `${DEALER_AUDIT_BASE_PATH}/review-queue`,
	approvals: `${DEALER_AUDIT_BASE_PATH}/approvals`,

	// Audit cycle (one launch = many dealer audits).
	cycles: {
		create: `${DEALER_AUDIT_BASE_PATH}/cycles/create`,
	},

	template: {
		root: CHECKLIST_TEMPLATE_BASE_PATH,
		list: `${CHECKLIST_TEMPLATE_BASE_PATH}/listing`,
		create: `${CHECKLIST_TEMPLATE_BASE_PATH}/create`,

		view: (templateId: string) =>
			`${CHECKLIST_TEMPLATE_BASE_PATH}/${encodeURIComponent(templateId)}`,

		edit: (templateId: string) =>
			`${CHECKLIST_TEMPLATE_BASE_PATH}/${encodeURIComponent(templateId)}/edit`,
	},

	// Audit instances (the quarterly / yearly audits themselves).
	audits: {
		root: AUDITS_PATH,
		list: AUDITS_PATH,
		create: `${AUDITS_PATH}/create`,

		detail: auditPath,
		report: (auditId: string) => `${auditPath(auditId)}/report`,
		submit: (auditId: string) => `${auditPath(auditId)}/submit`,
		status: (auditId: string) => `${auditPath(auditId)}/status`,
		reviewSummary: (auditId: string) => `${auditPath(auditId)}/review-summary`,
		approval: (auditId: string) => `${auditPath(auditId)}/approval`,
	},

	execution: {
		checklist: (auditId: string) =>
			`${DEALER_AUDIT_BASE_PATH}/${auditId}/checklist`,

		item: (auditId: string, itemId: string) =>
			`${DEALER_AUDIT_BASE_PATH}/${auditId}/checklist/${itemId}`,
	},

	reports: {
		root: AUDIT_REPORTS_PATH,

		view: (reportId: string) => `${AUDIT_REPORTS_PATH}/${reportId}`,
	},

	dealers: {
		root: DEALERS_PATH,

		view: (dealerId: string) => `${DEALERS_PATH}/${dealerId}`,
	},

	profile: `${DEALER_AUDIT_BASE_PATH}/profile`,
} as const;
