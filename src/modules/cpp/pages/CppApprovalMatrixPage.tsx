// pages/CppApprovalMatrixPage.tsx — admin: who sits in which approval role.
//
// The 71 workflow chains only name ROLES (e.g. "Head SCM KGP"). This screen maps
// roles to people, so the yearly change is: pick a role, change the person.
// No workflow rule is ever edited here.
//   Tab 1  Assignments    edit people per role / plant, save
//   Tab 2  Replace person one person takes over every role of another
//   Tab 3  Workflow chains read-only preview with the names filled in
// The server refuses a save that leaves a required role empty.
import { useMemo, useState } from "react";
import { AlertTriangle, Plus, Save, X } from "lucide-react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { useToast } from "../../../context/Auth/AuthContext";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import CppPersonPicker, { personLabel } from "../components/CppPersonPicker";
import { useCppChains, useCppMatrix } from "../hooks/useCppMatrix";
import type {
	CppApprovalMatrix,
	CppChain,
	CppChainStep,
	CppCoverageIssue,
	CppMatrixRole,
	CppMatrixSlotUpdate,
	CppPerson,
	CppSlotScope,
} from "../types/cpp.types";

type SlotMap = Record<string, CppPerson[]>;
const keyOf = (roleKey: string, scope: string) => `${roleKey}:${scope}`;

const toSlotMap = (matrix: CppApprovalMatrix): SlotMap =>
	Object.fromEntries(matrix.assignments.map((a) => [keyOf(a.roleKey, a.scope), a.users]));

const ids = (people: CppPerson[] | undefined) => (people ?? []).map((p) => p.id);
const sameIds = (a: CppPerson[] | undefined, b: CppPerson[] | undefined) =>
	JSON.stringify(ids(a)) === JSON.stringify(ids(b));

const SCOPE_LABEL: Record<CppSlotScope, string> = { ALL: "All plants", KGP: "KGP", DWD: "DWD" };

type TabKey = "assignments" | "replace" | "chains";
const TABS: { key: TabKey; label: string }[] = [
	{ key: "assignments", label: "Assignments" },
	{ key: "replace", label: "Replace a person" },
	{ key: "chains", label: "Workflow chains" },
];

/* ------------------------------ coverage banner ----------------------------- */

const CoverageBanner = ({ issues }: { issues: CppCoverageIssue[] }) => {
	if (issues.length === 0)
		return (
			<div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
				Every role used by a workflow has someone assigned.
			</div>
		);
	const errors = issues.filter((i) => i.severity === "error");
	const warnings = issues.filter((i) => i.severity === "warning");
	return (
		<div className="flex flex-col gap-2">
			{errors.length > 0 ? (
				<div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					<p className="flex items-center gap-2 font-medium">
						<AlertTriangle size={16} /> {errors.length} role{errors.length === 1 ? "" : "s"} need a person — requests that reach them would get stuck
					</p>
					<ul className="mt-1 list-disc pl-6">
						{errors.map((issue) => (
							<li key={`${issue.roleKey}:${issue.scope}`}>{issue.message}</li>
						))}
					</ul>
				</div>
			) : null}
			{warnings.length > 0 ? (
				<div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
					<ul className="list-disc pl-5">
						{warnings.map((issue) => (
							<li key={`${issue.roleKey}:${issue.scope}:w`}>{issue.message}</li>
						))}
					</ul>
				</div>
			) : null}
		</div>
	);
};

/* ------------------------------- assignments tab ---------------------------- */

