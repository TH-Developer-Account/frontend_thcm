import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";

import Card from "../../../../components/common/Card";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { PageHeader } from "../../../../components/ui/PageHeader";
import PageNavigation from "../../../../components/ui/PageNavigation/PageNavigation";
import { FilterTabs } from "../../../../components/ui/FilterTabs";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import type { ChecklistFilter } from "../dealer-audit.types";
import { getAuditProgress } from "../dealer-audit.utils";
import AuditProgress from "../components/AuditProgress";
import ChecklistItemRow from "../components/ChecklistItemRow";
import useDealerAudit from "../dealer-audit.store";

export default function DealerAuditChecklistPage() {
	const navigate = useNavigate();
	const { auditId = "demo-audit" } = useParams();
	const { checklist } = useDealerAudit();
	const [filter, setFilter] = useState<ChecklistFilter>("ALL");
	const progress = getAuditProgress(checklist);

	const counts = useMemo(
		() => ({
			ALL: progress.total,
			PENDING: progress.total - progress.completed,
			COMPLETED: progress.completed,
		}),
		[progress],
	);
	const tabs = (["ALL", "PENDING", "COMPLETED"] as const).map((value) => ({
		value,
		label:
			value === "ALL" ? "All" : value === "PENDING" ? "Pending" : "Completed",
		count: counts[value],
	}));

	return (
		<PageSectionLayout className="dealer-audit-page">
			<PageHeader>
				<div className="dealer-audit-header">
					<PageNavigation
						variant="button"
						direction="back"
						ariaLabel="Go back"
					/>
					<div className="dealer-audit-header-copy">
						<h1 className="dealer-audit-title">Dealer Audit</h1>
						<p className="dealer-audit-subtitle">
							{checklist.dealerName}, {checklist.location}
						</p>
					</div>
				</div>
			</PageHeader>

			<div className="dealer-audit-stack">
				<AuditProgress {...progress} />

				<FilterTabs
					items={tabs}
					value={filter}
					onChange={setFilter}
					ariaLabel="Checklist status"
					variant="soft"
				/>

				<div className="dealer-audit-category-list">
					{checklist.categories.map((category) => {
						const items = category.items.filter(
							(item) => filter === "ALL" || item.status === filter,
						);
						if (!items.length) return null;
						return (
							<Card
								key={category.id}
								title={category.name}
								subtitle={`${items.length} item${items.length === 1 ? "" : "s"}`}
								accordion
								defaultExpanded={category.id === "sales-display"}
								padding="none"
								variant="outlined"
								headerClassName="!py-3"
								className="overflow-hidden"
								actions={
									<ClipboardCheck
										size={17}
										className="text-brand"
										aria-hidden="true"
									/>
								}
							>
								{items.map((item) => (
									<ChecklistItemRow
										key={item.id}
										item={item}
										onOpen={() => {
											if (!auditId) return;

											navigate(
												DEALER_AUDIT_ROUTES.execution.item(auditId, item.id),
											);
										}}
									/>
								))}
							</Card>
						);
					})}
				</div>
			</div>
		</PageSectionLayout>
	);
}
