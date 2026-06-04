// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import {
// 	eventOutcomeApi,
// 	type EventOutcomePayload,
// } from "../api/event.outcome.api";
// import { epcKeys } from "./epc.keys";

// export function useEventOutcomeMutation() {
// 	const queryClient = useQueryClient();

// 	return useMutation({
// 		mutationFn: ({
// 			epcId,
// 			payload,
// 		}: {
// 			epcId: string;
// 			payload: EventOutcomePayload;
// 		}) => eventOutcomeApi.eventOutcome(epcId, payload),

// 		onSuccess: (_, variables) => {
// 			queryClient.invalidateQueries({
// 				queryKey: epcKeys.detail(variables.epcId),
// 			});
// 		},
// 	});
// }

// export function useEventDeviationMutation() {
// 	const queryClient = useQueryClient();

// 	return useMutation({
// 		mutationFn: ({
// 			epcId,
// 			payload,
// 		}: {
// 			epcId: string;
// 			payload: EventOutcomePayload;
// 		}) => eventOutcomeApi.deviation(epcId, payload),

// 		onSuccess: (_, variables) => {
// 			queryClient.invalidateQueries({
// 				queryKey: epcKeys.detail(variables.epcId),
// 			});
// 		},
// 	});
// }
