import type { MasterDef } from "./masters.config";
import type { MasterRow } from "./masters.types";

type MasterListProps = {
	def: MasterDef;
	/** The current page of rows, already filtered by search. */
	result: { items: MasterRow[]; total: number; page: number; limit: number };
	isLoading: boolean;
	isError: boolean;
	search: string;
	selectedId: string | null;
	onSearchChange: (value: string) => void;
	onPageChange: (page: number) => void;
	onSelect: (row: MasterRow) => void;
	onAdd: () => void;
	onRetry: () => void;
	/** Mobile only: back to the hub. */
	onBack: () => void;
};

export const MasterList = ({
	def,
	result,
	isLoading,
	isError,
	search,
	selectedId,
	onSearchChange,
	onPageChange,
	onSelect,
	onAdd,
	onRetry,
	onBack,
}: MasterListProps) => {
	const { items, total, page, limit } = result;
	const totalPages = Math.max(Math.ceil(total / limit), 1);
	const from = total === 0 ? 0 : (page - 1) * limit + 1;
	const to = Math.min(page * limit, total);

	// Skip columns the feed never fills (e.g. budget fiscal year today).
	const columns = def.columns.filter(
		(column) => !column.hideIfEmpty || items.some((row) => column.render(row)),
	);

	return (
		<section className="mh-list" aria-label={def.label}>
			<header className="mh-list-head">
				<button
					type="button"
					className="mh-back"
					onClick={onBack}
					aria-label="Back to all masters"
				>
					‹
				</button>
				<h2 className="mh-list-title">
					{def.label} <span className="mh-list-count">· {total}</span>
				</h2>
				<button type="button" className="mh-btn mh-btn--brand" onClick={onAdd}>
					+ Add {def.singular}
				</button>
			</header>

			<div className="mh-list-tools">
				<label className="mh-search">
					<span className="sr-only">Search {def.label}</span>
					<input
						type="search"
						value={search}
						placeholder={def.searchPlaceholder}
						onChange={(event) => onSearchChange(event.target.value)}
					/>
				</label>
			</div>

			<div className="mh-rows">
				{isError ? (
					<div className="mh-empty" role="alert">
						<p>Could not load {def.label.toLowerCase()}.</p>
						<button type="button" className="mh-btn" onClick={onRetry}>
							Try again
						</button>
					</div>
				) : isLoading ? (
					<div className="mh-empty">Loading…</div>
				) : items.length === 0 ? (
					<div className="mh-empty">
						<p>
							{search
								? `No ${def.label.toLowerCase()} match “${search}”.`
								: `No ${def.label.toLowerCase()} yet.`}
						</p>
					</div>
				) : (
					<table className="mh-table">
						<thead>
							<tr>
								{columns.map((column) => (
									<th
										key={column.key}
										scope="col"
										className={
											column.align === "right" ? "is-right" : undefined
										}
									>
										{column.label}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{items.map((row) => (
								<tr
									key={row.id}
									className={row.id === selectedId ? "is-selected" : undefined}
									aria-selected={row.id === selectedId}
									tabIndex={0}
									onClick={() => onSelect(row)}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											onSelect(row);
										}
									}}
								>
									{columns.map((column) => (
										<td
											key={column.key}
											className={
												column.align === "right" ? "is-right" : undefined
											}
											title={column.render(row) || undefined}
										>
											{column.render(row) || "—"}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{total > limit ? (
				<footer className="mh-pager">
					<span>
						{from}–{to} of {total}
					</span>
					<div>
						<button
							type="button"
							className="mh-btn"
							disabled={page <= 1}
							onClick={() => onPageChange(page - 1)}
						>
							Previous
						</button>
						<button
							type="button"
							className="mh-btn"
							disabled={page >= totalPages}
							onClick={() => onPageChange(page + 1)}
						>
							Next
						</button>
					</div>
				</footer>
			) : null}
		</section>
	);
};
