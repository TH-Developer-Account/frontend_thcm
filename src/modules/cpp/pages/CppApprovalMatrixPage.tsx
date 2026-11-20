// pages/CppApprovalMatrixPage.tsx — admin: who sits in which approval role.
//
// The 71 workflow chains only name ROLES (e.g. "Head SCM KGP"). This screen maps
// roles to people, so the yearly change is: pick a role, change the person.
// No workflow rule is ever edited here.
//   Filters          plant (KGP / DWD / all), role or person search, "needs a person"
//   Tab 1  Assignments     edit people per role / plant, save
//   Tab 2  Replace person  one person takes over every role of another
//   Tab 3  Workflow chains read-only preview of a band, as approval-flow tables
// The server refuses a save that leaves a required role empty, then refreshes the
// CPP workflow templates; the result of that refresh is shown to the admin.
import { useMemo, useState } from "react";
import { Plus, RefreshCw, Save, X } from "lucide-react";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { TabsBar } from "../../../components/common/TabsBar";
import { SearchInput } from "../../../components/forms/SearchInput";
import SelectInput from "../../../components/forms/SelectInput";
import { PageHeader } from "../../../components/ui/PageHeader";
import SimpleViewTable from "../../../components/ui/tables/SimpleViewTable";
import { useToast } from "../../../context/Auth/AuthContext";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { ApprovalTable } from "../../workflows/components/ApprovalTable";
import { mapWorkflowStagesToApprovalRows } from "../../workflows/utils/approvalWorkflow.mapper";
import CppPersonPicker, { personLabel } from "../components/CppPersonPicker";
import {
	type CppPlantFilter,
	PLANT_FILTER_OPTIONS,
	SCOPE_LABEL,
	type SlotMap,
	categoryNotes,
	chainStepsToStages,
	conditionName,
	emptySeatsInChain,
	ids,
	issueMatchesPlant,
	keyOf,
	priceFeedingStage,
	sameIds,
	toSlotMap,
	visibleScopes,
} from "../helpers/CppMatrix.helper";
import { useCppChains, useCppMatrix } from "../hooks/useCppMatrix";
import type {
	CppApprovalMatrix,
	CppChain,
	CppCoverageIssue,
	CppMatrixRole,
	CppMatrixSlotUpdate,
	CppPerson,
	CppSlotScope,
	CppTemplateSyncResult,
} from "../types/cpp.types";

type TabKey = "assignments" | "replace" | "chains";
const TABS: { value: TabKey; label: string }[] = [
	{ value: "assignments", label: "Assignments" },
	{ value: "replace", label: "Replace a person" },
	{ value: "chains", label: "Workflow chains" },
];

type ShowFilter = "all" | "missing";
const SHOW_OPTIONS: { value: ShowFilter; label: string }[] = [
	{ value: "all", label: "All roles" },
	{ value: "missing", label: "Only roles that need a person" },
];

type Option<T extends string = string> = { value: T; label: string };

const plantText = (plant: CppPlantFilter) =>
	plant === "ANY" ? "" : ` for ${plant}`;

/* ---------------------------- template refresh text ---------------------------- */

/** Turns the server's template refresh report into one toast. null = nothing worth saying. */
const describeTemplates = (
	result: CppTemplateSyncResult | null | undefined,
): { type: "success" | "warning"; text: string } | null => {
	if (!result) return null;
	if ("error" in result) return { type: "warning", text: result.error };
	if (result.errors.length)
		return {
			type: "warning",
			text: `Some workflow templates could not be refreshed: ${result.errors.join(" ")} Use "Refresh templates" to retry.`,
		};
	const parts = [
		result.created ? `${result.created} created` : "",
		result.updated ? `${result.updated} updated` : "",
	].filter(Boolean);
	const waiting = result.notReady
		? ` ${result.notReady} template(s) wait for empty roles to be filled.`
		: "";
	return parts.length || waiting
		? {
				type: "success",
				text: `Workflow templates: ${parts.join(", ") || "no change"}.${waiting}`,
			}
		: null;
};

/* ------------------------------- coverage banner ------------------------------- */

