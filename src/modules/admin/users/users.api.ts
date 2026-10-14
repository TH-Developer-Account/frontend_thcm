import { ServerAxios } from "../../../services/ServerAxios";

import type {
  ApiEnvelope,
  CreateUserInput,
  DeleteUserVariables,
  UpdateUserStatusVariables,
  UpdateUserVariables,
  User,
  UserCounts,
  UserListPage,
  UserListParams,
  UserMutationResult,
  UserResponse,
} from "./user-management.types";
import {
  mapUser,
  mapUserFormToCreatePayload,
  mapUserFormToUpdatePayload,
} from "./user-management.utils";

export const USER_API_ROUTES = {
  list: "/users",
  create: "/users",
  detail: (userId: string) => `/users/${encodeURIComponent(userId)}`,
  update: (userId: string) => `/users/${encodeURIComponent(userId)}`,
  delete: (userId: string) => `/users/${encodeURIComponent(userId)}`,
  status: (userId: string) => `/users/${encodeURIComponent(userId)}/status`,
} as const;

// GET /users caps pageSize here; pickers ask for the most matches it allows.
export const USER_LIST_MAX_PAGE_SIZE = 100;

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: UserListParams = {}) => [...userKeys.lists(), params] as const,
  search: (term: string) => [...userKeys.all, "search", term] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (userId: string) => [...userKeys.details(), userId] as const,
};

const EMPTY_USER_COUNTS: UserCounts = { All: 0, Active: 0, Inactive: 0 };

type UserListResponse = {
  rows?: UserResponse[];
  totalCount?: number;
  statusCounts?: UserCounts;
};

const unwrapData = <T>(response: T | ApiEnvelope<T>): T => {
  if (response && typeof response === "object" && "data" in response) {
    return (response as ApiEnvelope<T>).data;
  }

  return response as T;
};

// Drops unset filters so the query string (and the server's where clause)
// only carries what the caller asked for.
const toUserListQuery = ({ search, ...rest }: UserListParams) => {
  const trimmedSearch = search?.trim();
  return Object.fromEntries(
    Object.entries({ ...rest, search: trimmedSearch }).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  );
};

export type GetUsersParams = {
  search?: string;
  signal?: AbortSignal;
};

export const userApi = {
  listUsers: async ({
    signal,
    ...params
  }: UserListParams & { signal?: AbortSignal }): Promise<UserListPage> => {
    const { data } = await ServerAxios.get<UserListResponse>(
      USER_API_ROUTES.list,
      { signal, params: toUserListQuery(params) },
    );

    return {
      rows: (data.rows ?? []).map(mapUser),
      totalCount: data.totalCount ?? 0,
      statusCounts: data.statusCounts ?? EMPTY_USER_COUNTS,
    };
  },

  // Picker search: the best matches for a term, no paging UI.
  getUsers: async ({ search, signal }: GetUsersParams = {}): Promise<
    User[]
  > => {
    const page = await userApi.listUsers({
      search,
      pageSize: USER_LIST_MAX_PAGE_SIZE,
      signal,
    });
    return page.rows;
  },

  getUserById: async (userId: string): Promise<User> => {
    const response = await ServerAxios.get(USER_API_ROUTES.detail(userId));

    return mapUser(unwrapData<UserResponse>(response.data));
  },

  createUser: async (payload: CreateUserInput): Promise<UserMutationResult> => {
    const jsonPayload = mapUserFormToCreatePayload(payload);

    /*
     * TODO: Enable after POST /users supports multipart/form-data.
     * The selected avatar is a File, so append it as binary. Do not set the
     * Content-Type header manually; the browser must add its boundary.
     */

    const response = await ServerAxios.post(
      USER_API_ROUTES.create,
      jsonPayload,
    );

    return response.data as UserMutationResult;
  },

  updateUser: async ({
    userId,
    payload,
  }: UpdateUserVariables): Promise<UserMutationResult> => {
    const jsonPayload = mapUserFormToUpdatePayload(payload);

    /*
     * TODO: Enable multipart upload when the backend supports avatars.
     */

    const response = await ServerAxios.patch(
      USER_API_ROUTES.update(userId),
      jsonPayload,
    );

    return response.data as UserMutationResult;
  },

  deleteUser: async ({ userId }: DeleteUserVariables): Promise<void> => {
    await ServerAxios.delete(USER_API_ROUTES.delete(userId));
  },

  // NOTE: PATCH /users/:id/status does not exist on the backend yet.
  updateUserStatus: async ({
    userId,
    status,
  }: UpdateUserStatusVariables): Promise<UserMutationResult> => {
    const response = await ServerAxios.patch(USER_API_ROUTES.status(userId), {
      status,
      is_active: status === "Active",
    });

    return response.data as UserMutationResult;
  },
};
