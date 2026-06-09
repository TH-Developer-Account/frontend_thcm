import { Paperclip } from "lucide-react";
import { CRF_CATEGORIES } from "../../../constant";

import type { ColumnConfig } from "../../types/lineItem.types";

import {
	ARTWORK_COLUMNS,
	DEFAULT_COLUMNS,
	OVERHEAD_COLUMNS,
} from "../../utils/columnPresets";

export type TableRow = {
	id?: string;

	sno: number;

	partNumber?: string;

	particulars: string;

	description: string;

	rate?: number;

	qty?: number;

	total?: number;

	height?: number;

	width?: number;

	unit?: string;

	category?: string;
	quotationUrl?: string | null;
	quotationFileName?: string | null;
};

type LineTableViewProps = {
	title?: string;

	data?: TableRow[];

	showGrandTotal?: boolean;

	grandTotalLabel?: string;
};

const toDisplayNumber = (value: unknown) => {
	const parsed = Number(value);

	return Number.isFinite(parsed) ? parsed : 0;
};

const getCategoryTitle = (category?: string | null) => {
	if (!category) return "--";

	if (category === "EVENT_OVERHEAD") {
		return "Event Cost Overheads";
	}

	return CRF_CATEGORIES.find((item) => item.value === category)?.title || "--";
};

const groupByCategory = (data: TableRow[]) => {
	return data.reduce<Record<string, TableRow[]>>((acc, row) => {
		const category = row.category || "UNCATEGORIZED";

		if (!acc[category]) {
			acc[category] = [];
		}

		acc[category].push(row);

		return acc;
	}, {});
};

const getGrandTotal = (data: TableRow[]) => {
	return data.reduce((sum, row) => {
		return sum + toDisplayNumber(row.total);
	}, 0);
};

const alignClass = (align?: "left" | "right" | "center") => {
	if (align === "right") return "text-right";

	if (align === "center") return "text-center";

	return "text-left";
};

const LineTableView = ({
	title,
	data = [],
	showGrandTotal = false,
	grandTotalLabel = "Grand Total:",
}: LineTableViewProps) => {
	const groupedData = groupByCategory(data);

	const grandTotal = getGrandTotal(data);

	return (
		<div className="row-6 mb-1 text-center">
			{title && <p className="text-md font-semibold">{title}</p>}

			<div className="space-y-4">
				{data.length === 0 ? (
					<div className="line-view-empty">No data available</div>
				) : (
					<>
						{Object.entries(groupedData).map(([category, rows]) => {
							const categoryTitle = getCategoryTitle(category);

							const columns: ColumnConfig[] =
								category === "ARTWORK"
									? ARTWORK_COLUMNS
									: category === "EVENT_OVERHEAD"
										? OVERHEAD_COLUMNS
										: DEFAULT_COLUMNS;

							return (
								<div key={category} className="line-view-table">
									{/* Category Title */}
									<div className="mb-1 text-left text-sm font-semibold text-orange-800">
										{categoryTitle}
									</div>

									{/* Header */}
									<div className="line-view-table-head">
										{columns
											.filter((c) => c.key !== "actions")
											.map((column) => (
												<div
													key={column.key}
													className={`col-span-${column.colSpan} ${alignClass(column.align)}`}
												>
													{column.label}
												</div>
											))}
									</div>

									{/* Rows */}
									<div className="space-y-1">
										{rows.map((row, index) => (
											<div
												key={row.id ?? `${category}-${index}`}
												className="line-view-row"
											>
												{columns
													.filter((c) => c.key !== "actions")
													.map((column) => {
														switch (column.key) {
															case "sno":
																return (
																	<div
																		key={column.key}
																		className={`col-span-${column.colSpan}`}
																	>
																		{row.sno}.
																	</div>
																);

															case "partNumber":
																return (
																	<div
																		key={column.key}
																		className={`col-span-${column.colSpan}`}
																	>
																		{row.partNumber || "--"}
																	</div>
																);

															case "particular":
																return (
																	<div
																		key={column.key}
																		className={`col-span-${column.colSpan} font-medium`}
																	>
																		{row.particulars || "--"}
																	</div>
																);

															case "description":
																return (
																	<div
																		key={column.key}
																		className={`col-span-${column.colSpan}`}
																	>
																		{row.description || "--"}
																	</div>
																);

															case "rate":
																return (
																	<div
																		key={column.key}
																		className={`col-span-${column.colSpan} text-right`}
																	>
																		{toDisplayNumber(row.rate).toFixed(2)}
																	</div>
																);

															case "quantity":
																return (
																	<div
																		key={column.key}
																		className={`col-span-${column.colSpan} text-right`}
																	>
																		{toDisplayNumber(row.qty)}
																	</div>
																);

															case "total":
																return (
																	<div
																		key={column.key}
																		className={`col-span-${column.colSpan} text-right font-semibold`}
																	>
																		{toDisplayNumber(row.total).toFixed(2)}
																	</div>
																);

															case "width":
																return (
																	<div
																		key={column.key}
																		className={`col-span-${column.colSpan} text-right`}
																	>
																		{row.width ?? "--"}
																	</div>
																);

															case "height":
																return (
																	<div
																		key={column.key}
																		className={`col-span-${column.colSpan} text-right`}
																	>
																		{row.height ?? "--"}
																	</div>
																);

															case "unit":
																return (
																	<div
																		key={column.key}
																		className={`col-span-${column.colSpan}  text-right`}
																	>
																		{row.unit ?? "--"}
																	</div>
																);
															case "quotation":
																return (
																	<div
																		key={column.key}
																		className={`col-span-${column.colSpan} text-center`}
																	>
																		{row.quotationUrl ? (
																			<a
																				href={row.quotationUrl}
																				target="_blank"
																				rel="noreferrer"
																				className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 hover:bg-orange-50"
																				title={
																					row.quotationFileName ??
																					"View quotation"
																				}
																			>
																				<Paperclip className="h-4 w-4 text-orange-700" />
																			</a>
																		) : row.quotationFileName ? (
																			<span
																				className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50"
																				title={row.quotationFileName}
																			>
																				<Paperclip className="h-4 w-4 text-slate-500" />
																			</span>
																		) : (
																			<span className="text-xs text-slate-400">
																				--
																			</span>
																		)}
																	</div>
																);

															default:
																return null;
														}
													})}
											</div>
										))}
									</div>
								</div>
							);
						})}

						{/* Grand Total */}
						{showGrandTotal && (
							<div className="mt-2 flex justify-end border-t border-b border-slate-300 border-dashed  px-4 py-1">
								<div className="flex items-center gap-3 text-xs">
									<span className="font-semibold text-slate-600">
										{grandTotalLabel}
									</span>

									<span className="text-sm font-bold tabular-nums text-orange-800">
										{grandTotal.toFixed(2)}
									</span>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default LineTableView;
