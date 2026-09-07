import { ServerAxios } from "../../../services/ServerAxios";

import type {
	ApiEnvelope,
	CreateUserInput,
	DeleteUserVariables,
	UpdateUserStatusVariables,
	UpdateUserVariables,
	User,
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
	create: "/users/register",
	detail: (userId: string) => `/users/${encodeURIComponent(userId)}`,
	update: (userId: string) => `/users/${encodeURIComponent(userId)}`,
	delete: (userId: string) => `/users/${encodeURIComponent(userId)}`,
	status: (userId: string) => `/users/${encodeURIComponent(userId)}/status`,
} as const;

const unwrapData = <T>(response: T | ApiEnvelope<T>): T => {
	if (response && typeof response === "object" && "data" in response) {
		return (response as ApiEnvelope<T>).data;
	}

	return response as T;
};

export const userApi = {
	getUsers: async (): Promise<User[]> => {
		const response = await ServerAxios.get(USER_API_ROUTES.list, {
			params: { profile: "all" },
		});

		const rawUsers = unwrapData<UserResponse[]>(response.data);
		return (Array.isArray(rawUsers) ? rawUsers : []).map(mapUser);
	},

	getUserById: async (userId: string): Promise<User> => {
		const response = await ServerAxios.get(USER_API_ROUTES.detail(userId));
		return mapUser(unwrapData<UserResponse>(response.data));
	},

	createUser: async (payload: CreateUserInput): Promise<UserMutationResult> => {
		const response = await ServerAxios.post(
			USER_API_ROUTES.create,
			mapUserFormToCreatePayload(payload),
		);
		return response.data as UserMutationResult;
	},

	updateUser: async ({
		userId,
		payload,
	}: UpdateUserVariables): Promise<UserMutationResult> => {
		const response = await ServerAxios.patch(
			USER_API_ROUTES.update(userId),
			mapUserFormToUpdatePayload(payload),
		);
		return response.data as UserMutationResult;
	},

	deleteUser: async ({ userId }: DeleteUserVariables): Promise<void> => {
		await ServerAxios.delete(USER_API_ROUTES.delete(userId));
	},

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
