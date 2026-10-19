import {
	formatCalendarDay,
	getEventSchedule,
	toDateTimeAttr,
} from "./dateRange";

type DateRangeProps = {
	fromDate?: string | null;
	toDate?: string | null;
};

const DateRangeSection = ({ fromDate, toDate }: DateRangeProps) => {
	const schedule = getEventSchedule(fromDate, toDate);

	/* Single-day event (or missing / invalid dates): one date, no From → To. */
	if (schedule.kind !== "range") {
		return (
			<div className="date-range-card">
				<div className="date-range-content date-range-content-single">
					<div className="date-range-side date-range-side-left">
						<span className="date-range-label">
							{schedule.kind === "single" ? "Date" : "Event date"}
						</span>

						<time
							className="date-range-value"
							dateTime={toDateTimeAttr(schedule.from)}
						>
							{formatCalendarDay(schedule.from)}
						</time>
					</div>

					{schedule.kind === "single" && (
						<span className="date-range-pill">{schedule.durationLabel}</span>
					)}
				</div>
			</div>
		);
	}

	/* Multi-day event: From → To with the duration in the middle. */
	return (
		<div className="date-range-card">
			<div className="date-range-content">
				<div className="date-range-side date-range-side-left">
					<span className="date-range-label">From</span>

					<time
						className="date-range-value"
						dateTime={toDateTimeAttr(schedule.from)}
					>
						{formatCalendarDay(schedule.from)}
					</time>
				</div>

				<div
					className="date-range-center"
					aria-label={`Duration: ${schedule.durationLabel}`}
				>
					<div className="date-range-line-wrap" aria-hidden="true">
						<span className="date-range-start-dot" />
						<span className="date-range-line" />
						<span className="date-range-arrow" />

						<span className="date-range-pill">{schedule.durationLabel}</span>
					</div>
				</div>

				<div className="date-range-side date-range-side-right">
					<span className="date-range-label">To</span>

					<time
						className="date-range-value"
						dateTime={toDateTimeAttr(schedule.to)}
					>
						{formatCalendarDay(schedule.to)}
					</time>
				</div>
			</div>
		</div>
	);
};

export default DateRangeSection;
