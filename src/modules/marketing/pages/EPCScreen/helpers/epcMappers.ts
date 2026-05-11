import type { EpcFormValues } from "../../../types";
import { formatDateOnly } from "./epcDate";

export const initialEpcValues: EpcFormValues = {
	epfNo: "",
	poDocumentRefNo: "",
	proposal_number: "",
	department: "",
	region: "",
	branch: "",
	budget_master_id: "",
	budgetDescription: "",
	vertical: "",
	event_scale: "",
	event_name: "",
	event_description: "",
	event_from_date: "",
	event_to_date: "",
	location: "",
	event_objective: "",
	status: "DRAFT",
};

const getNestedId = (data: any, nestedKey: string, fallbackKey: string) => {
	return data?.[nestedKey]?.id || data?.[fallbackKey] || "";
};

const getNestedDescription = (
	data: any,
	nestedKey: string,
	fallbackKey: string,
) => {
	return data?.[nestedKey]?.description || data?.[fallbackKey] || "";
};

export const normalizeEpcResponse = (response: any) => {
	return (
		response?.data?.data?.eventProposal ||
		response?.data?.data?.epc ||
		response?.data?.data ||
		response?.data ||
		response
	);
};

export const mapEpcResponseToForm = (epc: any): EpcFormValues => {
	return {
		epfNo: epc?.proposal_number || "",
		proposal_number: epc?.proposal_number || "",

		poDocumentRefNo: epc?.poDocumentRefNo || "",

		department: getNestedId(epc, "department", "departmentId"),
		region: getNestedId(epc, "region", "regionId"),
		branch: getNestedId(epc, "branch", "branchId"),

		budget_master_id:
			epc?.budget_master?.id ||
			epc?.budgetMaster?.id ||
			epc?.budget_master_id ||
			epc?.budgetMasterId ||
			"",

		budgetDescription:
			getNestedDescription(epc, "budget_master", "budgetDescription") ||
			epc?.budgetMaster?.description ||
			"",

		vertical: getNestedId(epc, "vertical", "verticalId"),

		event_scale: epc?.event_scale || "",

		event_name:
			epc?.event_name?.id ||
			epc?.eventName?.id ||
			epc?.event_name_id ||
			epc?.eventNameId ||
			"",

		event_description: epc?.event_description || "",
		event_from_date: formatDateOnly(epc?.event_from_date),
		event_to_date: formatDateOnly(epc?.event_to_date),
		location: epc?.location || "",
		event_objective: epc?.event_objective || "",
		status: epc?.status || "DRAFT",
	};
};
