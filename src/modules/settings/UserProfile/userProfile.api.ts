import { useMutation } from "@tanstack/react-query";

import { ServerAxios } from "../../../services/ServerAxios";

export type UpdateCurrentUserPayload = {
	first_name: string;
	last_name: string;
	phone_number: string;
	designation: string;
	department: string;
};

export type CurrentUserProfile = {
	id: string;
	first_name: string;
	last_name: string;
	email: string | null;
	phone_number: string | null;
	designation: string | null;
	department: string | null;
};

export type UpdateCurrentUserResponse = {
	message: string;
	user: CurrentUserProfile;
};

const updateCurrentUser = async (payload: UpdateCurrentUserPayload) => {
	const { data } = await ServerAxios.patch<UpdateCurrentUserResponse>(
		"/users/me",
		payload,
	);
	return data;
};

/*
 * No query invalidation: the signed-in user lives in the Auth context (not a
 * TanStack query), and the caller merges the response into it on success.
 */
export const useUpdateCurrentUser = () =>
	useMutation({ mutationFn: updateCurrentUser });
