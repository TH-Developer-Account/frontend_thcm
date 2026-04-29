import React from "react";
import Section from "./Section";

type DateRangeProps = {
	fromDate?: string;
	toDate?: string;
};

const formatDate = (date?: string) => {
	if (!date) return "--";

	return new Date(date).toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
};

const getDaysCount = (fromDate?: string, toDate?: string) => {
	if (!fromDate || !toDate) return "--";

	const from = new Date(fromDate);
	const to = new Date(toDate);

	const diffTime = to.getTime() - from.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

	if (diffDays <= 0) return "--";

	return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
};

const DateRange = ({ fromDate, toDate }: DateRangeProps) => {
	return (
		<React.Fragment>
			<div className="bg-gray-50 rounded-lg p-4">
				<div className="mx-auto">
					<div className="flex items-center justify-between">
						{/* FROM */}
						<div className="text-left">
							<p className="text-xs text-gray-400 tracking-widest">FROM</p>
							<p className="text-lg font-semibold">{formatDate(fromDate)}</p>
						</div>

						{/* CENTER */}
						<div className="flex-1 flex items-center justify-center">
							<div className="relative w-40 flex items-center">
								<div className="w-full h-px bg-gray-300"></div>

								<div className="absolute right-0 w-2 h-2 border-t border-r border-gray-400 rotate-45"></div>

								<div
									className="absolute left-1/2 -translate-x-1/2 -top-3 
										bg-white border text-xs px-3 py-1 rounded-full shadow-sm"
								>
									{getDaysCount(fromDate, toDate)}
								</div>
							</div>
						</div>

						{/* TO */}
						<div className="text-right">
							<p className="text-xs text-gray-400 tracking-widest">TO</p>
							<p className="text-lg font-semibold">{formatDate(toDate)}</p>
						</div>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
};

export default DateRange;
