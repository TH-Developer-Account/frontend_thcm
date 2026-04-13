// WorkflowPage.tsx
import React, { useMemo, useState } from "react";
import WorkflowTopSection from "./components/WorkflowTopSection";
import WorkflowBottomSection from "./components/WorkflowBottomSection";
import type { WorkflowFilterKey, WorkflowItem } from "./types/workflow.types";
import { workflows } from "./utils/workflow.data";
import PageSectionLayout, {
	PageSection,
} from "../../../layout/PageSectionLayout";

const getFilteredWorkflows = (
	items: WorkflowItem[],
	activeFilter: WorkflowFilterKey,
	search: string,
) => {
	const normalizedSearch = search.trim().toLowerCase();

	let filtered = items.filter((item) => {
		switch (activeFilter) {
			case "mine":
				return item.ownerType === "mine";
			case "draft":
				return item.status === "Draft";
			case "active":
				return item.status === "Active";
			case "pending":
				return item.status === "Pending Approval";
			case "all":
			default:
				return true;
		}
	});

	if (!normalizedSearch) return filtered;

	return filtered.filter((item) =>
		[item.name, item.module, item.owner, item.id, item.status]
			.join(" ")
			.toLowerCase()
			.includes(normalizedSearch),
	);
};

const WorkflowPage = () => {
	const [activeFilter, setActiveFilter] = useState<WorkflowFilterKey>("all");
	const [search, setSearch] = useState("");

	const cardCounts = useMemo(
		() => ({
			all: workflows.length,
			mine: workflows.filter((item) => item.ownerType === "mine").length,
			draft: workflows.filter((item) => item.status === "Draft").length,
			active: workflows.filter((item) => item.status === "Active").length,
			pending: workflows.filter((item) => item.status === "Pending Approval")
				.length,
		}),
		[],
	);

	const filteredWorkflows = useMemo(
		() => getFilteredWorkflows(workflows, activeFilter, search),
		[activeFilter, search],
	);

	return (
		<PageSectionLayout>
			<PageSection>
				<WorkflowTopSection
					activeFilter={activeFilter}
					search={search}
					onSearchChange={setSearch}
					onFilterChange={setActiveFilter}
					cardCounts={cardCounts}
				/>
			</PageSection>

			<PageSection>
				<WorkflowBottomSection
					activeFilter={activeFilter}
					items={filteredWorkflows}
				/>
			</PageSection>
		</PageSectionLayout>
	);
};

export default WorkflowPage;