const CoverageBanner = ({
	issues,
	plant,
}: {
	issues: CppCoverageIssue[];
	plant: CppPlantFilter;
}) => {
	const visible = issues.filter((issue) => issueMatchesPlant(issue, plant));
	const errors = visible.filter((i) => i.severity === "error");
	const warnings = visible.filter((i) => i.severity === "warning");

	if (visible.length === 0)
		return (
			<Alert
				variant="success"
				type="banner"
				title={`Every role used by a workflow has someone assigned${plantText(plant)}.`}
			/>
		);

	const shown = errors.slice(0, 3).map((i) => i.message);
	const more =
		errors.length > shown.length
			? ` …and ${errors.length - shown.length} more (highlighted below).`
			: "";

	return (
		<div className="flex flex-col gap-2">
			{errors.length ? (
				<Alert
					variant="error"
					title={`${errors.length} role${errors.length === 1 ? "" : "s"} need a person${plantText(plant)}`}
					description={`Requests whose chain uses these roles cannot be submitted until they are filled. ${shown.join(" ")}${more}`}
				/>
			) : null}
			{warnings.length ? (
				<Alert
					variant="warning"
					type="banner"
					title={warnings.map((i) => i.message).join(" ")}
				/>
			) : null}
		</div>
	);
};

/* ------------------------------- filter bar ------------------------------- */

const FilterBar = ({
	tab,
	plant,
	setPlant,
	search,
	setSearch,
	show,
	setShow,
}: {
	tab: TabKey;
	plant: CppPlantFilter;
	setPlant: (plant: CppPlantFilter) => void;
	search: string;
	setSearch: (value: string) => void;
	show: ShowFilter;
	setShow: (value: ShowFilter) => void;
}) => (
	<Card size="small">
		<div className="flex flex-wrap items-end gap-4">
			<div className="w-48">
				<SelectInput<Option<CppPlantFilter>>
					label="Plant"
					options={PLANT_FILTER_OPTIONS}
					value={PLANT_FILTER_OPTIONS.find((o) => o.value === plant) ?? null}
					onChange={(option) => setPlant(option?.value ?? "ANY")}
					isSearchable={false}
					helperText="KGP / DWD shows that plant's roles plus the roles shared by every plant."
				/>
			</div>
			{tab !== "chains" ? (
				<div className="w-72 max-w-full">
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder={
							tab === "replace" ? "Search people" : "Search role or person"
						}
					/>
				</div>
			) : null}
			{tab === "assignments" ? (
				<div className="w-64">
					<SelectInput<Option<ShowFilter>>
						label="Show"
						options={SHOW_OPTIONS}
						value={SHOW_OPTIONS.find((o) => o.value === show) ?? null}
						onChange={(option) => setShow(option?.value ?? "all")}
						isSearchable={false}
					/>
				</div>
			) : null}
		</div>
	</Card>
);

/* ------------------------------- assignments tab ------------------------------- */

type SlotRowData = {
	key: string;
	role: CppMatrixRole;
	scope: CppSlotScope;
	people: CppPerson[];
	/** Server says this seat is empty and a workflow needs it. */
	missing: boolean;
	/** The draft empties a seat that a workflow needs — the save will be refused. */
	willEmpty: boolean;
};

const PeopleCell = ({
	row,
	onChange,
}: {
	row: SlotRowData;
	onChange: (next: CppPerson[]) => void;
}) => {
	const [adding, setAdding] = useState(false);
	const { role, people } = row;

	return (
		<div className="flex flex-col gap-1">
			<div className="flex flex-wrap items-center gap-2">
				{people.map((person) => (
					<span
						key={person.id}
						className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pl-3 pr-0.5 text-sm text-slate-800"
						title={person.email ?? undefined}
					>
						{personLabel(person)}
						<Button
							type="button"
							appearance="icon"
							variant="transparent"
							size="sm"
							Icon={X}
							aria-label={`Remove ${personLabel(person)}`}
							onClick={() => onChange(people.filter((p) => p.id !== person.id))}
						/>
					</span>
				))}
				{adding ? (
					<CppPersonPicker
						autoFocus
						excludeIds={ids(people)}
						onClose={() => setAdding(false)}
						onPick={(person) => {
							onChange([...people, person]);
							setAdding(false);
						}}
					/>
				) : (
					<Button
						type="button"
						text={role.observer ? "Add observer" : "Add person"}
						Icon={Plus}
						iconPosition="left"
						size="sm"
						appearance="standard"
						variant="outline"
						onClick={() => setAdding(true)}
					/>
				)}
			</div>
			{row.missing && people.length === 0 ? (
				<p className="text-xs text-red-600">Nobody assigned</p>
			) : row.willEmpty ? (
				<p className="text-xs text-red-600">
					Removing everyone here will be refused on save — workflows use this
					role.
				</p>
			) : people.length > 1 &&
			  !role.observer &&
			  !role.key.startsWith("COMMITTEE_") ? (
				<p className="text-xs text-slate-500">
					Several people: any one of them can approve this stage.
				</p>
			) : null}
		</div>
	);
};

