import { Paperclip } from "lucide-react";

import { CRF_CATEGORIES } from "../../../constant";

import type { ColumnConfig, TableRow } from "../../types/lineItem.types";

import {
	ARTWORK_COLUMNS,
	DEFAULT_COLUMNS,
	OVERHEAD_COLUMNS,
} from "../../utils/columnPresets";

type LineTableViewProps = {
	title?: string;
	data?: TableRow[];
	showGrandTotal?: boolean;
	grandTotalLabel?: string;
};

const toDisplayNumber = (value: unknown): number => {
	const parsed = Number(value);

	return Number.isFinite(parsed) ? parsed : 0;
};

const getCategoryTitle = (category?: string | null): string => {
	if (!category) return "--";

	if (category === "EVENT_OVERHEAD") {
		return "Event Cost Overheads";
	}

	return CRF_CATEGORIES.find((item) => item.value === category)?.title ?? "--";
};

const groupByCategory = (data: TableRow[]): Record<string, TableRow[]> => {
	return data.reduce<Record<string, TableRow[]>>((accumulator, row) => {
		const category = row.category || "UNCATEGORIZED";

		if (!accumulator[category]) {
			accumulator[category] = [];
		}

		accumulator[category].push(row);

		return accumulator;
	}, {});
};

const getGrandTotal = (data: TableRow[]): number => {
	return data.reduce((sum, row) => {
		return sum + toDisplayNumber(row.total);
	}, 0);
};

const alignClass = (align?: "left" | "right" | "center"): string => {
	if (align === "right") return "text-right";
	if (align === "center") return "text-center";

	return "text-left";
};

const getColumnSpanClass = (colSpan: number): string => {
	const classes: Record<number, string> = {
		1: "col-span-1",
		2: "col-span-2",
		3: "col-span-3",
		4: "col-span-4",
		5: "col-span-5",
		6: "col-span-6",
		7: "col-span-7",
		8: "col-span-8",
		9: "col-span-9",
		10: "col-span-10",
		11: "col-span-11",
		12: "col-span-12",
	};

	return classes[colSpan] ?? "col-span-1";
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
		<div className="mb-1 text-center">
			{title ? <p className="text-md font-semibold">{title}</p> : null}

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

							const visibleColumns = columns.filter(
								(column) => column.key !== "actions",
							);

							return (
								<div key={category} className="line-view-table">
									<div className="mb-1 text-left text-sm font-semibold text-orange-800">
										{categoryTitle}
									</div>

									<div className="line-view-table-head">
										{visibleColumns.map((column) => (
											<div
												key={column.key}
												className={`${getColumnSpanClass(
													column.colSpan,
												)} ${alignClass(column.align)}`}
											>
												{column.label}
											</div>
										))}
									</div>

									<div className="space-y-1">
										{rows.map((row, index) => (
											<div
												key={row.id ?? `${category}-${index}`}
												className="line-view-row"
											>
												{visibleColumns.map((column) => {
													const columnClass = getColumnSpanClass(
														column.colSpan,
													);

													switch (column.key) {
														case "sno":
															return (
																<div key={column.key} className={columnClass}>
																	{row.sno}.
																</div>
															);

														case "partNumber":
															return (
																<div key={column.key} className={columnClass}>
																	{row.partNumber || "--"}
																</div>
															);

														case "particular":
															return (
																<div
																	key={column.key}
																	className={`${columnClass} font-medium`}
																>
																	{row.particulars || "--"}
																</div>
															);

														case "description":
															return (
																<div key={column.key} className={columnClass}>
																	{row.description || "--"}
																</div>
															);

														case "rate":
															return (
																<div
																	key={column.key}
																	className={`${columnClass} text-right`}
																>
																	{toDisplayNumber(row.rate).toFixed(2)}
																</div>
															);

														case "quantity":
															return (
																<div
																	key={column.key}
																	className={`${columnClass} text-right`}
																>
																	{toDisplayNumber(row.qty)}
																</div>
															);

														case "total":
															return (
																<div
																	key={column.key}
																	className={`${columnClass} text-right font-semibold`}
																>
																	{toDisplayNumber(row.total).toFixed(2)}
																</div>
															);

														case "width":
															return (
																<div
																	key={column.key}
																	className={`${columnClass} text-right`}
																>
																	{row.width ?? "--"}
																</div>
															);

														case "height":
															return (
																<div
																	key={column.key}
																	className={`${columnClass} text-right`}
																>
																	{row.height ?? "--"}
																</div>
															);

														case "unit":
															return (
																<div
																	key={column.key}
																	className={`${columnClass} text-right`}
																>
																	{row.unit ?? "--"}
																</div>
															);

														case "quotation":
															return (
																<div
																	key={column.key}
																	className={`${columnClass} text-center`}
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
																			aria-label={
																				row.quotationFileName
																					? `View quotation: ${row.quotationFileName}`
																					: "View quotation"
																			}
																		>
																			<Paperclip
																				className="h-4 w-4 text-orange-700"
																				aria-hidden="true"
																			/>
																		</a>
																	) : row.quotationFileName ? (
																		<span
																			className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50"
																			title={row.quotationFileName}
																		>
																			<Paperclip
																				className="h-4 w-4 text-slate-500"
																				aria-hidden="true"
																			/>
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

						{showGrandTotal ? (
							<div className="mt-2 flex justify-end border-y border-dashed border-slate-300 px-4 py-1">
								<div className="flex items-center gap-3 text-xs">
									<span className="font-semibold text-slate-600">
										{grandTotalLabel}
									</span>

									<span className="text-sm font-bold tabular-nums text-orange-800">
										{grandTotal.toFixed(2)}
									</span>
								</div>
							</div>
						) : null}
					</>
				)}
			</div>
		</div>
	);
};

export default LineTableView;
