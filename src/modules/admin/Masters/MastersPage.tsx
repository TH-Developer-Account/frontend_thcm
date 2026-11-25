import { useEffect, useMemo, useState } from "react";

import PageSectionLayout from "../../../layout/PageSectionLayout";
import { useMasterData } from "../../../hooks/useMasterData";
import { useSaveMaster } from "../../../hooks/useSaveMaster";

import { MasterForm } from "./MasterForm";
import { MasterHub } from "./MasterHub";
import { MasterList } from "./MasterList";
import {
	DEFAULT_MASTER_KEY,
	MASTER_DEFS,
	buildPayloadData,
	getMasterDef,
} from "./masters.config";
import type { FeedOption, MasterFormValues, MasterKey, MasterRow } from "./masters.types";

import "./masters-hub.css";

const PAGE_SIZE = 25;

/** Which pane is visible on phones. On desktop all panes show at once. */
type Pane = "hub" | "list" | "form";

type ToastState = { type: "success" | "error"; message: string } | null;

type Feed = Record<string, FeedOption[] | undefined>;

const errorMessage = (error: unknown): string => {
	const data = (error as { response?: { data?: { error?: string; message?: string } } })
		?.response?.data;

	return data?.error || data?.message || (error instanceof Error ? error.message : "Request failed");
};

const useDebounced = <T,>(value: T, delay: number): T => {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = window.setTimeout(() => setDebounced(value), delay);
		return () => window.clearTimeout(timer);
	}, [value, delay]);

	return debounced;
};

/**
 * Masters admin: a hub of master cards, then a split list/detail view.
 * Phones show one pane at a time: hub → list → full-page form.
 *
 * Data comes from the shared GET /master-data cache (useMasterData); counts,
 * search and paging are worked out here. Saves use POST /master-data/manage.
 */
const MastersPage = () => {
	const [activeKey, setActiveKey] = useState<MasterKey>(DEFAULT_MASTER_KEY);
	const [pane, setPane] = useState<Pane>("hub");
	const [searchInput, setSearchInput] = useState("");
	const [page, setPage] = useState(1);
	// A row = editing it, "new" = creating, null = nothing open.
	const [selected, setSelected] = useState<MasterRow | "new" | null>(null);
	const [toast, setToast] = useState<ToastState>(null);

	const def = getMasterDef(activeKey);
	const search = useDebounced(searchInput.trim().toLowerCase(), 250);

	const master = useMasterData();
	const saveMaster = useSaveMaster();

	const feed = master.data as unknown as Feed | undefined;

	// Every master's rows, built once per refetch.
	const rowsByMaster = useMemo(() => {
		const result = {} as Record<MasterKey, MasterRow[]>;

		for (const item of MASTER_DEFS) {
			result[item.key] = (feed?.[item.feedKey] ?? []).map(item.toRow);
		}

		return result;
	}, [feed]);

	const counts = useMemo(
		() =>
			feed
				? (Object.fromEntries(
						MASTER_DEFS.map((item) => [item.key, rowsByMaster[item.key].length]),
					) as Record<MasterKey, number>)
				: {},
		[feed, rowsByMaster],
	);

	const filtered = useMemo(() => {
		const rows = rowsByMaster[activeKey];
		if (!search) return rows;

		return rows.filter((row) =>
			[row.name, row.code, row.id_desc].some((part) => part?.toLowerCase().includes(search)),
		);
	}, [rowsByMaster, activeKey, search]);

	const pageRows = useMemo(
		() => ({
			items: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
			total: filtered.length,
			page,
			limit: PAGE_SIZE,
		}),
		[filtered, page],
	);

	useEffect(() => {
		if (!toast) return;
		const timer = window.setTimeout(() => setToast(null), 4000);
		return () => window.clearTimeout(timer);
	}, [toast]);

	// Keep the open record in step with a refetch (e.g. after Save).
	const activeRows = rowsByMaster[activeKey];
	useEffect(() => {
		setSelected((current) => {
			if (!current || current === "new") return current;
			return activeRows.find((row) => row.id === current.id) ?? current;
		});
	}, [activeRows]);

	const notify = (type: "success" | "error", message: string) => setToast({ type, message });

	const handleSelectMaster = (key: MasterKey) => {
		setActiveKey(key);
		setSelected(null);
		setSearchInput("");
		setPage(1);
		setPane("list");
	};

	const handleSearchChange = (value: string) => {
		setSearchInput(value);
		setPage(1);
	};

	const openRow = (row: MasterRow) => {
		setSelected(row);
		setPane("form");
	};

	const openNew = () => {
		setSelected("new");
		setPane("form");
	};

	const closeForm = () => {
		setSelected(null);
		setPane("list");
	};

	const handleSave = async (values: MasterFormValues) => {
		const editing = selected && selected !== "new" ? selected : null;
		const data = buildPayloadData(def, values);
		if (editing) data.id = editing.id;

		try {
			const response = await saveMaster.mutateAsync({
				type: activeKey,
				action: editing ? "update" : "create",
				data,
			});

			notify("success", response?.message || `${def.singular} saved`);
			if (!editing) closeForm();
		} catch (error) {
			notify("error", errorMessage(error));
			throw error;
		}
	};

	const selectedRow = selected && selected !== "new" ? selected : null;

	return (
		<PageSectionLayout>
			<div className="mh" data-pane={pane}>
				<header className="mh-header">
					<h1 className="mh-title">Masters</h1>
					<p className="mh-subtitle">Reference data used across the dropdowns of every app.</p>
				</header>

				<MasterHub
					activeKey={activeKey}
					counts={counts}
					isLoading={master.isLoading}
					onSelect={handleSelectMaster}
				/>

				<div className="mh-split">
					<MasterList
						def={def}
						result={pageRows}
						isLoading={master.isLoading}
						isError={master.isError}
						search={searchInput}
						selectedId={selectedRow?.id ?? null}
						onSearchChange={handleSearchChange}
						onPageChange={setPage}
						onSelect={openRow}
						onAdd={openNew}
						onRetry={() => void master.refetch()}
						onBack={() => setPane("hub")}
					/>

					<div className="mh-detail">
						{selected ? (
							<MasterForm
								key={`${activeKey}:${selectedRow?.id ?? "new"}`}
								def={def}
								row={selectedRow}
								isSaving={saveMaster.isPending}
								onSave={handleSave}
								onClose={closeForm}
							/>
						) : (
							<div className="mh-empty mh-empty--detail">
								<p>Select a {def.singular} to view or edit it.</p>
								<button type="button" className="mh-btn mh-btn--brand" onClick={openNew}>
									+ Add {def.singular}
								</button>
							</div>
						)}
					</div>
				</div>

				{toast ? (
					<div
						className={`mh-toast mh-toast--${toast.type}`}
						role={toast.type === "error" ? "alert" : "status"}
					>
						{toast.message}
					</div>
				) : null}
			</div>
		</PageSectionLayout>
	);
};

export default MastersPage;
