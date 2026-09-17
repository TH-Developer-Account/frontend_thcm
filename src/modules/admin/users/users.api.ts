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
	create: "/users",
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
		const jsonPayload = mapUserFormToCreatePayload(payload);

		/*
		 * TODO: Enable after POST /users supports multipart/form-data.
		 * The selected avatar is a File, so append it as binary. Do not set the
		 * Content-Type header manually; the browser must add its boundary.
		 *
		 * const formData = new FormData();
		 * Object.entries(jsonPayload).forEach(([key, value]) => {
		 *     if (value !== undefined) formData.append(key, String(value));
		 * });
		 * if (payload.avatar) formData.append("avatar", payload.avatar);
		 * const response = await ServerAxios.post(USER_API_ROUTES.create, formData);
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
		 * TODO: Enable when the backend supports avatar uploads.
		 *
		 * const formData = new FormData();
		 *
		 * Object.entries(jsonPayload).forEach(([key, value]) => {
		 *     if (value !== undefined && value !== null) {
		 *         formData.append(key, String(value));
		 *     }
		 * });
		 *
		 * if (payload.avatar instanceof File) {
		 *     formData.append("avatar", payload.avatar, payload.avatar.name);
		 * }
		 *
		 * const response = await ServerAxios.patch(
		 *     USER_API_ROUTES.update(userId),
		 *     formData,
		 * );
		 *
		 * return response.data as UserMutationResult;
		 */

		const response = await ServerAxios.patch(
			USER_API_ROUTES.update(userId),
			jsonPayload,
		);

		return response.data as UserMutationResult;
	},
	// updateUser: async ({
	// 	userId,
	// 	payload,
	// }: UpdateUserVariables): Promise<UserMutationResult> => {
	// 	const jsonPayload = mapUserFormToUpdatePayload(payload);
	// 	const formData = new FormData();

	// 	Object.entries(jsonPayload).forEach(([key, value]) => {
	// 		if (value !== undefined && value !== null) {
	// 			formData.append(key, String(value));
	// 		}
	// 	});

	// 	if (payload.avatar instanceof File) {
	// 		formData.append("avatar", payload.avatar, payload.avatar.name);
	// 	}

	// 	// Temporary debugging only
	// 	for (const [key, value] of formData.entries()) {
	// 		if (value instanceof File) {
	// 			console.log(key, {
	// 				name: value.name,
	// 				type: value.type,
	// 				size: value.size,
	// 			});
	// 		} else {
	// 			console.log(key, value);
	// 		}
	// 	}

	// 	const response = await ServerAxios.patch(
	// 		USER_API_ROUTES.update(userId),
	// 		formData,
	// 	);

	// 	return response.data as UserMutationResult;
	// },

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
