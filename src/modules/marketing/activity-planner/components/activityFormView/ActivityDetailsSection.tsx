import { useState } from "react";
import { MapPin } from "lucide-react";

import EpcForm from "../../forms/EPC/EpcForm";
import type { EpcDetailResponse } from "../../types/epc.types";
import { trimText } from "../../../../../utils/format";
import {
	formatCalendarDay,
	getCalendarWeekday,
	getEventSchedule,
	toDateTimeAttr,
} from "../../../../../components/ui/dateRange";
import {
	formatCurrency,
	formatDate as formatLongDate,
	getEpcBranchName,
	getEpcBudgetValue,
	getEpcDepartmentName,
	getEpcRegionName,
	getEpcVerticalName,
} from "../../utils/formatters";

type ActivityDetailsSectionProps = {
	epcData: EpcDetailResponse;
	isEditing: boolean;
	onCancel: () => void;
	onSuccess: () => Promise<void>;
};

type ObjectiveItem = {
	title: string;
	body: string;
};

/**
 * Characters shown before "See more" appears (description and objectives).
 * ~3000 chars ≈ 500 words, so in practice everything renders in full and the
 * toggle only appears for unusually long text.
 */
const PREVIEW_LENGTH = 3000;

/** The objective is a single free-text field with inline bullets. */
const OBJECTIVE_BULLET = /\s*[•●▪‣]\s*/;

/* ========================================================================== */
/*                                   Helpers                                  */
/* ========================================================================== */

/** Budget master values are numeric strings ("5000000"); anything else is shown as-is. */
const formatBudget = (value: string) =>
	/^\d+(\.\d+)?$/.test(value) ? formatCurrency(value) : value;

/** "Hands-on Validation: Provide attendees…" → { title, body } */
const toObjectiveItem = (text: string): ObjectiveItem => {
	const colonIndex = text.indexOf(":");

	if (colonIndex > 0 && colonIndex <= 60) {
		const title = text.slice(0, colonIndex).trim();
		const body = text.slice(colonIndex + 1).trim();

		if (title && body) return { title, body };
	}

	return { title: "", body: text };
};

const parseObjective = (value: string): ObjectiveItem[] =>
	value
		.split(OBJECTIVE_BULLET)
		.map((part) => part.trim())
		.filter(Boolean)
		.map(toObjectiveItem);

/** Trims the list to roughly `limit` characters, cutting the last visible item. */
const clampObjectiveItems = (items: ObjectiveItem[], limit: number) => {
	const visible: ObjectiveItem[] = [];
	let used = 0;

	for (const item of items) {
		const length = item.title.length + item.body.length;

		if (used + length <= limit) {
			visible.push(item);
			used += length;
			continue;
		}

		const bodyBudget = limit - used - item.title.length;

		if (bodyBudget > 20) {
			visible.push({ ...item, body: trimText(item.body, bodyBudget) });
		}

		break;
	}

	// Never render an empty list — otherwise there is nothing to attach "See more" to.
	if (visible.length === 0 && items[0]) {
		visible.push({
			...items[0],
			body: trimText(
				items[0].body,
				Math.max(limit - items[0].title.length, 40),
			),
		});
	}

	return visible;
};

/** "17 Oct 2026 · Sat" */
const ScheduleDay = ({ day }: { day: number | null }) => {
	const weekday = getCalendarWeekday(day);

	return (
		<time
			className="activity-overview-timeline-value"
			dateTime={toDateTimeAttr(day)}
		>
			{formatCalendarDay(day)}
			{weekday && <span className="activity-overview-weekday">{weekday}</span>}
		</time>
	);
};

/* ========================================================================== */
/*                                  Component                                 */
/* ========================================================================== */

