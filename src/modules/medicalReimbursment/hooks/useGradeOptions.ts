import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { medicalClaimApi } from "../api/medicalClaim.api";
import {
	guestReimburseClaimApi,
	publicReimburseClaimApi,
} from "../../guest/guestMedicalForms/reimbursementClaim.api";
import type { GradeEligibilityRow } from "../types/medicalClaimListing.types";
import type { GradeOption } from "../types/reimbursementClaim.types";
import {
	resolveGradeOptions,
	toGradeOptions,
} from "../utils/gradeEligibility.constants";
import { medicalClaimKeys } from "./useMedicalClaimMutations";
import { MEDICLAIM_BACKEND } from "../utils/mediclaimBackend.config";

export type GradeSource =
	| { kind: "internal" }
	| { kind: "guest" }
	| { kind: "public"; token: string };

const fetchGrades = (source: GradeSource): Promise<GradeEligibilityRow[]> => {
	switch (source.kind) {
		case "public":
			return publicReimburseClaimApi.listGrades(source.token);
		case "guest":
			return guestReimburseClaimApi.listGrades();
		default:
			return medicalClaimApi.listGrades();
	}
};

/**
 * Grade → annual cap options for the claim form.
 *
 * With a grades endpoint (MEDICLAIM_BACKEND.gradesEndpoint) the list comes
 * from the GradeEligibility table; otherwise — or if the request fails — it
 * is GRADE_OPTIONS. It always includes the claim's current grade so a
 * prefilled legacy grade (e.g. EG-2B) is selectable and valid.
 */
export function useGradeOptions(
	source: GradeSource,
	current?: { grade?: string | null; derivedCap?: number | null },
	enabled = true,
): { gradeOptions: GradeOption[]; isLoading: boolean } {
	const cacheKey = source.kind === "public" ? `public:${source.token}` : source.kind;
	const query = useQuery({
		queryKey: medicalClaimKeys.grades(cacheKey),
		queryFn: () => fetchGrades(source),
		enabled:
			MEDICLAIM_BACKEND.gradesEndpoint &&
			enabled &&
			(source.kind !== "public" || Boolean(source.token)),
		staleTime: 10 * 60_000,
		retry: 1,
		refetchOnWindowFocus: false,
	});

	const gradeOptions = useMemo(
		() =>
			resolveGradeOptions(
				query.data ? toGradeOptions(query.data) : undefined,
				current?.grade,
				current?.derivedCap,
			),
		[current?.derivedCap, current?.grade, query.data],
	);

	return { gradeOptions, isLoading: query.isLoading };
}
