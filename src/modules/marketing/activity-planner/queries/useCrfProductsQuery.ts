import { useQuery } from "@tanstack/react-query";
import { crfApi } from "../api/crf.api";

export function useCrfProductsQuery(enabled = true) {
	return useQuery({
		queryKey: ["products", "CRF"],
		queryFn: crfApi.getProducts,
		enabled,
		staleTime: 10 * 60 * 1000,
	});
}
