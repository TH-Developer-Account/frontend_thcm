/**
 * Moved out of useBusinessPartnerForm.ts when that hook was retired (General
 * and Organization tabs migrated to useBPGeneralInfoCardForm /
 * useBPOrganizationInfoCardForm). Route paths have nothing to do with form
 * state, so they get their own file rather than living inside a hook.
 */
export const businessPartnerPaths = {
	list: () => "/admin/business-partners",
	create: () => "/admin/business-partners/create",
	view: (id: string) =>
		`/admin/business-partners/${encodeURIComponent(id)}/view`,
	edit: (id: string) =>
		`/admin/business-partners/${encodeURIComponent(id)}/edit`,
};