const AssignmentsTab = ({
	matrix,
	server,
	draft,
	setDraft,
	plant,
	search,
	show,
}: {
	matrix: CppApprovalMatrix;
	server: SlotMap;
	draft: SlotMap;
	setDraft: (next: SlotMap) => void;
	plant: CppPlantFilter;
	search: string;
	show: ShowFilter;
}) => {
	const missing = useMemo(
		() =>
			new Set(
				matrix.coverage
					.filter((i) => i.severity === "error")
					.map((i) => keyOf(i.roleKey, i.scope)),
			),
		[matrix.coverage],
	);

	const groups = useMemo(() => {
		const needle = search.trim().toLowerCase();
		const map = new Map<string, SlotRowData[]>();

		for (const role of matrix.roles.filter((r) => r.assignable))
			for (const scope of visibleScopes(role, plant)) {
				const key = keyOf(role.key, scope);
				const people = draft[key] ?? [];
				const row: SlotRowData = {
					key,
					role,
					scope,
					people,
					missing: missing.has(key),
					willEmpty:
						people.length === 0 &&
						(server[key] ?? []).length > 0 &&
						role.usedByBands > 0 &&
						!role.observer,
				};
				const needsPerson =
					(row.missing && people.length === 0) || row.willEmpty;
				if (show === "missing" && !needsPerson) continue;
				if (
					needle &&
					!role.label.toLowerCase().includes(needle) &&
					!people.some((p) =>
						`${p.name ?? ""} ${p.email ?? ""}`.toLowerCase().includes(needle),
					)
				)
					continue;
				map.set(role.group, [...(map.get(role.group) ?? []), row]);
			}
		return [...map.entries()];
	}, [matrix.roles, plant, draft, server, missing, search, show]);

	if (groups.length === 0)
		return (
			<Card size="small">
				<p className="py-6 text-center text-sm text-slate-500">
					No roles match these filters.
				</p>
			</Card>
		);

	return (
		<div className="flex flex-col gap-4">
			{groups.map(([group, rows]) => (
				<Card key={group} size="small" title={group} accordion defaultExpanded>
					<SimpleViewTable<SlotRowData>
						data={rows}
						getRowId={(row) => row.key}
						maxHeight="none"
						ariaLabel={`${group} assignments`}
						columns={[
							{
								key: "role",
								header: "Role",
								widthUnits: 3,
								render: (row) => (
									<div className="flex flex-col">
										<span className="text-sm font-medium text-slate-800">
											{row.role.label}
										</span>
										{row.role.note ? (
											<span className="text-xs text-slate-500">
												{row.role.note}
											</span>
										) : null}
										<span className="text-xs text-slate-400">
											{row.role.usedByBands > 0
												? `Used in ${row.role.usedByBands} workflow bands`
												: "Not used by a band"}
										</span>
									</div>
								),
							},
							{
								key: "plant",
								header: "Plant",
								widthUnits: 1,
								render: (row) => (
									<span className="text-sm text-slate-600">
										{SCOPE_LABEL[row.scope]}
									</span>
								),
							},
							{
								key: "people",
								header: "People",
								widthUnits: 6,
								render: (row) => (
									<PeopleCell
										row={row}
										onChange={(next) => setDraft({ ...draft, [row.key]: next })}
									/>
								),
							},
						]}
					/>
				</Card>
			))}
		</div>
	);
};

/* -------------------------------- replace tab ------------------------------- */

type Holder = {
	person: CppPerson;
	slots: Array<{ key: string; role: string; scope: CppSlotScope }>;
};

