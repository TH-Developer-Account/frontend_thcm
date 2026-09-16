import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Plus } from "lucide-react";

import PageSectionLayout from "../../../layout/PageSectionLayout";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import TabsBar from "../../../components/common/TabsBar";
import { PageHeader } from "../../../components/ui/PageHeader";
import ChecklistCard from "./ChecklistCard";
import {
	CHECKLIST_FILTER_TABS,
	CHECKLIST_SUMMARY,
	CHECKLIST_TEMPLATES,
	type ChecklistFilter,
} from "./checklist-library.constants";
import { SearchInput } from "../../../components/forms/SearchInput";
import { DEALER_AUDIT_ROUTES } from "./dealer-audit.routes";

const ChecklistLibrary = () => {
	const navigate = useNavigate();
	const [search, setSearch] = useState("");
	const [activeFilter, setActiveFilter] = useState<ChecklistFilter>("all");
	const [blockedChecklistIds, setBlockedChecklistIds] = useState<Set<string>>(
		() => new Set(),
	);

	const [deletedChecklistIds, setDeletedChecklistIds] = useState<Set<string>>(
		() => new Set(),
	);

	const filteredChecklists = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return CHECKLIST_TEMPLATES.filter((checklist) => {
			if (deletedChecklistIds.has(checklist.id)) {
				return false;
			}

			const matchesStatus =
				activeFilter === "all" || checklist.status === activeFilter;

			const searchableText = [
				checklist.title,
				checklist.description,
				checklist.category,
				checklist.ownerSearchText,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();

			return matchesStatus && searchableText.includes(normalizedSearch);
		});
	}, [activeFilter, deletedChecklistIds, search]);

	// const handleEditChecklist = (checklistId: string) => {
	// 	navigate(DEALER_AUDIT_ROUTES.template.edit(checklistId));
	// };

	const handleOpenChecklist = (checklistId: string) => {
		navigate(DEALER_AUDIT_ROUTES.template.edit(checklistId));
		navigate(DEALER_AUDIT_ROUTES.template.edit(checklistId));
	};
	const handleEditChecklist = (checklistId: string) => {
		navigate(DEALER_AUDIT_ROUTES.template.edit(checklistId));
	};

	const handleToggleBlocked = (checklistId: string, nextBlocked: boolean) => {
		setBlockedChecklistIds((current) => {
			const next = new Set(current);

			if (nextBlocked) {
				next.add(checklistId);
			} else {
				next.delete(checklistId);
			}

			return next;
		});

		// Replace with the API mutation:
		// toggleChecklistBlockedMutation.mutate({
		// 	id: checklistId,
		// 	isBlocked: nextBlocked,
		// });
	};

	const handleDeleteChecklist = (checklistId: string) => {
		/*
		 * Open your confirmation Modal here in the final implementation.
		 * Only add the ID after the user confirms.
		 */
		setDeletedChecklistIds((current) => {
			const next = new Set(current);
			next.add(checklistId);
			return next;
		});

		// Replace with the API mutation after confirmation:
		// deleteChecklistMutation.mutate(checklistId);
	};

	return (
		<PageSectionLayout>
			<PageHeader>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-col gap-1">
						<span className="text-eyebrow text-(--color-brand)">
							Dealer Audit
						</span>
						<h1 className="text-page-title text-(--color-text-primary)">
							Checklist library
						</h1>
						<p className="text-body-sm text-(--color-text-secondary)">
							Build, review and reuse inspection standards across locations.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button
							text="Create checklist"
							variant="brand"
							size="md"
							Icon={Plus}
							onClick={() => navigate(DEALER_AUDIT_ROUTES.template.create)}
						/>
					</div>
				</div>
			</PageHeader>

			<div className="flex flex-col gap-3">
				<Card padding="default" variant="outlined" className="rounded-2xl">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
						<SearchInput
							value={search}
							onChange={setSearch}
							placeholder="Search checklists, categories or owners"
							containerClassName="min-w-0 flex-1"
						/>

						<div className="flex items-center gap-3 overflow-x-auto">
							<TabsBar
								items={CHECKLIST_FILTER_TABS}
								mode="single"
								active={activeFilter}
								onChange={setActiveFilter}
								ariaLabel="Filter checklists by status"
								variant="soft"
								className="shrink-0"
							/>
							<Button
								text="Filters"
								variant="outline"
								size="md"
								Icon={Filter}
								className="shrink-0"
							/>
						</div>
					</div>
				</Card>

				<section
					className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-4"
					aria-label="Checklist statistics"
				>
					{CHECKLIST_SUMMARY.map(({ id, label, value, Icon }) => (
						<Card
							key={id}
							padding="compact"
							variant="outlined"
							className="rounded-2xl"
						>
							<div className="flex p-2 items-center gap-4">
								<span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-orange-50 text-(--color-brand)">
									<Icon size={21} strokeWidth={1.8} aria-hidden="true" />
								</span>
								<span className="min-w-0">
									<strong className="block text-2xl font-bold leading-none text-(--color-text-primary)">
										{value}
									</strong>
									<span className="mt-2 block text-body-sm text-(--color-text-secondary)">
										{label}
									</span>
								</span>
							</div>
						</Card>
					))}
				</section>

				<section aria-labelledby="checklist-results-title">
					<div className="mb-3 flex items-center justify-between gap-3">
						<h2
							id="checklist-results-title"
							className="text-section-title text-(--color-text-primary)"
						>
							All checklists
						</h2>
						<span className="text-body-sm text-(--color-text-secondary)">
							{filteredChecklists.length} templates
						</span>
					</div>

					{filteredChecklists.length > 0 ? (
						<div className="checklist-card-grid">
							{filteredChecklists.map((checklist) => (
								<ChecklistCard
									key={checklist.id}
									{...checklist}
									isBlocked={blockedChecklistIds.has(checklist.id)}
									onOpen={handleOpenChecklist}
									onEdit={handleEditChecklist}
									onToggleBlocked={handleToggleBlocked}
									onDelete={handleDeleteChecklist}
								/>
							))}
						</div>
					) : (
						<Card variant="outlined" className="py-12 text-center">
							<h3 className="font-semibold text-(--color-text-primary)">
								No checklists found
							</h3>
							<p className="mt-1 text-body-sm text-(--color-text-secondary)">
								Try another search or status filter.
							</p>
						</Card>
					)}
				</section>
			</div>
		</PageSectionLayout>
	);
};

export default ChecklistLibrary;