const SlotRow = ({
	role,
	scope,
	people,
	issue,
	onChange,
}: {
	role: CppMatrixRole;
	scope: CppSlotScope;
	people: CppPerson[];
	issue: boolean;
	onChange: (next: CppPerson[]) => void;
}) => {
	const [adding, setAdding] = useState(false);
	return (
		<tr className={issue ? "bg-red-50/60" : undefined}>
			<td className="px-3 py-2 align-top">
				<div className="text-sm font-medium text-slate-800">{role.label}</div>
				{role.note ? <div className="text-xs text-slate-500">{role.note}</div> : null}
				<div className="text-xs text-slate-400">
					{role.usedByBands > 0 ? `Used in ${role.usedByBands} workflow bands` : "Not used by a band"}
				</div>
			</td>
			<td className="px-3 py-2 align-top text-sm text-slate-600">{SCOPE_LABEL[scope]}</td>
			<td className="px-3 py-2 align-top">
				<div className="flex flex-wrap items-center gap-2">
					{people.map((person) => (
						<span
							key={person.id}
							className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-sm text-slate-800"
							title={person.email ?? undefined}
						>
							{personLabel(person)}
							<button
								type="button"
								aria-label={`Remove ${personLabel(person)}`}
								className="rounded-full p-1 text-slate-500 hover:bg-slate-200"
								onClick={() => onChange(people.filter((p) => p.id !== person.id))}
							>
								<X size={14} />
							</button>
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
						<button
							type="button"
							className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1 text-sm text-slate-600 hover:border-slate-500"
							onClick={() => setAdding(true)}
						>
							<Plus size={14} /> {role.observer ? "Add observer" : "Add person"}
						</button>
					)}
				</div>
				{issue ? <p className="mt-1 text-xs text-red-600">Nobody assigned</p> : null}
			</td>
		</tr>
	);
};

const AssignmentsTab = ({
	matrix,
	draft,
	setDraft,
}: {
	matrix: CppApprovalMatrix;
	draft: SlotMap;
	setDraft: (next: SlotMap) => void;
}) => {
	const groups = useMemo(() => {
		const map = new Map<string, CppMatrixRole[]>();
		matrix.roles
			.filter((role) => role.assignable)
			.forEach((role) => map.set(role.group, [...(map.get(role.group) ?? []), role]));
		return [...map.entries()];
	}, [matrix.roles]);

	const missing = new Set(
		matrix.coverage.filter((i) => i.severity === "error").map((i) => keyOf(i.roleKey, i.scope)),
	);

	return (
		<div className="flex flex-col gap-4">
			{groups.map(([group, roles]) => (
				<Card key={group} size="small" title={group}>
					<div className="overflow-x-auto">
						<table className="w-full text-left">
							<thead>
								<tr className="text-xs uppercase tracking-wide text-slate-500">
									<th className="w-72 px-3 py-2">Role</th>
									<th className="w-28 px-3 py-2">Plant</th>
									<th className="px-3 py-2">People</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{roles.flatMap((role) =>
									role.scopes.map((scope) => {
										const key = keyOf(role.key, scope);
										return (
											<SlotRow
												key={key}
												role={role}
												scope={scope}
												people={draft[key] ?? []}
												issue={missing.has(key) && (draft[key] ?? []).length === 0}
												onChange={(next) => setDraft({ ...draft, [key]: next })}
											/>
										);
									}),
								)}
							</tbody>
						</table>
					</div>
				</Card>
			))}
		</div>
	);
};

/* -------------------------------- replace tab ------------------------------- */

const ReplaceTab = ({
	matrix,
	busy,
	onReplace,
}: {
	matrix: CppApprovalMatrix;
	busy: boolean;
	onReplace: (from: CppPerson, to: CppPerson) => void;
}) => {
	const [from, setFrom] = useState<CppPerson | null>(null);
	const [to, setTo] = useState<CppPerson | null>(null);

	const holders = useMemo(() => {
		const byId = new Map<string, { person: CppPerson; slots: string[] }>();
		const roleLabel = new Map(matrix.roles.map((r) => [r.key, r.label]));
		matrix.assignments.forEach((a) =>
			a.users.forEach((person) => {
				const entry = byId.get(person.id) ?? { person, slots: [] };
				entry.slots.push(`${roleLabel.get(a.roleKey) ?? a.roleKey}${a.scope === "ALL" ? "" : ` (${a.scope})`}`);
				byId.set(person.id, entry);
			}),
		);
		return [...byId.values()].sort((a, b) => personLabel(a.person).localeCompare(personLabel(b.person)));
	}, [matrix]);

	const leaving = holders.find((h) => h.person.id === from?.id);

	return (
		<Card size="small" title="Replace a person in every role">
			<div className="flex flex-col gap-4">
				<p className="text-sm text-slate-600">
					Use this when someone leaves or changes job. The new person takes over every role
					the old person holds. Requests already in approval are not changed.
				</p>
				<div className="grid gap-4 lg:grid-cols-2">
					<div>
						<p className="mb-1 text-sm font-medium text-slate-700">Person being replaced</p>
						<select
							className="h-9 w-72 max-w-full rounded-md border border-slate-300 px-2 text-sm"
							value={from?.id ?? ""}
							onChange={(event) =>
								setFrom(holders.find((h) => h.person.id === event.target.value)?.person ?? null)
							}
						>
							<option value="">Select a person</option>
							{holders.map(({ person, slots }) => (
								<option key={person.id} value={person.id}>
									{personLabel(person)} — {slots.length} role{slots.length === 1 ? "" : "s"}
								</option>
							))}
						</select>
						{leaving ? (
							<ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
								{leaving.slots.map((slot) => (
									<li key={slot}>{slot}</li>
								))}
							</ul>
						) : null}
					</div>
					<div>
						<p className="mb-1 text-sm font-medium text-slate-700">New person</p>
						{to ? (
							<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-sm">
								{personLabel(to)}
								<button type="button" aria-label="Clear" className="rounded-full p-1 hover:bg-slate-200" onClick={() => setTo(null)}>
									<X size={14} />
								</button>
							</span>
						) : (
							<CppPersonPicker excludeIds={from ? [from.id] : []} onPick={setTo} />
						)}
					</div>
				</div>
				<div>
					<Button
						type="button"
						text={busy ? "Replacing…" : "Replace everywhere"}
						size="sm"
						variant="brand"
						disabled={!from || !to || busy}
						onClick={() => from && to && onReplace(from, to)}
					/>
				</div>
			</div>
		</Card>
	);
};

/* -------------------------------- chains tab -------------------------------- */

const ChainTab = ({ matrix }: { matrix: CppApprovalMatrix }) => {
	const { data, isLoading, isError } = useCppChains();
	const [ruleId, setRuleId] = useState("");
	const roleLabel = useMemo(() => new Map(matrix.roles.map((r) => [r.key, r.label])), [matrix.roles]);
	const slots = useMemo(() => toSlotMap(matrix), [matrix]);

	if (isLoading) return <p className="text-sm text-slate-500">Loading workflow chains…</p>;
	if (isError || !data) return <p className="text-sm text-red-600">Could not load the workflow chains.</p>;

	const chain: CppChain | undefined = data.chains.find((c) => c.ruleId === ruleId) ?? data.chains[0];
	const who = (roleKey: string): string => {
		const role = matrix.roles.find((r) => r.key === roleKey);
		const scopes = role?.scopes ?? ["ALL"];
		const text = scopes
			.map((scope) => {
				const names = (slots[keyOf(roleKey, scope)] ?? []).map(personLabel).join(", ");
				return `${scopes.length > 1 ? `${scope}: ` : ""}${names || "— nobody —"}`;
			})
			.join("  |  ");
		return text;
	};

	const renderSteps = (steps: CppChainStep[]) => (
		<ol className="flex flex-col gap-2">
			{steps.map((step, index) => (
				<li key={`${step.label}-${index}`} className="rounded-md border border-slate-200 px-3 py-2">
					<div className="flex flex-wrap items-baseline gap-2">
						<span className="text-sm font-medium text-slate-800">{step.label}</span>
						<span className="text-xs text-slate-500">{step.title}</span>
						{step.mode === "ANY_ONE" ? <span className="rounded bg-sky-50 px-2 text-xs text-sky-700">any one approves</span> : null}
						{step.kind === "COMMITTEE" && step.required ? (
							<span className="rounded bg-sky-50 px-2 text-xs text-sky-700">{step.required} approvals needed</span>
						) : null}
					</div>
					{step.roleKeys.map((roleKey) => (
						<div key={roleKey} className="mt-1 text-sm text-slate-600">
							<span className="text-slate-500">{roleLabel.get(roleKey) ?? roleKey}:</span> {who(roleKey)}
						</div>
					))}
				</li>
			))}
		</ol>
	);

	return (
		<Card size="small" title="Workflow chains (read-only)">
			<div className="flex flex-col gap-4">
				<select
					className="h-9 max-w-full rounded-md border border-slate-300 px-2 text-sm"
					value={chain?.ruleId ?? ""}
					onChange={(event) => setRuleId(event.target.value)}
					aria-label="Workflow chain"
				>
					{data.chains.map((c) => (
						<option key={c.ruleId} value={c.ruleId}>
							{c.sheet} · {c.block === "SPARES" ? "Spares" : "Main"} · {c.bandLabel}
						</option>
					))}
				</select>
				{data.problems.length > 0 ? (
					<p className="text-sm text-amber-700">{data.problems.length} chain problem(s) reported by the server.</p>
				) : null}
				{chain ? (
					<div className="grid gap-4 lg:grid-cols-2">
						<div>
							<h3 className="mb-2 text-sm font-semibold text-slate-700">Workflow 1 — plant / SCM</h3>
							{renderSteps(chain.wf1)}
						</div>
						<div>
							<h3 className="mb-2 text-sm font-semibold text-slate-700">Workflow 2 — CPP committee</h3>
							{chain.wf2.length ? renderSteps(chain.wf2) : <p className="text-sm text-slate-500">This band has no committee stage.</p>}
							<h3 className="mb-2 mt-4 text-sm font-semibold text-slate-700">Price feeding</h3>
							<div className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600">
								<span className="text-slate-500">{roleLabel.get(chain.priceFeeding.roleKey) ?? chain.priceFeeding.roleKey}:</span>{" "}
								{who(chain.priceFeeding.roleKey)}
							</div>
						</div>
					</div>
				) : null}
			</div>
		</Card>
	);
};

/* ----------------------------------- page ----------------------------------- */

const CppApprovalMatrixPage = () => {
	const { showToast } = useToast();
	const { matrixQuery, saveMutation, replaceMutation } = useCppMatrix();
	const [tab, setTab] = useState<TabKey>("assignments");
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

	const handleSave = async () => {
		try {
			await saveMutation.mutateAsync(changed);
			setEdits(null);
			showToast({ type: "success", title: "Approval matrix saved", description: `${changed.length} role(s) updated.` });
		} catch (error) {
			showToast({ type: "error", title: "Not saved", description: getApiErrorMessage(error, "Please try again.") });
		}
	};

	const handleReplace = async (from: CppPerson, to: CppPerson) => {
		try {
			const result = await replaceMutation.mutateAsync({ fromUserId: from.id, toUserId: to.id });
			setEdits(null);
			void result;
			showToast({ type: "success", title: "Person replaced", description: `${personLabel(to)} now holds ${personLabel(from)}'s roles.` });
		} catch (error) {
			showToast({ type: "error", title: "Could not replace", description: getApiErrorMessage(error, "Please try again.") });
		}
	};

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
			>
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
							text={saveMutation.isPending ? "Saving…" : `Save${changed.length ? ` (${changed.length})` : ""}`}
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
			</PageHeader>

			{matrixQuery.isLoading ? (
				<p className="px-4 py-10 text-center text-sm text-slate-500">Loading approval matrix…</p>
			) : matrixQuery.isError || !matrix ? (
				<div role="alert" className="flex flex-col items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3">
					<p className="text-sm text-red-700">{getApiErrorMessage(matrixQuery.error, "Unable to load the approval matrix.")}</p>
					<Button type="button" text="Retry" size="sm" appearance="standard" variant="outline" onClick={() => void matrixQuery.refetch()} />
				</div>
			) : (
				<div className="flex flex-col gap-4">
					<CoverageBanner issues={matrix.coverage} />

					<div role="tablist" aria-label="Approval matrix sections" className="flex gap-1 border-b border-slate-200">
						{TABS.map((item) => (
							<button
								key={item.key}
								type="button"
								role="tab"
								aria-selected={tab === item.key}
								onClick={() => setTab(item.key)}
								className={`-mb-px border-b-2 px-4 py-2 text-sm ${
									tab === item.key
										? "border-slate-800 font-medium text-slate-900"
										: "border-transparent text-slate-500 hover:text-slate-700"
								}`}
							>
								{item.label}
							</button>
						))}
					</div>

					{tab === "assignments" ? (
						<AssignmentsTab matrix={matrix} draft={draft} setDraft={setEdits} />
					) : tab === "replace" ? (
						<ReplaceTab matrix={matrix} busy={replaceMutation.isPending} onReplace={handleReplace} />
					) : (
						<ChainTab matrix={matrix} />
					)}
				</div>
			)}
		</PageSectionLayout>
	);
};

export default CppApprovalMatrixPage;
