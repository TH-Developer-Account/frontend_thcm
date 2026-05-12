import React from "react";
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
		<div className="date-range-card">
			<div className="date-range-content">
				<div className="date-range-side date-range-side-left">
					<p className="date-range-label">FROM</p>
					<p className="date-range-value">{formatDate(fromDate)}</p>
				</div>

				<div className="date-range-center">
					<div className="date-range-line-wrap">
						<div className="date-range-line" />
						<div className="date-range-arrow" />

						<div className="date-range-pill">
							{getDaysCount(fromDate, toDate)}
						</div>
					</div>
				</div>

				<div className="date-range-side date-range-side-right">
					<p className="date-range-label">TO</p>
					<p className="date-range-value">{formatDate(toDate)}</p>
				</div>
			</div>
		</div>
	);
};

export default DateRange;