const ReplaceTab = ({
	matrix,
	plant,
	search,
	busy,
	blockedByEdits,
	onReplace,
}: {
	matrix: CppApprovalMatrix;
	plant: CppPlantFilter;
	search: string;
	busy: boolean;
	blockedByEdits: boolean;
	onReplace: (from: CppPerson, to: CppPerson) => Promise<boolean>;
}) => {
	const [fromId, setFromId] = useState<string | null>(null);
	const [to, setTo] = useState<CppPerson | null>(null);

	const holders = useMemo<Holder[]>(() => {
		const byId = new Map<string, Holder>();
		const roleLabel = new Map(matrix.roles.map((r) => [r.key, r.label]));
		matrix.assignments.forEach((a) =>
			a.users.forEach((person) => {
				const entry = byId.get(person.id) ?? { person, slots: [] };
				entry.slots.push({
					key: keyOf(a.roleKey, a.scope),
					role: roleLabel.get(a.roleKey) ?? a.roleKey,
					scope: a.scope,
				});
				byId.set(person.id, entry);
			}),
		);
		return [...byId.values()].sort((a, b) =>
			personLabel(a.person).localeCompare(personLabel(b.person)),
		);
	}, [matrix]);

	const options = useMemo(() => {
		const needle = search.trim().toLowerCase();
		return holders
			.filter((h) =>
				plant === "ANY"
					? true
					: h.slots.some((s) => s.scope === plant || s.scope === "ALL"),
			)
			.filter((h) =>
				needle
					? `${h.person.name ?? ""} ${h.person.email ?? ""}`
							.toLowerCase()
							.includes(needle)
					: true,
			)
			.map((h) => ({
				value: h.person.id,
				label: `${personLabel(h.person)} — ${h.slots.length} role${h.slots.length === 1 ? "" : "s"}`,
			}));
	}, [holders, plant, search]);

	const leaving = holders.find((h) => h.person.id === fromId) ?? null;

	const submit = async () => {
		if (!leaving || !to) return;
		const done = await onReplace(leaving.person, to);
		if (done) {
			setFromId(null);
			setTo(null);
		}
	};

	return (
		<Card size="small" title="Replace a person in every role">
			<div className="flex flex-col gap-4">
				<p className="text-sm text-slate-600">
					Use this when someone leaves or changes job. The new person takes over
					every role the old person holds (in all plants, whatever the plant
					filter shows). Approvals already given are kept; stages still waiting
					move to the new person.
				</p>
				{blockedByEdits ? (
					<Alert
						variant="warning"
						type="banner"
						title="Save or discard your unsaved assignment changes first."
					/>
				) : null}
				<div className="grid gap-4 lg:grid-cols-2">
					<div className="flex flex-col gap-2">
						<div className="w-80 max-w-full">
							<SelectInput<Option>
								label="Person being replaced"
								placeholder="Select a person"
								options={options}
								value={options.find((o) => o.value === fromId) ?? null}
								onChange={(option) => setFromId(option?.value ?? null)}
								isClearable
								noOptionsMessage={() => "Nobody matches the filters"}
							/>
						</div>
						{leaving ? (
							<SimpleViewTable
								data={leaving.slots}
								getRowId={(slot) => slot.key}
								maxHeight="240px"
								ariaLabel="Roles held"
								columns={[
									{
										key: "role",
										header: "Role",
										widthUnits: 3,
										render: (s) => s.role,
									},
									{
										key: "plant",
										header: "Plant",
										render: (s) => SCOPE_LABEL[s.scope],
									},
								]}
							/>
						) : null}
					</div>
					<div className="flex flex-col gap-2">
						{to ? (
							<>
								<span className="form-label">New person</span>
								<span className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 py-0.5 pl-3 pr-0.5 text-sm">
									{personLabel(to)}
									<Button
										type="button"
										appearance="icon"
										variant="transparent"
										size="sm"
										Icon={X}
										aria-label="Clear new person"
										onClick={() => setTo(null)}
									/>
								</span>
							</>
						) : (
							<CppPersonPicker
								label="New person"
								excludeIds={leaving ? [leaving.person.id] : []}
								onPick={setTo}
							/>
						)}
					</div>
				</div>
				<div>
					<Button
						type="button"
						text={busy ? "Replacing…" : "Replace everywhere"}
						size="sm"
						variant="brand"
						loading={busy}
						disabled={!leaving || !to || busy || blockedByEdits}
						onClick={() => void submit()}
					/>
				</div>
			</div>
		</Card>
	);
};

/* -------------------------------- chains tab -------------------------------- */

const BLOCK_LABEL: Record<CppChain["block"], string> = {
	MAIN: "Main (KGP / DWD)",
	SPARES: "Spares",
};

