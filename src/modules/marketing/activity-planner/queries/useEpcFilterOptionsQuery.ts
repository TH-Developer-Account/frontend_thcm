import { useQuery } from "@tanstack/react-query";
import { ServerAxios } from "../../../../services/ServerAxios";
import { EPC_ZONE_OPTIONS } from "../utils/constants";

type OptionItem = { label: string; value: string };

const fetchZoneOptions = async (): Promise<OptionItem[]> => {
	try {
		const { data } = await ServerAxios.get("/epc/zones");
		return data.data.map((z: { name: string; id: string }) => ({
			label: z.name,
			value: z.id,
		}));
	} catch {
		return EPC_ZONE_OPTIONS; // fallback to hardcoded
	}
};

const fetchEventTypeOptions = async (): Promise<OptionItem[]> => {
	const { data } = await ServerAxios.get("/epc/event-types");
	return data.data.map((t: { name: string; id: string }) => ({
		label: t.name,
		value: t.id,
	}));
};

export const useZoneOptionsQuery = () =>
	useQuery({
		queryKey: ["epc-zone-options"],
		queryFn: fetchZoneOptions,
		staleTime: 5 * 60 * 1000, // 5 min — these don't change often
	});

export const useEventTypeOptionsQuery = () =>
	useQuery({
		queryKey: ["epc-event-type-options"],
		queryFn: fetchEventTypeOptions,
		staleTime: 5 * 60 * 1000,
	});
