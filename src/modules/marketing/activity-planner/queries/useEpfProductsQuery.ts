import { useQuery } from "@tanstack/react-query";
import { epfApi } from "../api/epf.api";

export function useEpfProductsQuery(enabled = true) {
	return useQuery({
		queryKey: ["products", "EPF"],
		queryFn: epfApi.getProducts,
		enabled,
		staleTime: 10 * 60 * 1000,
	});
}