const ChainTab = ({
	matrix,
	plant,
}: {
	matrix: CppApprovalMatrix;
	plant: CppPlantFilter;
}) => {
	const { data, isLoading, isError, refetch } = useCppChains();
	const [sheet, setSheet] = useState<string | null>(null);
	const [block, setBlock] = useState<CppChain["block"]>("MAIN");
	const [ruleId, setRuleId] = useState<string | null>(null);

	const roles = useMemo(
		() => new Map(matrix.roles.map((r) => [r.key, r])),
		[matrix.roles],
	);
	const slots = useMemo(() => toSlotMap(matrix), [matrix]);
	const chains = useMemo(() => data?.chains ?? [], [data]);

	const sheetOptions = useMemo<Option[]>(
		() =>
			[...new Set(chains.map((c) => c.sheet))].map((value) => ({
				value,
				label: conditionName(value),
			})),
		[chains],
	);
	const activeSheet = sheet ?? sheetOptions[0]?.value ?? "";

	const blockOptions = useMemo<Option<CppChain["block"]>[]>(
		() =>
			(["MAIN", "SPARES"] as const)
				.filter((b) =>
					chains.some((c) => c.sheet === activeSheet && c.block === b),
				)
				.map((value) => ({ value, label: BLOCK_LABEL[value] })),
		[chains, activeSheet],
	);
	const activeBlock = blockOptions.some((o) => o.value === block)
		? block
		: (blockOptions[0]?.value ?? "MAIN");

	const bandOptions = useMemo<Option[]>(
		() =>
			chains
				.filter((c) => c.sheet === activeSheet && c.block === activeBlock)
				.map((c) => ({
					value: c.ruleId,
					label: `${c.ruleId} · ${c.bandLabel}`,
				})),
		[chains, activeSheet, activeBlock],
	);
	const chain =
		chains.find(
			(c) =>
				c.ruleId === ruleId &&
				c.sheet === activeSheet &&
				c.block === activeBlock,
		) ?? chains.find((c) => c.ruleId === bandOptions[0]?.value);

	const resolver = useMemo(
		() => ({ roles, slots, plant }),
		[roles, slots, plant],
	);

	const tables = useMemo(() => {
		if (!chain) return null;
		const toRows = (stages: ReturnType<typeof chainStepsToStages>) =>
			mapWorkflowStagesToApprovalRows(stages, {
				showOnlyCurrentStageStatus: false,
			});
		return {
			wf1: toRows(
				chainStepsToStages(chain.wf1, resolver, `${chain.ruleId}-wf1`),
			),
			wf2: toRows(
				chainStepsToStages(chain.wf2, resolver, `${chain.ruleId}-wf2`),
			),
			feeding: toRows(priceFeedingStage(chain, resolver)),
			empty: emptySeatsInChain(chain, resolver),
			notes: categoryNotes(chain, roles),
		};
	}, [chain, resolver, roles]);

	if (isLoading)
		return (
			<Card size="small">
				<p className="text-sm text-slate-500">Loading workflow chains…</p>
			</Card>
		);
	if (isError || !data)
		return (
			<Alert
				variant="error"
				title="Could not load the workflow chains."
				primaryAction={{ label: "Retry", onClick: () => void refetch() }}
			/>
		);

	const hidden = ["status", "isExternal"] as const;

	return (
		<div className="flex flex-col gap-4">
			<Card size="small" title="Workflow chains (read-only)">
				<div className="flex flex-col gap-3">
					<div className="flex flex-wrap items-end gap-4">
						<div className="w-72 max-w-full">
							<SelectInput<Option>
								label="Condition"
								options={sheetOptions}
								value={
									sheetOptions.find((o) => o.value === activeSheet) ?? null
								}
								onChange={(option) => {
									setSheet(option?.value ?? null);
									setRuleId(null);
								}}
							/>
						</div>
						<div className="w-56">
							<SelectInput<Option<CppChain["block"]>>
								label="Block"
								options={blockOptions}
								value={
									blockOptions.find((o) => o.value === activeBlock) ?? null
								}
								onChange={(option) => {
									setBlock(option?.value ?? "MAIN");
									setRuleId(null);
								}}
								isSearchable={false}
								helperText="Spares = category Spares, or plant Spares."
							/>
						</div>
						<div className="w-96 max-w-full">
							<SelectInput<Option>
								label="Value band"
								options={bandOptions}
								value={
									bandOptions.find((o) => o.value === chain?.ruleId) ?? null
								}
								onChange={(option) => setRuleId(option?.value ?? null)}
							/>
						</div>
					</div>
					<p className="text-xs text-slate-500">
						{plant === "ANY"
							? "Plant roles list both the KGP and the DWD person; the request's plant picks one on submit."
							: `People shown for plant ${plant}.`}{" "}
						This shows the matrix. A request uses the CPP workflow template of
						its band, which an admin may have edited in Workflows.
					</p>
				</div>
			</Card>

			{data.problems.length ? (
				<Alert
					variant="warning"
					title={`${data.problems.length} chain problem(s) reported by the server`}
					description={data.problems.slice(0, 5).join(" ")}
				/>
			) : null}

			{chain && tables ? (
				<>
					{tables.empty.length ? (
						<Alert
							variant="error"
							title={`This band cannot be submitted${plantText(plant)} yet`}
							description={`Fill these in Assignments: ${tables.empty.join("; ")}.`}
						/>
					) : null}

					<Card size="small">
						<ApprovalTable
							title="Workflow 1 — plant / SCM"
							subtitle={`${chain.ruleId} · ${conditionName(chain.sheet)} · ${BLOCK_LABEL[chain.block]} · ${chain.bandLabel}`}
							data={tables.wf1}
							hiddenColumns={[...hidden]}
							maxHeight="none"
						/>
					</Card>

					<Card size="small">
						{tables.wf2.length ? (
							<ApprovalTable
								title="Workflow 2 — CPP committee"
								subtitle="Starts only after Workflow 1 is fully approved."
								data={tables.wf2}
								hiddenColumns={[...hidden]}
								maxHeight="none"
							/>
						) : (
							<p className="text-sm text-slate-500">
								This band has no committee stage: the request ends after
								Workflow 1.
							</p>
						)}
					</Card>

					<Card size="small">
						<ApprovalTable
							title="After approval"
							data={tables.feeding}
							hiddenColumns={[...hidden]}
							maxHeight="none"
						/>
					</Card>

					{tables.notes.length ? (
						<Card size="small" title="Category-specific changes to this chain">
							<ul className="list-disc pl-5 text-sm text-slate-600">
								{tables.notes.map((note) => (
									<li key={note}>{note}</li>
								))}
							</ul>
						</Card>
					) : null}
				</>
			) : (
				<Card size="small">
					<p className="text-sm text-slate-500">No chain for this selection.</p>
				</Card>
			)}
		</div>
	);
};

