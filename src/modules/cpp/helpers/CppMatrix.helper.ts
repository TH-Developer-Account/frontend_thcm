// helpers/cppMatrix.helpers.ts — pure helpers for the CPP approval matrix screen.
// No React, no API: plant filtering and "chain step -> approval table stage".
import type { ApprovalStageLike } from "../../workflows/types/types";
import { personLabel } from "../components/CppPersonPicker";
import type {
	CppApprovalMatrix,
	CppChain,
	CppChainStep,
	CppCoverageIssue,
	CppMatrixRole,
	CppPerson,
	CppSlotScope,
} from "../types/cpp.types";

/* --------------------------------- slots ---------------------------------- */

export type SlotMap = Record<string, CppPerson[]>;

export const keyOf = (roleKey: string, scope: string) => `${roleKey}:${scope}`;

export const toSlotMap = (matrix: CppApprovalMatrix): SlotMap =>
	Object.fromEntries(
		matrix.assignments.map((a) => [keyOf(a.roleKey, a.scope), a.users]),
	);

export const ids = (people: CppPerson[] | undefined) =>
	(people ?? []).map((p) => p.id);

export const sameIds = (
	a: CppPerson[] | undefined,
	b: CppPerson[] | undefined,
) => ids(a).join("|") === ids(b).join("|");

export const SCOPE_LABEL: Record<CppSlotScope, string> = {
	ALL: "All plants",
	KGP: "KGP",
	DWD: "DWD",
};

/* ------------------------------ plant filter ------------------------------ */

/** "ANY" = no filter. KGP / DWD = only that plant + roles shared by every plant. */
export type CppPlantFilter = "ANY" | "KGP" | "DWD";

export const PLANT_FILTER_OPTIONS: { value: CppPlantFilter; label: string }[] =
	[
		{ value: "ANY", label: "All plants" },
		{ value: "KGP", label: "KGP" },
		{ value: "DWD", label: "DWD" },
	];

/** Scopes of a role that are visible under the filter. ALL-scope roles apply to every plant. */
export const visibleScopes = (
	role: Pick<CppMatrixRole, "scopes">,
	plant: CppPlantFilter,
): CppSlotScope[] =>
	plant === "ANY"
		? role.scopes
		: role.scopes.filter((scope) => scope === plant || scope === "ALL");

export const issueMatchesPlant = (
	issue: Pick<CppCoverageIssue, "scope">,
	plant: CppPlantFilter,
) => plant === "ANY" || issue.scope === plant || issue.scope === "ALL";

/* ------------------------- chain -> approval table ------------------------- */

const EMPTY_PREFIX = "__empty__";

/** One row in the approver list. `designation` carries the role (and plant) label. */
const approverOf = (
	person: CppPerson | null,
	roleText: string,
	key: string,
): NonNullable<ApprovalStageLike["approvers"]>[number] => ({
	id: person ? `${key}:${person.id}` : `${EMPTY_PREFIX}${key}`,
	userId: person?.id ?? null,
	isExternalApprover: false,
	user: {
		id: person?.id ?? `${EMPTY_PREFIX}${key}`,
		firstName: "",
		lastName: "",
		name: person ? personLabel(person) : "⚠ Nobody assigned",
		email: person?.email ?? undefined,
		designation: roleText,
	},
});

export const isEmptyApprover = (id: string | null | undefined) =>
	Boolean(id?.startsWith(EMPTY_PREFIX));

type Resolver = {
	roles: Map<string, CppMatrixRole>;
	slots: SlotMap;
	plant: CppPlantFilter;
};

/**
 * Everyone who sits behind a list of roles, for the selected plant. With "All plants"
 * a plant role lists the KGP and the DWD people (the request's plant picks one at submit).
 */
const seatsFor = (roleKeys: string[], { roles, slots, plant }: Resolver) =>
	roleKeys.flatMap((roleKey) => {
		const role = roles.get(roleKey);
		const scopes: CppSlotScope[] =
			role?.scope === "PLANT"
				? plant === "ANY"
					? ["KGP", "DWD"]
					: [plant]
				: ["ALL"];
		return scopes.map((scope) => slots[keyOf(roleKey, scope)] ?? []);
	});

const approversFor = (roleKeys: string[], { roles, slots, plant }: Resolver) =>
	roleKeys.flatMap((roleKey) => {
		const role = roles.get(roleKey);
		const label = role?.label ?? roleKey;
		const scopes: CppSlotScope[] = role
			? role.scope === "PLANT"
				? plant === "ANY"
					? ["KGP", "DWD"]
					: [plant]
				: ["ALL"]
			: ["ALL"];

		return scopes.flatMap((scope) => {
			const roleText = scope === "ALL" ? label : `${label} · ${scope}`;
			const people = slots[keyOf(roleKey, scope)] ?? [];
			return people.length
				? people.map((person) =>
						approverOf(person, roleText, keyOf(roleKey, scope)),
					)
				: [approverOf(null, roleText, keyOf(roleKey, scope))];
		});
	});

const stageName = (step: CppChainStep) => {
	const base = `${step.label} · ${step.title}`;
	if (step.kind === "COMMITTEE" && step.required)
		return `${base} — any ${step.required} must approve`;
	if (step.mode === "ANY_ONE") return `${base} — either one approves`;
	if (step.kind === "PROPOSER") return `${base} — creates the request`;
	return base;
};

/**
 * Mirrors the backend (cpp.workflow.ts): committee = SOME (min n); ANY_ONE, or several
 * people in ONE seat = ANY (either can act); else ALL. With "All plants" a plant role shows
 * the KGP and the DWD seat side by side — that is not "either one", so it is counted per seat.
 */
