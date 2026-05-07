import React from "react";
import Section from "./Section";
import { formatDate } from "../../../../../utils/format";

type DateRangeProps = {
	fromDate?: string;
	toDate?: string;
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
			<div className="light-blue-bg-header rounded-lg p-4">
				<div className="mx-auto">
					<div className="flex items-center justify-between">
						{/* FROM */}
						<div className="text-left">
							<p className="text-xs  font-semibold  tracking-widest">FROM</p>
							<p className="text-lg font-semibold text-darkBlue ">
								{formatDate(fromDate)}
							</p>
						</div>

						{/* CENTER */}
						<div className="flex-1 flex items-center justify-center">
							<div className="relative w-40 flex items-center">
								<div className="w-full h-px bg-blue-800"></div>

								<div className="absolute right-0 w-2 h-2 border-t border-r border-blue-800 rotate-45"></div>

								<div
									className="absolute left-1/2 -translate-x-1/2 -top-3 
										bg-white border text-xs border-blue-800 text-darkBlue font-semibold px-3 py-1 rounded-full shadow-sm"
								>
									{getDaysCount(fromDate, toDate)}
								</div>
							</div>
						</div>

						{/* TO */}
						<div className="text-right">
							<p className="text-xs font-semibold tracking-widest">TO</p>
							<p className="text-lg font-semibold text-darkBlue ">
								{formatDate(toDate)}
							</p>
						</div>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
};

export default DateRange;
