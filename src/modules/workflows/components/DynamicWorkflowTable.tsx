// WorkflowTable.tsx

import { useMemo } from "react";
import { Link2, Pencil } from "lucide-react";

import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import ManagementTable from "../../../components/ui/tables/ManagementTable/ManagementTable";
import { ManagementIdentityCell } from "../../../components/ui/tables/ManagementTable/ManagementTableCells";
import type { ManagementTableColumn } from "../../../components/ui/tables/ManagementTable/ManagementTable.types";
import type {
	DynamicWorkflowStatus,
	DynamicWorkflowTableItem,
} from "../types/workflow.types";

interface WorkflowTableProps {
	workflows: DynamicWorkflowTableItem[];
	loading?: boolean;
	onEdit?: (workflow: DynamicWorkflowTableItem) => void;
	onAttach: (workflow: DynamicWorkflowTableItem) => void;
}

const getStatusVariant = (status: DynamicWorkflowStatus): string => {
	switch (status) {
		case "ACTIVE":
			return "success";

		case "DRAFT":
			return "warning";

		case "INACTIVE":
		default:
			return "neutral";
	}
};

const getRelationshipLabel = (
	relationship: DynamicWorkflowTableItem["relationship"],
): string =>
	relationship === "CREATED_BY_ME" ? "Created by me" : "Assigned to me";

const formatDate = (value: string): string =>
	new Intl.DateTimeFormat("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(new Date(value));

export function DynamicWorkflowTable({
	workflows,
	loading = false,
	onEdit,
	onAttach,
}: WorkflowTableProps) {
	const columns = useMemo<ManagementTableColumn<DynamicWorkflowTableItem>[]>(
		() => [
			{
				key: "name",
				header: "Workflow",
				width: "20rem",
				render: (workflow) => (
					<ManagementIdentityCell
						title={workflow.name}
						subtitle={workflow.description || "No description"}
						initials={workflow.name.slice(0, 2)}
						alt=""
					/>
				),
			},
			{
				key: "createdBy",
				header: "Created by",
				width: "15rem",
				hideBelow: "md",
				render: (workflow) => (
					<ManagementIdentityCell
						title={workflow.createdBy.name}
						subtitle={workflow.createdBy.email}
						imageUrl={workflow.createdBy.avatar}
						alt={workflow.createdBy.name}
					/>
				),
			},
			{
				key: "relationship",
				header: "Access",
				width: "10rem",
				hideBelow: "sm",
				render: (workflow) => (
					<Badge
						variant={
							workflow.relationship === "CREATED_BY_ME" ? "info" : "neutral"
						}
					>
						{getRelationshipLabel(workflow.relationship)}
					</Badge>
				),
			},
			{
				key: "stages",
				header: "Stages",
				width: "7rem",
				render: (workflow) => workflow.stageCount,
			},
			{
				key: "approvers",
				header: "Approvers",
				width: "8rem",
				hideBelow: "md",
				render: (workflow) => workflow.approverCount,
			},
			{
				key: "status",
				header: "Status",
				width: "8rem",
				render: (workflow) => (
					<Badge variant={getStatusVariant(workflow.status)}>
						{workflow.status}
					</Badge>
				),
			},
			{
				key: "updatedAt",
				header: "Updated",
				width: "10rem",
				hideBelow: "lg",
				render: (workflow) => formatDate(workflow.updatedAt),
			},
		],
		[],
	);

	return (
		<ManagementTable<DynamicWorkflowTableItem>
			rows={workflows}
			columns={columns}
			pagination
			defaultPageSize={10}
			getRowId={(workflow) => workflow.id}
			ariaLabel="Available workflows"
			caption="Workflows created by or assigned to the current user"
			minWidth="64rem"
			density="comfortable"
			loading={loading}
			loadingRowCount={6}
			emptyTitle="No workflows found"
			emptyDescription="You have not created or been assigned to any workflows."
			actionsHeader=""
			rowActions={(workflow) => {
				const canEdit = workflow.relationship === "CREATED_BY_ME";

				return (
					<>
						{canEdit ? (
							<Button
								type="button"
								appearance="icon"
								variant="transparent"
								size="sm"
								Icon={Pencil}
								aria-label={`Edit ${workflow.name}`}
								onClick={() => onEdit?.(workflow)}
							/>
						) : null}

						<Button
							type="button"
							appearance="icon"
							variant="transparent"
							size="sm"
							Icon={Link2}
							aria-label={`Attach ${workflow.name}`}
							onClick={() => onAttach(workflow)}
						/>
					</>
				);
			}}
		/>
	);
}
