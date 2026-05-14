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
		<div className={`workflow-table-shell ${className}`}>
			<div className="workflow-table-scroll scrollbar-sleek">
				<table className="workflow-table">
					{showHeader && (
						<thead className="workflow-table-head">
							<tr>
								{Array.from({ length: columns }).map((_, index) => (
									<th key={index} className="workflow-table-head-cell">
										<div className="workflow-table-skeleton h-3 w-20" />
									</th>
								))}
							</tr>
						</thead>
					)}

					<tbody>
						{Array.from({ length: rows }).map((_, rowIndex) => (
							<tr key={rowIndex} className="workflow-table-row">
								{Array.from({ length: columns }).map((_, columnIndex) => (
									<td key={columnIndex} className="workflow-table-cell-text">
										<div className="workflow-table-cell-inner">
											<div
												className={`workflow-table-skeleton h-3 ${
													columnIndex === 0
														? "w-32"
														: columnIndex === columns - 1
															? "w-20"
															: "w-24"
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

			{showPagination && (
				<div className="workflow-table-pagination">
					<div className="workflow-table-pagination-inner flex items-center justify-between">
						<div className="workflow-table-skeleton h-3 w-32" />

						<div className="flex items-center gap-2">
							<div className="workflow-table-skeleton h-8 w-20" />
							<div className="workflow-table-skeleton h-8 w-8" />
							<div className="workflow-table-skeleton h-8 w-8" />
							<div className="workflow-table-skeleton h-8 w-20" />
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DataTableSkeleton;
