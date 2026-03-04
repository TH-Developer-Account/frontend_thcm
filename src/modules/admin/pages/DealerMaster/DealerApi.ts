// modules/users/api.ts

import type { ApiUser } from "./common.types";

export async function fetchUsers(): Promise<ApiUser[]> {
	const res = await fetch("/api/users");

	if (!res.ok) {
		throw new Error("Failed to fetch users");
	}

	return res.json();
}
