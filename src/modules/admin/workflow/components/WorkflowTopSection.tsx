import React from "react";
import {
	GitBranch,
	Search,
	Plus,
	BriefcaseBusiness,
	FileStack,
	PlayCircle,
	ShieldCheck,
	Clock3,
} from "lucide-react";
import type { WorkflowFilterKey } from "../utils/workflow.types";

type WorkflowTopSectionProps = {
	activeFilter: WorkflowFilterKey;
	search: string;
	onSearchChange: (value: string) => void;
	onFilterChange: (filter: WorkflowFilterKey) => void;
	onCreateWorkflow?: () => void;
	cardCounts: Record<WorkflowFilterKey, number>;
};

const filterMeta: Record<
	WorkflowFilterKey,
	{
		label: string;
		description: string;
		icon: React.ElementType;
		iconClassName: string;
	}
> = {
	all: {
		label: "Total Workflows",
		description: "All available workflows",
		icon: FileStack,
		iconClassName: "workflow-card-icon workflow-card-icon-orange",
	},
	mine: {
		label: "My Workflows",
		description: "Workflows owned by you",
		icon: BriefcaseBusiness,
		iconClassName: "workflow-card-icon workflow-card-icon-sky",
	},
	draft: {
		label: "Drafts",
		description: "Workflows in progress",
		icon: Clock3,
		iconClassName: "workflow-card-icon workflow-card-icon-amber",
	},
	active: {
		label: "Active",
		description: "Currently running workflows",
		icon: PlayCircle,
		iconClassName: "workflow-card-icon workflow-card-icon-emerald",
	},
	pending: {
		label: "Pending Approval",
		description: "Awaiting publish approval",
		icon: ShieldCheck,
		iconClassName: "workflow-card-icon workflow-card-icon-violet",
	},
};

const WorkflowTopSection = ({
	activeFilter,
	search,
	onSearchChange,
	onFilterChange,
	onCreateWorkflow,
	cardCounts,
}: WorkflowTopSectionProps) => {
	return (
		<section className="workflow-section">
			<div className="workflow-section-header">
				<div className="workflow-section-header-content">
					<div className="workflow-badge">
						<GitBranch size={14} />
						Approval Workflow Studio
					</div>

					<h2 className="workflow-page-title">Workflow Management</h2>
					<p className="workflow-page-subtitle">
						Create, review, and manage approval workflows across modules.
					</p>
				</div>

				<div className="workflow-section-header-actions">
					<div className="workflow-search">
						<Search size={16} className="workflow-search-icon" />
						<input
							type="text"
							value={search}
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder="Search workflows..."
							className="workflow-search-input"
						/>
					</div>

					<button
						type="button"
						className="workflow-primary-btn"
						onClick={onCreateWorkflow}
					>
						<Plus size={16} />
						Create Workflow
					</button>
				</div>
			</div>

			<div className="workflow-cards-grid">
				{(Object.keys(filterMeta) as WorkflowFilterKey[]).map((key) => {
					const meta = filterMeta[key];
					const Icon = meta.icon;
					const isActive = activeFilter === key;

					return (
						<button
							key={key}
							type="button"
							onClick={() => onFilterChange(key)}
							className={`workflow-summary-card ${
								isActive
									? "workflow-summary-card-active"
									: "workflow-summary-card-inactive"
							}`}
						>
							<div className="workflow-summary-card-inner">
								<div className="workflow-summary-card-content">
									<p className="workflow-summary-card-label">{meta.label}</p>
									<h3 className="workflow-summary-card-value">
										{cardCounts[key]}
									</h3>
									<p className="workflow-summary-card-description">
										{meta.description}
									</p>
								</div>

								<div className={meta.iconClassName}>
									<Icon size={15} />
								</div>
							</div>
						</button>
					);
				})}
			</div>
		</section>
	);
};

export default WorkflowTopSection;
