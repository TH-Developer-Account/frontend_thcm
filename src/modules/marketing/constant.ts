import type { LineItemOption } from "./types";

export const epc_api_routes = {
  epc_listing_route: "/epc",
};

export const status = {
  RECOMMENDED: "Recommended",
  PENDING: "Pending",
  SENT_BACK: "Sent Back",
  REPORT_SUBMITTED: "Report Submitted",
  APPROVED: "Approved",
  SUBMITTED: "Submitted",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
} as const;

export const buildLineItemPayload = (
  items: LineItemOption[],
  extraPayload: Record<string, unknown>,
) => {
  return {
    ...extraPayload,
    lineItems: items.map((item) => ({
      productId: item.value, // 👈 map value → productId
      quantity: item.quantity,
    })),
  };
};
