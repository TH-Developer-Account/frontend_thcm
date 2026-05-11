import React from "react";
import { ServerAxios } from "../../../../services/ServerAxios";
import type { EpcDetailResponse } from "./types/ActivityView.types";

export const useActivityPlannerView = (epcId?: string) => {
	const [epcData, setEpcData] = React.useState<EpcDetailResponse | null>(null);
	const [loading, setLoading] = React.useState(false);
	const [editingSection, setEditingSection] = React.useState<
		"epc" | "crf" | "epf" | null
	>(null);

	const fetchEpc = React.useCallback(async () => {
		if (!epcId) return;

		try {
			setLoading(true);

			const {
				data: { data },
			} = await ServerAxios.get(`/epc/${epcId}`);

			setEpcData(data);
		} finally {
			setLoading(false);
		}
	}, [epcId]);

	React.useEffect(() => {
		void fetchEpc();
	}, [fetchEpc]);

	return {
		epcData,
		loading,
		editingSection,
		setEditingSection,
		refetch: fetchEpc,
	};
};
