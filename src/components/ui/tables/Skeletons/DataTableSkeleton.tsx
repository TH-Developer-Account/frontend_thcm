type DataTableSkeletonProps = {
	rows?: number;
	columns?: number;
	showHeader?: boolean;
	showPagination?: boolean;
	className?: string;
};

const DataTableSkeleton = ({
	rows = 8,
	columns = 6,
	showHeader = true,
	showPagination = true,
	className = "",
}: DataTableSkeletonProps) => {
	return (
		<section
			className={["data-table-shell", "data-table-shell-loading", className]
				.filter(Boolean)
				.join(" ")}
			aria-label="Loading table"
			aria-busy="true"
		>
			<div className="data-table-scroll scrollbar-sleek" aria-hidden="true">
				<table className="data-table">
					{showHeader ? (
						<thead className="data-table-head">
							<tr className="data-table-head-row">
								{Array.from({ length: columns }).map((_, index) => (
									<th key={index} className="data-table-head-cell">
										<div className="data-table-skeleton data-table-skeleton-header" />
									</th>
								))}
							</tr>
						</thead>
					) : null}

					<tbody className="data-table-body">
						{Array.from({ length: rows }).map((_, rowIndex) => (
							<tr
								key={rowIndex}
								className="data-table-row data-table-row-loading"
							>
								{Array.from({ length: columns }).map((__, columnIndex) => (
									<td
										key={columnIndex}
										className="data-table-cell data-table-cell-text"
									>
										<div className="data-table-cell-inner">
											<div
												className={`data-table-skeleton ${
													columnIndex === 0
														? "data-table-skeleton-wide"
														: columnIndex === columns - 1
															? "data-table-skeleton-short"
															: ""
												}`}
											/>
										</div>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{showPagination ? (
				<footer className="data-table-pagination" aria-hidden="true">
					<div className="data-table-pagination-inner data-table-skeleton-pagination">
						<div className="data-table-skeleton data-table-skeleton-wide" />
						<div className="data-table-skeleton-actions">
							<div className="data-table-skeleton data-table-skeleton-control" />
							<div className="data-table-skeleton data-table-skeleton-control" />
							<div className="data-table-skeleton data-table-skeleton-control" />
						</div>
					</div>
				</footer>
			) : null}
		</section>
	);
};

export default DataTableSkeleton;
