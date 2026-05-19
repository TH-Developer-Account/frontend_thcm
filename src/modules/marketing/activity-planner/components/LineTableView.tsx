import { CRF_CATEGORIES } from "../../constant";

export type TableRow = {
	id?: string;
	sno: number;
	particulars: string;
	description: string;
	rate: number;
	qty: number;
	total: number;
	height?: string;
	width?: string;
	category?: string;
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

const LineTableView = ({
	title,
	data = [],
	showGrandTotal = false,
	grandTotalLabel = "Grand Total:",
}: LineTableViewProps) => {
	const groupedData = groupByCategory(data);
	const grandTotal = getGrandTotal(data);

	return (
		<div className="row-6 text-center mb-1">
			{title && <p className="font-semibold text-md">{title}</p>}

			<div className="line-view-table">
				<div className="line-view-table-head">
					<div className="col-span-1">SNo.</div>
					<div className="col-span-2 text-left">Category</div>
					<div className="col-span-2">Particulars</div>
					<div className="col-span-3">Description</div>
					<div className="col-span-1 text-right">Rate</div>
					<div className="col-span-1 text-right">Qty</div>
					<div className="col-span-2 text-right">Total</div>
				</div>

				{data.length === 0 ? (
					<div className="line-view-empty">No data available</div>
				) : (
					<>
						{Object.entries(groupedData).map(([category, rows]) => {
							const categoryTitle = getCategoryTitle(category);

							return (
								<div key={category} className="line-view-group">
									{rows.map((row, index) => (
										<div
											key={row.id ?? `${category}-${index}`}
											className="line-view-row"
										>
											<div className="col-span-1 text-gray-500">{row.sno}.</div>

											<div className="col-span-2 text-left font-medium text-gray-700">
												{index === 0 ? categoryTitle : ""}
											</div>

											<div className="col-span-2 font-medium text-gray-900">
												{row.particulars || "--"}
											</div>

											<div className="col-span-3 text-gray-600">
												{row.description || "--"}
											</div>

											<div className="col-span-1 text-right tabular-nums text-gray-800">
												{toDisplayNumber(row.rate).toFixed(2)}
											</div>

											<div className="col-span-1 text-right tabular-nums text-gray-800">
												{toDisplayNumber(row.qty)}
											</div>

											<div className="col-span-2 text-right font-semibold tabular-nums text-gray-950">
												{toDisplayNumber(row.total).toFixed(2)}
											</div>
										</div>
									))}
								</div>
							);
						})}

						{showGrandTotal && (
							<div className="mt-2 flex justify-end rounded-md border border-slate-300 bg-slate-100 px-3 py-1">
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
