import { formatDate } from "../../modules/marketing/activity-planner/utils/formatters";

type DateRangeProps = {
	fromDate?: string | null;
	toDate?: string | null;
};

const getDaysCount = (fromDate?: string | null, toDate?: string | null) => {
	if (!fromDate || !toDate) return "--";

	const from = new Date(fromDate);
	const to = new Date(toDate);

	if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
		return "--";
	}

	const diffTime = to.getTime() - from.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

	if (diffDays <= 0) return "--";

	return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
};

const getDateTimeValue = (value?: string | null) => {
	if (!value) return undefined;

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) return undefined;

	return date.toISOString();
};

const DateRangeSection = ({ fromDate, toDate }: DateRangeProps) => {
	const duration = getDaysCount(fromDate, toDate);

	return (
		<div className="date-range-card">
			<div className="date-range-content">
				<div className="date-range-side date-range-side-left">
					<span className="date-range-label">From</span>

					<time
						className="date-range-value"
						dateTime={getDateTimeValue(fromDate)}
					>
						{formatDate(fromDate)}
					</time>
				</div>

				<div className="date-range-center" aria-label={`Duration: ${duration}`}>
					<div className="date-range-line-wrap" aria-hidden="true">
						<span className="date-range-start-dot" />
						<span className="date-range-line" />
						<span className="date-range-line-progress" />
						<span className="date-range-arrow" />

						<span className="date-range-pill">{duration}</span>
					</div>
				</div>

				<div className="date-range-side date-range-side-right">
					<span className="date-range-label">To</span>

					<time
						className="date-range-value"
						dateTime={getDateTimeValue(toDate)}
					>
						{formatDate(toDate)}
					</time>
				</div>
			</div>
		</div>
	);
};

export default DateRangeSection;
