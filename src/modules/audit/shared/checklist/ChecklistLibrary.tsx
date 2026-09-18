// modules/audit/shared/ChecklistLibrary.tsx
import { useMemo, useState } from "react";
import { Filter, Plus } from "lucide-react";

import PageSectionLayout from "../../../../layout/PageSectionLayout";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import TabsBar from "../../../../components/common/TabsBar";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { SearchInput } from "../../../../components/forms/SearchInput";

import ChecklistCard, { type ChecklistCardProps } from "./ChecklistCard";
import {
	CHECKLIST_FILTER_TABS,
	type ChecklistTemplateFilter,
} from "../shared.audit.types";
import { deriveChecklistLibrarySummary } from "./checklist.utils";

export interface ChecklistLibraryProps {
	/** Page copy — each module supplies its own, nothing is assumed here. */
	eyebrow: string;
	title: string;
	subtitle: string;
	createLabel?: string;

	templates: ChecklistCardProps[];
	isLoading?: boolean;
	error?: string | null;

	/** Fields searched against, beyond title/description. */
	searchableFields?: (template: ChecklistCardProps) => string[];

	onCreateTemplate: () => void;
	onOpenTemplate: (id: string) => void;
	onEditTemplate: (id: string) => void;
	onToggleBlocked?: (id: string, nextBlocked: boolean) => void;
	onDeleteTemplate?: (id: string) => void;
}

export default function ChecklistLibrary({
	eyebrow,
	title,
	subtitle,
	createLabel = "Create checklist",
	templates,
	isLoading = false,
	error = null,
	searchableFields,
	onCreateTemplate,
	onOpenTemplate,
	onEditTemplate,
	onToggleBlocked,
	onDeleteTemplate,
}: ChecklistLibraryProps) {
	const [search, setSearch] = useState("");
	const [activeFilter, setActiveFilter] =
		useState<ChecklistTemplateFilter>("all");
	const [blockedIds, setBlockedIds] = useState<Set<string>>(() => new Set());

	const summaryCards = useMemo(
		() => deriveChecklistLibrarySummary(templates),
		[templates],
	);

	const filteredTemplates = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return templates.filter((template) => {
			const matchesStatus =
				activeFilter === "all" || template.status === activeFilter;
			if (!matchesStatus) return false;

			if (!normalizedSearch) return true;

			const searchableText = [
				template.title,
				template.description,
				...(searchableFields?.(template) ?? []),
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();

			return searchableText.includes(normalizedSearch);
		});
	}, [activeFilter, search, searchableFields, templates]);

	const handleToggleBlocked = (id: string, nextBlocked: boolean) => {
		setBlockedIds((current) => {
			const next = new Set(current);
			if (nextBlocked) next.add(id);
			else next.delete(id);
			return next;
		});
		onToggleBlocked?.(id, nextBlocked);
	};

	return (
		<PageSectionLayout>
			<PageHeader>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-col gap-1">
						<span className="text-eyebrow text-(--color-brand)">{eyebrow}</span>
						<h1 className="text-page-title text-(--color-text-primary)">
							{title}
						</h1>
						<p className="text-body-sm text-(--color-text-secondary)">
							{subtitle}
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button
							text={createLabel}
							variant="brand"
							size="md"
							Icon={Plus}
							onClick={onCreateTemplate}
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
							placeholder="Search checklists"
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
					{summaryCards.map(({ id, label, value }) => (
						<Card
							key={id}
							padding="compact"
							variant="outlined"
							className="rounded-2xl"
						>
							<div className="flex p-2 items-center gap-4">
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
							{filteredTemplates.length} templates
						</span>
					</div>

					{error ? (
						<Card variant="outlined" className="py-12 text-center">
							<p className="text-body-sm text-red-600">{error}</p>
						</Card>
					) : isLoading ? (
						<Card variant="outlined" className="py-12 text-center">
							<p className="text-body-sm text-(--color-text-secondary)">
								Loading checklists…
							</p>
						</Card>
					) : filteredTemplates.length > 0 ? (
						<div className="checklist-card-grid">
							{filteredTemplates.map((template) => (
								<ChecklistCard
									key={template.id}
									{...template}
									isBlocked={blockedIds.has(template.id)}
									onOpen={onOpenTemplate}
									onEdit={onEditTemplate}
									onToggleBlocked={handleToggleBlocked}
									onDelete={onDeleteTemplate}
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
}
