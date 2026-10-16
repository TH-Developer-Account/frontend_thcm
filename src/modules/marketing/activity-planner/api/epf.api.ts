import { ServerAxios } from "../../../../services/ServerAxios";
import type {
  EpfCreatePayload,
  EpfDetailResponse,
  EpfUpdatePayload,
} from "../types/epf.types";

export type UploadLineItemAttachmentResponse = {
  s3Key: string;
  fileName: string;
};

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

  getProducts: async () => {
    const {
      data: { data },
    } = await ServerAxios.get("/master-data/products", {
      params: { productType: "EPF" },
    });

    return data;
  },

  // Upload-first: the proposer picks a file before the line item (and
  // often before the EPF itself) exists, so this uploads straight away
  // and hands back an S3 key the caller threads through as
  // lineItems[].attachmentS3Key on the subsequent create/update call.
  // See modules/map/epf.controller.ts's uploadLineItemAttachment — same
  // `res.json({...})` shape as getById/create/update above, so the
  // response is unwrapped the same way (`data: { data }`).
  uploadLineItemAttachment: async (
    epcId: string,
    file: File,
  ): Promise<UploadLineItemAttachmentResponse> => {
    const formData = new FormData();
    formData.append("epcId", epcId);
    formData.append("file", file);

    const {
      data: { data },
    } = await ServerAxios.post("/epf/line-item/attachment", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return data;
  },
};