/* ----------------------------------- page ----------------------------------- */

const CppApprovalMatrixPage = () => {
	const { showToast } = useToast();
	const { matrixQuery, saveMutation, replaceMutation, syncMutation } =
		useCppMatrix();
	const [tab, setTab] = useState<TabKey>("assignments");
	const [plant, setPlant] = useState<CppPlantFilter>("ANY");
	const [search, setSearch] = useState("");
	const [show, setShow] = useState<ShowFilter>("all");
	// Edits live here until Save; null means "no edits, show what the server has".
	const [edits, setEdits] = useState<SlotMap | null>(null);

	const matrix = matrixQuery.data;
	const server = useMemo(() => (matrix ? toSlotMap(matrix) : {}), [matrix]);
	const draft = edits ?? server;

	const changed: CppMatrixSlotUpdate[] = useMemo(() => {
		if (!matrix) return [];
		const out: CppMatrixSlotUpdate[] = [];
		for (const role of matrix.roles.filter((r) => r.assignable))
			for (const scope of role.scopes) {
				const key = keyOf(role.key, scope);
				if (!sameIds(draft[key], server[key]))
					out.push({ roleKey: role.key, scope, userIds: ids(draft[key]) });
			}
		return out;
	}, [draft, matrix, server]);

	const toastTemplates = (result: CppTemplateSyncResult | null | undefined) => {
		const info = describeTemplates(result);
		if (info)
			showToast({
				type: info.type,
				title:
					info.type === "warning"
						? "Check workflow templates"
						: "Workflow templates",
				description: info.text,
			});
	};

	const handleSave = async () => {
		try {
			const result = await saveMutation.mutateAsync(changed);
			setEdits(null);
			showToast({
				type: "success",
				title: "Approval matrix saved",
				description: `${changed.length} role(s) updated.`,
			});
			toastTemplates(result.templates);
		} catch (error) {
			showToast({
				type: "error",
				title: "Not saved",
				description: getApiErrorMessage(error, "Please try again."),
			});
		}
	};

	const handleReplace = async (from: CppPerson, to: CppPerson) => {
		try {
			const result = await replaceMutation.mutateAsync({
				fromUserId: from.id,
				toUserId: to.id,
			});
			showToast({
				type: "success",
				title: "Person replaced",
				description: `${personLabel(to)} now holds ${personLabel(from)}'s roles.${result.message ? ` ${result.message}.` : ""}`,
			});
			toastTemplates(result.templates);
			return true;
		} catch (error) {
			showToast({
				type: "error",
				title: "Could not replace",
				description: getApiErrorMessage(error, "Please try again."),
			});
			return false;
		}
	};

	const handleSync = async () => {
		try {
			const result = await syncMutation.mutateAsync();
			const info = describeTemplates(result);
			showToast({
				type: info?.type ?? "success",
				title: "Workflow templates refreshed",
				description: info?.text ?? "Every template is up to date.",
			});
		} catch (error) {
			showToast({
				type: "error",
				title: "Could not refresh templates",
				description: getApiErrorMessage(error, "Please try again."),
			});
		}
	};

	const hiddenChanges =
		plant !== "ANY"
			? changed.filter((c) => c.scope !== plant && c.scope !== "ALL").length
			: 0;

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="CPP approval matrix"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "CPP approval matrix location",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{ label: "Contract Price Procurement", href: "/cpp/listing" },
						{ label: "Approval matrix" },
					],
					separator: "›",
				}}
				headerChildren={
					<>
						<Button
							type="button"
							text="Refresh templates"
							Icon={RefreshCw}
							iconPosition="left"
							size="sm"
							appearance="standard"
							variant="outline"
							loading={syncMutation.isPending}
							disabled={!matrix || syncMutation.isPending}
							isTooltip="Rebuild the CPP workflow templates from this matrix (use after a failed refresh)."
							onClick={() => void handleSync()}
						/>
						{tab === "assignments" ? (
							<>
								<Button
									type="button"
									text="Discard changes"
									size="sm"
									appearance="standard"
									variant="outline"
									disabled={!edits || saveMutation.isPending}
									onClick={() => setEdits(null)}
								/>
								<Button
									type="button"
									text={
										saveMutation.isPending
											? "Saving…"
											: `Save${changed.length ? ` (${changed.length})` : ""}`
									}
									Icon={Save}
									iconPosition="left"
									iconSize={16}
									size="sm"
									variant="brand"
									disabled={changed.length === 0 || saveMutation.isPending}
									onClick={() => void handleSave()}
								/>
							</>
						) : null}
					</>
				}
			></PageHeader>

			{matrixQuery.isLoading ? (
				<p className="px-4 py-10 text-center text-sm text-slate-500">
					Loading approval matrix…
				</p>
			) : matrixQuery.isError || !matrix ? (
				<Alert
					variant="error"
					title={getApiErrorMessage(
						matrixQuery.error,
						"Unable to load the approval matrix.",
					)}
					primaryAction={{
						label: "Retry",
						onClick: () => void matrixQuery.refetch(),
					}}
				/>
			) : (
				<div className="flex flex-col gap-4">
					<TabsBar<TabKey>
						items={TABS}
						active={tab}
						onChange={setTab}
						ariaLabel="Approval matrix sections"
					/>

					<FilterBar
						tab={tab}
						plant={plant}
						setPlant={setPlant}
						search={search}
						setSearch={setSearch}
						show={show}
						setShow={setShow}
					/>

					<CoverageBanner issues={matrix.coverage} plant={plant} />

					{hiddenChanges > 0 ? (
						<Alert
							variant="info"
							type="banner"
							title={`${hiddenChanges} unsaved change(s) are in the other plant and hidden by the filter. They are saved too.`}
						/>
					) : null}

					{tab === "assignments" ? (
						<AssignmentsTab
							matrix={matrix}
							server={server}
							draft={draft}
							setDraft={setEdits}
							plant={plant}
							search={search}
							show={show}
						/>
					) : tab === "replace" ? (
						<ReplaceTab
							matrix={matrix}
							plant={plant}
							search={search}
							busy={replaceMutation.isPending}
							blockedByEdits={changed.length > 0}
							onReplace={handleReplace}
						/>
					) : (
						<ChainTab matrix={matrix} plant={plant} />
					)}
				</div>
			)}
		</PageSectionLayout>
	);
};

export default CppApprovalMatrixPage;