const ActivityDetailsSection = ({
	epcData,
	isEditing,
	onCancel,
	onSuccess,
}: ActivityDetailsSectionProps) => {
	const [showFullDescription, setShowFullDescription] = useState(false);
	const [showFullObjective, setShowFullObjective] = useState(false);

	if (isEditing) {
		return (
			<EpcForm
				mode="edit"
				epcId={epcData.id}
				initialData={epcData}
				onCancel={onCancel}
				onSuccess={onSuccess}
			/>
		);
	}

	const eventTitle = epcData.event_name?.title?.trim() || "";
	const description = epcData.event_description?.trim() || "";
	const objective = epcData.event_objective?.trim() || "";

	const isDescriptionLong = description.length > PREVIEW_LENGTH;

	const objectiveItems = parseObjective(objective);
	const objectiveLength = objectiveItems.reduce(
		(total, item) => total + item.title.length + item.body.length,
		0,
	);
	const isObjectiveLong = objectiveLength > PREVIEW_LENGTH;
	const visibleObjectiveItems =
		showFullObjective || !isObjectiveLong
			? objectiveItems
			: clampObjectiveItems(objectiveItems, PREVIEW_LENGTH);

	const schedule = getEventSchedule(
		epcData.event_from_date,
		epcData.event_to_date,
	);

	/** Sits inline at the end of the last visible objective, like the description's. */
	const objectiveToggle = isObjectiveLong ? (
		<button
			type="button"
			onClick={() => setShowFullObjective((previous) => !previous)}
			className="activity-detail-more"
			aria-expanded={showFullObjective}
		>
			{showFullObjective ? "See less" : "See more"}
		</button>
	) : null;

	return (
		<div className="activity-overview">
			<div className="activity-overview-layout">
				{/* ---------------------------- Main card ---------------------------- */}
				<section
					className="activity-overview-card activity-overview-main"
					aria-label="Event details"
				>
					<header className="activity-overview-header">
						<span className="activity-overview-eyebrow">About the event</span>

						{eventTitle && (
							<h3 className="activity-overview-title">{eventTitle}</h3>
						)}
					</header>

					<div className="activity-overview-block">
						<p className="activity-overview-text">
							{description
								? showFullDescription
									? description
									: trimText(description, PREVIEW_LENGTH)
								: "No Description"}

							{isDescriptionLong && (
								<button
									type="button"
									onClick={() =>
										setShowFullDescription((previous) => !previous)
									}
									className="activity-detail-more"
									aria-expanded={showFullDescription}
								>
									{showFullDescription ? "See less" : "See more"}
								</button>
							)}
						</p>
					</div>

					<hr className="activity-overview-divider" />

					<div className="activity-overview-block">
						<span className="activity-overview-eyebrow">Objectives</span>

						{objectiveItems.length === 0 && (
							<p className="activity-overview-text">No Objective</p>
						)}

						{objectiveItems.length > 0 && (
							<ol className="activity-overview-objectives">
								{visibleObjectiveItems.map((item, index) => (
									<li
										key={`${index}-${item.title}`}
										className="activity-overview-objective"
									>
										<span
											className="activity-overview-objective-index"
											aria-hidden="true"
										>
											{String(index + 1).padStart(2, "0")}
										</span>

										{item.title && (
											<h4 className="activity-overview-objective-title">
												{item.title}
											</h4>
										)}

										<p className="activity-overview-objective-body">
											{item.body}
											{index === visibleObjectiveItems.length - 1 &&
												objectiveToggle}
										</p>
									</li>
								))}
							</ol>
						)}
					</div>
				</section>

				{/* --------------------------- Summary card --------------------------- */}
				<aside
					className="activity-overview-card activity-overview-side"
					aria-label="Event summary"
				>
					<div className="activity-overview-budget">
						<span className="activity-overview-budget-label">Budget</span>
						<p className="activity-overview-budget-value">
							{formatBudget(getEpcBudgetValue(epcData))}
						</p>
					</div>

					<div className="activity-overview-section">
						<div className="activity-overview-section-head">
							<span className="activity-detail-label">Schedule</span>

							{schedule.kind !== "invalid" && (
								<span className="activity-overview-pill">
									{schedule.durationLabel}
								</span>
							)}
						</div>

						{schedule.kind === "range" ? (
							/* Multi-day: From → To */
							<ol className="activity-overview-timeline">
								<li className="activity-overview-timeline-item">
									<span
										className="activity-overview-timeline-dot is-start"
										aria-hidden="true"
									/>
									<span className="activity-overview-timeline-label">From</span>
									<ScheduleDay day={schedule.from} />
								</li>

								<li className="activity-overview-timeline-item">
									<span
										className="activity-overview-timeline-dot is-end"
										aria-hidden="true"
									/>
									<span className="activity-overview-timeline-label">To</span>
									<ScheduleDay day={schedule.to} />
								</li>
							</ol>
						) : (
							/* Single-day (or missing dates): one date, no From / To */
							<div className="activity-overview-single-date">
								<span className="activity-overview-timeline-label">
									{schedule.kind === "single" ? "Date" : "Event date"}
								</span>
								<ScheduleDay day={schedule.from} />
							</div>
						)}
					</div>

					<dl className="activity-overview-facts">
						<div className="activity-overview-fact">
							<dt className="activity-detail-label">Branch</dt>
							<dd className="activity-overview-fact-value">
								{getEpcBranchName(epcData)}
							</dd>
						</div>

						<div className="activity-overview-fact">
							<dt className="activity-detail-label">Department</dt>
							<dd className="activity-overview-fact-value">
								{getEpcDepartmentName(epcData)}
							</dd>
						</div>

						<div className="activity-overview-fact">
							<dt className="activity-detail-label">Vertical</dt>
							<dd className="activity-overview-fact-value">
								{getEpcVerticalName(epcData)}
							</dd>
						</div>

						<div className="activity-overview-fact">
							<dt className="activity-detail-label">Zone</dt>
							<dd className="activity-overview-fact-value">
								{getEpcRegionName(epcData)}
							</dd>
						</div>

						<div className="activity-overview-fact">
							<dt className="activity-detail-label">Created</dt>
							<dd className="activity-overview-fact-value">
								{formatLongDate(epcData.created_at)}
							</dd>
						</div>
					</dl>

					<div className="activity-overview-location">
						<MapPin
							size={16}
							aria-hidden="true"
							className="activity-overview-location-icon"
						/>

						<div className="activity-overview-location-copy">
							<span className="activity-detail-label">Location</span>
							<p
								className="activity-overview-fact-value is-wrap"
								title={epcData.location || "--"}
							>
								{epcData.location || "--"}
							</p>
						</div>
					</div>
				</aside>
			</div>
		</div>
	);
};

export default ActivityDetailsSection;
