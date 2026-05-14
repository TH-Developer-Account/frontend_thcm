// queries/epc.keys.ts
import type { EpcListParams } from "../types/epc.types";

export const epcKeys = {
	all: ["epc"] as const,
	lists: () => [...epcKeys.all, "list"] as const,
	list: (params: EpcListParams) => [...epcKeys.lists(), params] as const,
	details: () => [...epcKeys.all, "detail"] as const,
	detail: (epcId?: string | null) => [...epcKeys.details(), epcId] as const,
};
