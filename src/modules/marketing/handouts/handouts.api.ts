// handouts/handouts.api.ts
// Handouts API + query keys + hooks. Same layering as crf/core/api.ts:
// ServerAxios, a `*Keys` factory, thin useQuery / useMutation hooks. Mutations
// do NOT refresh anything — the calling page invalidates `handoutKeys.all`.
//
//   POST /handouts                  create + submit for approval
//   GET  /handouts?view=mine|approve|deliver&status&search&page&pageSize
//   GET  /handouts/approval-workflow   the two fixed roles, resolved to real users
//   GET  /handouts/:id              detail + server-computed `permissions`
//   POST /handouts/:id/approve
//   POST /handouts/:id/reject   { reason }   approver rejects outright
//   POST /handouts/:id/clarify  { reason }   approver sends it back to the requester
//   POST /handouts/:id/cancel   { reason }   requester withdraws the request
//   POST /handouts/:id/resubmit payload       requester edits and resends after clarification
//   POST /handouts/:id/cannot-fulfil { reason }   delivery team: no stock / cannot deliver
//   POST /handouts/:id/deliver  { handedToName, deliveredOn, note?, checkedSkus }
//
// Souvenir availability is NOT a handouts endpoint: it reuses the CRF shop's
// display-only POST /crf-shop/stock-check (never a reservation).

import { useMutation, useQuery } from "@tanstack/react-query";

import type { AuditApiAdapter } from "../../../components/ui/audit/audit.types";
import { ServerAxios } from "../../../services/ServerAxios";
import { crfShopApi, crfShopKeys } from "../crf";
import type {
  CreateHandoutPayload,
  DeliverHandoutPayload,
  HandoutApprovalWorkflow,
  HandoutDetail,
  HandoutItem,
  HandoutListParams,
  HandoutListResponse,
  ResubmitHandoutPayload,
} from "./handouts.types";

/* ========================================================================== */
/*                                    API                                     */
/* ========================================================================== */

const realApi = {
  list: async (params: HandoutListParams): Promise<HandoutListResponse> => {
    const {
      data: { data },
    } = await ServerAxios.get("/handouts", { params });
    return data;
  },

  get: async (id: string): Promise<HandoutDetail> => {
    const {
      data: { data },
    } = await ServerAxios.get(`/handouts/${id}`);
    return data;
  },

  /** The two fixed roles (approver, delivery person), resolved to real users. */
  getApprovalWorkflow: async (): Promise<HandoutApprovalWorkflow> => {
    const {
      data: { data },
    } = await ServerAxios.get("/handouts/approval-workflow");
    return data;
  },

  create: async (
    payload: CreateHandoutPayload,
  ): Promise<{ id: string; requestNumber: string }> => {
    const {
      data: { data },
    } = await ServerAxios.post("/handouts", payload);
    return data;
  },

  approve: async (id: string): Promise<void> => {
    await ServerAxios.post(`/handouts/${id}/approve`);
  },

  reject: async (id: string, reason: string): Promise<void> => {
    await ServerAxios.post(`/handouts/${id}/reject`, { reason });
  },

  clarify: async (id: string, reason: string): Promise<void> => {
    await ServerAxios.post(`/handouts/${id}/clarify`, { reason });
  },

  cancel: async (id: string, reason: string): Promise<void> => {
    await ServerAxios.post(`/handouts/${id}/cancel`, { reason });
  },

  resubmit: async (
    id: string,
    payload: ResubmitHandoutPayload,
  ): Promise<void> => {
    await ServerAxios.post(`/handouts/${id}/resubmit`, payload);
  },

  cannotFulfil: async (id: string, reason: string): Promise<void> => {
    await ServerAxios.post(`/handouts/${id}/cannot-fulfil`, { reason });
  },

  deliver: async (
    id: string,
    payload: DeliverHandoutPayload,
  ): Promise<void> => {
    await ServerAxios.post(`/handouts/${id}/deliver`, payload);
  },
};

export const handoutApi = realApi;

/* ========================================================================== */
/*                                    Keys                                    */
/* ========================================================================== */

export const handoutKeys = {
  all: ["handouts"] as const,
  list: (params: HandoutListParams) =>
    [...handoutKeys.all, "list", params] as const,
  detail: (id: string) => [...handoutKeys.all, "detail", id] as const,
  stock: (skuKey: string) => [...handoutKeys.all, "stock", skuKey] as const,
  approvalWorkflow: () => [...handoutKeys.all, "approval-workflow"] as const,
};

/* ========================================================================== */
/*                                   Hooks                                    */
/* ========================================================================== */

