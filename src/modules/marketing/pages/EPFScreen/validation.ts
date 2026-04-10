import { type EpfFormValues } from "../../types";

const n = (val: any) => Number(val) || 0;

export const validateEpfForm = (values: EpfFormValues) => {
	const errors: Partial<Record<keyof EpfFormValues, string>> = {};

	const checks = [
		{
			key: "externalParticipants",
			label: "External participants",
			ok: n(values.externalParticipants) > 0,
		},
		{
			key: "internalParticipants",
			label: "Internal participants",
			ok: n(values.internalParticipants) > 0,
		},
		{
			key: "crfTotal",
			label: "CRF total",
			ok: n(values.crfTotal) > 0,
		},
		{
			key: "eventBudget",
			label: "Event budget",
			ok: n(values.eventBudget) > 0,
		},
		{
			key: "annualBudget",
			label: "Annual budget",
			ok: n(values.annualBudget) > 0,
		},
		{
			key: "dealerName",
			label: "Dealer name",
			ok: values.dealerName.trim().length > 0,
		},
		{
			key: "dealerPercent",
			label: "Dealer % (0–100)",
			ok: n(values.dealerPercent) > 0 && n(values.dealerPercent) <= 100,
		},
		{
			key: "tataHitachiPoAmount",
			label: "TH PO amount",
			ok: n(values.tataHitachiPoAmount) > 0,
		},
		{
			key: "proposedBy",
			label: "Proposed by",
			ok: values.proposedBy.trim().length > 0,
		},
		{
			key: "checkedBy",
			label: "Checked by",
			ok: values.checkedBy.trim().length > 0,
		},
		{
			key: "approvedBy",
			label: "Approved by",
			ok: values.approvedBy.trim().length > 0,
		},
	];

	// 🔥 Build errors from failed checks
	checks.forEach((check) => {
		if (!check.ok) {
			errors[check.key as keyof EpfFormValues] =
				`${check.label} is required or invalid`;
		}
	});

	const filled = checks.filter((c) => c.ok).length;
	const allOk = filled === checks.length;

	return {
		errors,
		isValid: allOk,
		progress: {
			filled,
			total: checks.length,
			percentage: Math.round((filled / checks.length) * 100),
		},
	};
};
