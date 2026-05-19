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
};

const toDisplayNumber = (value: unknown) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

export const getCategoryTitle = (category?: string | null) => {
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

const LineTableView = ({ title, data = [] }: LineTableViewProps) => {
	const groupedData = groupByCategory(data);

	return (
		<div className="row-6 text-center mb-1">
			{title && <p className="font-semibold text-md">{title}</p>}

			<div className="line-view-table">
				<div className="line-view-table-head">
					<div className="col-span-1">SNo.</div>
					<div className="col-span-2">Particulars</div>
					<div className="col-span-5">Description</div>
					<div className="col-span-1 text-right">Rate</div>
					<div className="col-span-1 text-right">Qty</div>
					<div className="col-span-2 text-right">Total</div>
				</div>

				{data.length === 0 ? (
					<div className="line-view-empty">No data available</div>
				) : (
					Object.entries(groupedData).map(([category, rows]) => {
						const categoryTitle =
							category === "EVENT_OVERHEAD" ? "" : getCategoryTitle(category);

						return (
							<div key={category} className="line-view-group">
								{categoryTitle && (
									<div className="line-view-category">
										<span>{categoryTitle}</span>
									</div>
								)}

								{rows.map((row, index) => (
									<div
										key={row.id ?? `${category}-${index}`}
										className="line-view-row"
									>
										<div className="col-span-1 text-gray-500">{row.sno}.</div>

										<div className="col-span-2 font-medium text-gray-900">
											{row.particulars || "--"}
										</div>

										<div className="col-span-5 text-gray-600">
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
					})
				)}
			</div>
		</div>
	);
};

export default LineTableView;
