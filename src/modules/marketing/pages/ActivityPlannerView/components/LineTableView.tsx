import React from "react";

type TableRow = {
	id?: string;
	sno: number;
	particulars: string;
	description: string;
	rate: number;
	qty: number;
	total: number;
};

type LineTableViewProps = {
	title?: string;
	data?: TableRow[];
};

const LineTableView = ({ title, data = [] }: LineTableViewProps) => {
	return (
		<div className="row-6 text-center mb-4 ">
			<p className="font-semibold text-md">{title}</p>

			<div className="w-full text-left px-3 py-1.5 ">
				<div className="grid grid-cols-12 text-sm font-medium items-center text-gray-600 mb-3 bg-zinc-100 py-1.5 px-2 rounded-sm">
					<div className="col-span-1">SNo</div>
					<div className="col-span-2">Particulars</div>
					<div className="col-span-5">Description</div>
					<div className="col-span-1 text-right">Rate</div>
					<div className="col-span-1 text-right">Qty</div>
					<div className="col-span-2 text-right">Total</div>
				</div>

				{data.length === 0 ? (
					<div className="text-center text-gray-400 text-sm py-3">
						No data available
					</div>
				) : (
					data.map((row, index) => (
						<div
							key={row.id ?? index}
							className="grid grid-cols-12 gap-3 mb-2 py-1.5 px-2 "
						>
							<div className="col-span-1 text-gray-500">{row.sno}.</div>
							<div className="col-span-2">{row.particulars}</div>
							<div className="col-span-5">{row.description}</div>
							<div className="col-span-1 text-right">
								{Number(row.rate || 0).toFixed(2)}
							</div>
							<div className="col-span-1 text-right">{row.qty}</div>
							<div className="col-span-2 text-right">
								{Number(row.total || 0).toFixed(2)}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
};

export default LineTableView;