const stageRule = (step: CppChainStep, maxPeoplePerSeat: number) => {
	if (step.kind === "COMMITTEE")
		return { strategy: "SOME", minApprovals: step.required ?? 3 };
	if (step.mode === "ANY_ONE" || maxPeoplePerSeat > 1)
		return { strategy: "ANY", minApprovals: 1 };
	return { strategy: "ALL", minApprovals: null };
};

/** Distinct people across the committee seats (the backend needs `required` different people). */
const committeePeople = (step: CppChainStep, resolver: Resolver) =>
	new Set(
		seatsFor(step.roleKeys, resolver)
			.flat()
			.map((p) => p.id),
	).size;

export const chainStepsToStages = (
	steps: CppChainStep[],
	resolver: Resolver,
	idPrefix: string,
): ApprovalStageLike[] =>
	steps.map((step, index) => {
		let approvers =
			step.kind === "PROPOSER"
				? [
						{
							id: `${idPrefix}-proposer`,
							isExternalApprover: false,
							user: {
								id: `${idPrefix}-proposer`,
								firstName: "",
								lastName: "",
								name: "Whoever creates the request",
								designation: "A/C Manager (Proposer)",
							},
						},
					]
				: approversFor(step.roleKeys, resolver);
		// Committee: empty seats are fine as long as `required` people are there; hide them.
		if (step.kind === "COMMITTEE") {
			const filled = approvers.filter((a) => !isEmptyApprover(a.id));
			if (filled.length) approvers = filled;
		}
		const maxPerSeat = Math.max(
			0,
			...seatsFor(step.roleKeys, resolver).map((people) => people.length),
		);
		const rule = stageRule(step, maxPerSeat);
		return {
			id: `${idPrefix}-${index}`,
			stageOrder: index + 1,
			name: stageName(step),
			strategy: rule.strategy,
			minApprovals: rule.minApprovals,
			approvers,
		};
	});

export const priceFeedingStage = (
	chain: CppChain,
	resolver: Resolver,
): ApprovalStageLike[] => [
	{
		id: `${chain.ruleId}-feeding`,
		stageOrder: 1,
		name: chain.priceFeeding.implied
			? "Price feeding (task, not an approval) — not listed in the workbook, SCM Head by rule"
			: "Price feeding (task, not an approval)",
		strategy: "ANY",
		minApprovals: 1,
		approvers: approversFor([chain.priceFeeding.roleKey], resolver),
	},
];

/**
 * What would block a submit of this band for the selected plant (same checks as
 * buildCppApprovalPlan): an empty seat, a committee with fewer people than required,
 * nobody for price feeding. Reporting (MD informed) never blocks.
 */
export const emptySeatsInChain = (
	chain: CppChain,
	resolver: Resolver,
): string[] => {
	const problems: string[] = [];
	const steps = [...chain.wf1, ...chain.wf2].filter(
		(s) => s.kind !== "PROPOSER" && s.kind !== "REPORTING",
	);
	for (const step of steps) {
		if (step.kind === "COMMITTEE") {
			const required = step.required ?? 3;
			const have = committeePeople(step, resolver);
			if (have < required)
				problems.push(`${step.title} (${have} of ${required} people assigned)`);
			continue;
		}
		const approvers = approversFor(step.roleKeys, resolver);
		// ANY_ONE (Alt Chairman / Chairman): one filled seat is enough.
		if (step.mode === "ANY_ONE") {
			if (approvers.every((a) => isEmptyApprover(a.id)))
				problems.push(step.title);
			continue;
		}
		approvers
			.filter((a) => isEmptyApprover(a.id))
			.forEach((a) => problems.push(a.user?.designation ?? step.title));
	}
	approversFor([chain.priceFeeding.roleKey], resolver)
		.filter((a) => isEmptyApprover(a.id))
		.forEach((a) =>
			problems.push(`Price feeding: ${a.user?.designation ?? ""}`),
		);
	return [...new Set(problems)];
};

/* -------------------------- category-specific notes ------------------------ */

/** Sheets whose workbook notes change the chain for DOMP / Import NON HCM (see cpp.rules.ts notes). */
const SHEETS_WITH_CATEGORY_NOTES = ["FTR", "PC", "EOP", "PRO"];

export const categoryNotes = (
	chain: CppChain,
	roles: Map<string, CppMatrixRole>,
): string[] => {
	const label = (key: string) => roles.get(key)?.label ?? key;
	const notes: string[] = [];
	for (const step of chain.wf1)
		for (const [category, roleKey] of Object.entries(step.variants ?? {}))
			notes.push(
				`${category.replace(/_/g, " ")}: "${step.title}" is replaced by ${label(roleKey)}.`,
			);

	const prefix = chain.ruleId.split("-")[0];
	const hasHeadScm = chain.wf1.some((s) => s.roleKeys.includes("HEAD_SCM"));
	if (SHEETS_WITH_CATEGORY_NOTES.includes(prefix) && hasHeadScm) {
		notes.push("DOMP: the Head SCM KGP / DWD stage is skipped.");
		notes.push(
			`IMPORT NON HCM: Head SCM KGP / DWD is replaced by ${label("HEAD_SCM_KGP_PLANT_IMPORTS")}.`,
		);
	}
	return [...new Set(notes)];
};

export const conditionName = (sheet: string) =>
	sheet.replace(/^\s*\d+\s*\.\s*/, "").trim();
