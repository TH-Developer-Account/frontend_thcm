import { ServerAxios } from "../../../../../services/ServerAxios";
import { epcApi } from "../../../activity-planner/api/epc.api";

import { mapLeadResponseToRows } from "../helpers/lead.mapper";
import { groupLeadsByEvent } from "../helpers/groupLeadsByEvent";

import type {
	LeadEventDetails,
	LeadEventGroup,
	LeadRow,
} from "../types/leads.types";

const getLeadListFromResponse = (response: any) => {
	return (
		response.data?.data?.leads ||
		response.data?.data ||
		response.data?.leads ||
		[]
	);
};

const getUniqueEpcIds = (leads: LeadRow[]) => {
	return Array.from(new Set(leads.map((lead) => lead.epcId).filter(Boolean)));
};

const unwrapEpc = (response: any) => {
	return response?.data?.data ?? response?.data ?? response;
};

const mapEpcToLeadEventDetails = (
	epcId: string,
	response: any,
): LeadEventDetails => {
	const epc = unwrapEpc(response);

	return {
		epcId,
		event_name:
			epc?.event_name?.title ??
			epc?.event_name?.name ??
			epc?.event_name ??
			"--",
		location: epc?.location ?? "--",
		created_at: epc?.created_at,
	};
};

const buildEpcDetailsMap = async (epcIds: string[]) => {
	const results = await Promise.allSettled(
		epcIds.map(async (epcId) => {
			const epcResponse = await epcApi.getById(epcId);
			return [epcId, mapEpcToLeadEventDetails(epcId, epcResponse)] as const;
		}),
	);

	const epcMap = new Map<string, LeadEventDetails>();

	results.forEach((result) => {
		if (result.status === "fulfilled") {
			const [epcId, epcDetails] = result.value;
			epcMap.set(epcId, epcDetails);
		}
	});

	return epcMap;
};

export const leadsApi = {
	getAll: async (): Promise<LeadEventGroup[]> => {
		const response = await ServerAxios.get("/leads/get-all-leads");

		const rawList = getLeadListFromResponse(response);
		const leadRows = mapLeadResponseToRows(rawList);

		if (!leadRows.length) return [];

		const epcIds = getUniqueEpcIds(leadRows);

		if (!epcIds.length) {
			return groupLeadsByEvent(leadRows);
		}

		const epcDetailsMap = await buildEpcDetailsMap(epcIds);

		return groupLeadsByEvent(leadRows, epcDetailsMap);
	},
};
