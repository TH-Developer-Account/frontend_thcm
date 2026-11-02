import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { medicalClaimApi } from "../api/medicalClaim.api";
import { guestReimburseClaimApi } from "../../guest/guestMedicalForms/reimbursementClaim.api";
import type { GradeEligibilityRow } from "../types/medicalClaimListing.types";
import type { GradeOption } from "../types/reimbursementClaim.types";
import {
	resolveGradeOptions,
	toGradeOptions,
} from "../utils/gradeEligibility.constants";
import { medicalClaimKeys } from "./useMedicalClaimMutations";
import { publicReimburseClaimApi } from "../api/publicClaim.api";

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
 * Grade → annual cap options for the claim form, straight from the grade
 * master data (GradeEligibility table), so the dropdown and the backend can
 * never disagree. There is no hard-coded fallback: until the request
 * succeeds the list is empty (check `isLoading` / `isError`).
 *
 * It always includes the claim's current grade so a prefilled legacy grade
 * is selectable and valid.
 */
export function useGradeOptions(
	source: GradeSource,
	current?: { grade?: string | null; derivedCap?: number | null },
	enabled = true,
): { gradeOptions: GradeOption[]; isLoading: boolean; isError: boolean } {
	const cacheKey =
		source.kind === "public" ? `public:${source.token}` : source.kind;
	const query = useQuery({
		queryKey: medicalClaimKeys.grades(cacheKey),
		queryFn: () => fetchGrades(source),
		enabled: enabled && (source.kind !== "public" || Boolean(source.token)),
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

	return {
		gradeOptions,
		isLoading: query.isLoading,
		isError: query.isError,
	};
}
