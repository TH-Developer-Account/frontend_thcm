import type {
	EpcCreatePayload,
	EpcFormValues,
	EpcUpdatePayload,
} from "../../types/epc.types";

const toNumber = (value: unknown, fallback = 0) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const toApiDate = (value?: string | null): string => {
	if (!value) return "";

	// Already correct API format
	if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return value;
	}

	// DD/MM/YYYY
	const slashMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

	if (slashMatch) {
		const [, day, month, year] = slashMatch;
		return `${year}-${month}-${day}`;
	}

	// DD-MM-YYYY
	const dashMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);

	if (dashMatch) {
		const [, day, month, year] = dashMatch;
		return `${year}-${month}-${day}`;
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid EPC date: ${value}`);
	}

	return [
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, "0"),
		String(date.getDate()).padStart(2, "0"),
	].join("-");
};

export const buildEpcCreatePayload = (
	values: EpcFormValues,
): EpcCreatePayload => {
	const proposalNumber = values.proposal_number || values.epfNo;

	return {
		...values,
		epfNo: proposalNumber,
		proposal_number: proposalNumber,
		event_scale: toNumber(values.event_scale),

		event_from_date: toApiDate(values.event_from_date),
		event_to_date: toApiDate(values.event_to_date),
	};
};

export const buildEpcUpdatePayload = (
	values: EpcFormValues,
): EpcUpdatePayload => {
	const proposalNumber = values.proposal_number || values.epfNo;

	return {
		proposal_number: proposalNumber,
		budget_master_id: values.budget_master_id,
		event_name_id: values.event_name,

		event_scale: toNumber(values.event_scale),
		event_description: values.event_description,

		event_from_date: toApiDate(values.event_from_date),
		event_to_date: toApiDate(values.event_to_date),

		location: values.location,
		event_objective: values.event_objective,
	};
};
