// modules/users/hooks.ts

import { useEffect, useState } from "react";
import { fetchUsers } from "./DealerApi";
import type { ApiUser } from "./common.types";

export function useUsers() {
	const [data, setData] = useState<ApiUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const load = async () => {
			try {
				const result = await fetchUsers();
				setData(result);
			} catch (err) {
				setError("Something went wrong");
			} finally {
				setLoading(false);
			}
		};

		load();
	}, []);

	return { data, loading, error };
}