export function useHandoutsQuery(params: HandoutListParams) {
  return useQuery({
    queryKey: handoutKeys.list(params),
    queryFn: () => handoutApi.list(params),
    // Keep the old page on screen while the next *page of the same queue*
    // loads (no table flash) — but NOT across a `view` change. "mine",
    // "approve" and "deliver" are separate RBAC-scoped queues (see
    // handouts.services.ts listHandouts), so showing the previous queue's
    // rows while a different one loads would be showing the wrong data
    // under the new tab's header, not just a stale page of the right data.
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2]?.view === params.view
        ? previousData
        : undefined,
    // listHandouts rejects view=approve/deliver with a 403 for anyone who
    // isn't the configured approver/delivery person (by design, not a
    // transient failure) — retrying would just repeat the same 403 a few
    // times while the UI sits on stale data in the meantime.
    retry: false,
  });
}

export function useHandoutQuery(id: string | undefined) {
  return useQuery({
    queryKey: handoutKeys.detail(id ?? ""),
    queryFn: () => handoutApi.get(id as string),
    enabled: Boolean(id),
  });
}

/**
 * The two fixed roles, for the New Handout review step's Approval Workflow
 * display. A long staleTime is deliberate: unlike a live approval queue,
 * who the configured approver/delivery person is essentially never changes
 * mid-session, so there's no reason to refetch it on every render.
 */
export function useHandoutApprovalWorkflowQuery() {
  return useQuery({
    queryKey: handoutKeys.approvalWorkflow(),
    queryFn: () => handoutApi.getApprovalWorkflow(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateHandoutMutation() {
  return useMutation({ mutationFn: handoutApi.create });
}

export function useApproveHandoutMutation() {
  return useMutation({ mutationFn: (id: string) => handoutApi.approve(id) });
}

export function useRejectHandoutMutation() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      handoutApi.reject(id, reason),
  });
}

export function useClarifyHandoutMutation() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      handoutApi.clarify(id, reason),
  });
}

export function useCancelHandoutMutation() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      handoutApi.cancel(id, reason),
  });
}

export function useResubmitHandoutMutation() {
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ResubmitHandoutPayload;
    }) => handoutApi.resubmit(id, payload),
  });
}

export function useCannotFulfilHandoutMutation() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      handoutApi.cannotFulfil(id, reason),
  });
}

export function useDeliverHandoutMutation() {
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: DeliverHandoutPayload;
    }) => handoutApi.deliver(id, payload),
  });
}

/**
 * Live availability of a request's SKUs, for the approver and delivery team.
 * Display only — the CRF shop never reserves stock. Summed per SKU so two
 * lines of the same SKU are compared with the stock once.
 */
export function useHandoutStockQuery(items: HandoutItem[], enabled = true) {
  const bySku = new Map<string, number>();
  for (const item of items) {
    bySku.set(item.sku, (bySku.get(item.sku) ?? 0) + item.quantity);
  }
  const lines = [...bySku.entries()]
    .map(([sku, quantity]) => ({ sku, quantity }))
    .sort((a, b) => a.sku.localeCompare(b.sku));

  return useQuery({
    queryKey: [...crfShopKeys.all, "handout-stock", lines] as const,
    queryFn: () => crfShopApi.stockCheck(lines),
    enabled: enabled && lines.length > 0,
    staleTime: 30 * 1000,
  });
}

/* ========================================================================== */
/*                                 Audit trail                                */
/* ========================================================================== */

// Feeds the shared AuditLogSection from the request's own timeline, so the
// handout page shows the same audit UI as the EPC page. When the backend adds
// /comment/HANDOUT/:id/activity-log, delete this and drop the `api` prop.
export const HANDOUT_AUDIT_SUBJECT = "HANDOUT_REQUEST";

export const handoutAuditApi: AuditApiAdapter = {
  getAuditLog: async ({ subjectId }) => {
    const handout = await handoutApi.get(subjectId);

    return handout.timeline.map((entry) => {
      const [first = "", ...rest] = entry.byName.trim().split(/\s+/);
      return {
        id: entry.id,
        action: entry.action,
        metadata: entry.comment ? { reason: entry.comment } : null,
        actor: {
          id: entry.id,
          first_name: first,
          last_name: rest.join(" "),
        },
        createdAt: entry.at,
      };
    });
  },
};

/** Wording for the actions the shared audit messages don't know. */
export const HANDOUT_AUDIT_MESSAGES = {
  DELIVERED: "hand delivered and closed the handout request",
  CANNOT_FULFIL: "marked the handout request as cannot be fulfilled",
  RESUBMITTED: "resubmitted the handout request",
} as const;
