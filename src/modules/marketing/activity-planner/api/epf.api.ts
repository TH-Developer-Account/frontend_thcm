import { ServerAxios } from "../../../../services/ServerAxios";
import type {
	EpfCreatePayload,
	EpfDetailResponse,
	EpfUpdatePayload,
} from "../types/epf.types";

export const epfApi = {
	getById: async (epfId: string): Promise<EpfDetailResponse> => {
		const {
			data: { data },
		} = await ServerAxios.get(`/epf/${epfId}`);

		return data;
	},

	// create: async (payload: EpfCreatePayload) => {
	// 	const {
	// 		data: { data },
	// 	} = await ServerAxios.post("/epf", payload);

	// 	return data;
	// },
	create: async (payload: EpfCreatePayload | FormData) => {
		const {
			data: { data },
		} = await ServerAxios.post("/epf", payload, {
			headers:
				payload instanceof FormData
					? { "Content-Type": "multipart/form-data" }
					: undefined,
		});

		return data;
	},
	// update: async (epfId: string, payload: EpfUpdatePayload) => {
	// 	const {
	// 		data: { data },
	// 	} = await ServerAxios.put(`/epf/${epfId}`, payload);

	// 	return data;
	// },
	update: async (epfId: string, payload: EpfUpdatePayload | FormData) => {
		const {
			data: { data },
		} = await ServerAxios.put(`/epf/${epfId}`, payload, {
			headers:
				payload instanceof FormData
					? { "Content-Type": "multipart/form-data" }
					: undefined,
		});

		return data;
	},
	uploadLineItemAttachment: async ({
		epcId,
		file,
	}: {
		epcId: string;
		file: File;
	}) => {
		const formData = new FormData();
		formData.append("epcId", epcId);
		formData.append("file", file);

		const res = await ServerAxios.post("/epf/line-item/attachment", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		// Same `{ data }` envelope as the other epfApi calls; falls back to the raw body.
		return (res.data?.data ?? res.data) as { s3Key: string; fileName?: string };
	},

	getProducts: async () => {
		const {
			data: { data },
		} = await ServerAxios.get("/master-data/products", {
			params: { productType: "EPF" },
		});

		return data;
	},
};
