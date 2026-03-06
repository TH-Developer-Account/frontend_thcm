import { useQuery } from "@tanstack/react-query";
import { ServerAxios } from "../services/ServerAxios";

export const useMasterData = () => {
  return useQuery({
    queryKey: ["master-data"],
    queryFn: async () => {
      console.log("Fetching master data...");
      const res = await ServerAxios.get("/master-data");
      return res.data;
    },
    staleTime: 1000 * 60 * 60,
    refetchOnMount: "always",
  });
};
