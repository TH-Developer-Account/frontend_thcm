import React from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { Modal } from "../../../components/common/Modal";
import MultiSelectInput from "../../../components/forms/MultiSelectInput";
import { SearchInput } from "../../../components/forms/SearchInput";
import type { Option } from "../../../components/forms/input.types";
import DataTable from "../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../components/ui/tables/Skeletons/DataTableSkeleton";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";
import { formatApps } from "../utils/workflow.constants";
import { useWorkflow } from "../context/useWorkflows";
import type {
	WorkflowBasics,
	WorkflowListScope,
	WorkflowRow,
	WorkflowStage,
} from "../types/types";
import { workflowListFilterOptions } from "../utils/workflow.constants";
import { getWorkflowColumns } from "../utils/workflow.columns";
import { mapBasics, mapStages } from "../utils/workflow.helpers";
import { WorkflowUserAssignment } from "./WorkflowUserAssignment";
import WorkflowViewForm from "./WorkflowViewForm";
import { FilterTabs } from "../../../components/ui/FilterTabs";
import { getWorkflowErrorMessage, workflowApi } from "../api/workflow.api";
import { useDeleteWorkflowMutation } from "../context/useWorkflowMutations";

const WORKFLOW_SKELETON_ROWS = 8;
const WORKFLOW_SKELETON_COLUMNS = 6;

type WorkflowTableProps = {
	selectedFilter?: WorkflowListScope;
	onFilterChange?: (value: WorkflowListScope) => void;
};
export const WorkflowManagementTable = ({
	selectedFilter: selectedFilterProp,
	onFilterChange,
}: WorkflowTableProps) => {
	const [localFilter, setLocalFilter] =
		React.useState<WorkflowListScope>("ALL");
	const selectedFilter = selectedFilterProp ?? localFilter;
	const handleListFilterChange = onFilterChange ?? setLocalFilter;
	const {
		data,
		setData,
		search,
		setSearch,
		filters,
		setFilters,
		sorting,
		setSorting,
		pageIndex,
		pageSize,
		setPageIndex,
		setPageSize,
		totalPages,
		loading,
	} = useWorkflow();

	const { permissions } = useAuth();
	const { showToast } = useToast();
	const navigate = useNavigate();

	const [users, setUsers] = React.useState<Option[]>([]);

	const [assignModalOpen, setAssignModalOpen] =
		React.useState<WorkflowRow | null>(null);

	const [deleteModal, setDeleteModal] = React.useState<WorkflowRow | null>(
		null,
	);

	const [viewModal, setViewModal] = React.useState<WorkflowRow | null>(null);
	const [viewLoading, setViewLoading] = React.useState(false);
	const [viewError, setViewError] = React.useState<string | null>(null);
	const [viewDetail, setViewDetail] = React.useState<{
		basics: WorkflowBasics;
		stages: WorkflowStage[];
	} | null>(null);

	const deleteMutation = useDeleteWorkflowMutation();

	React.useEffect(() => {
		const fetchUsers = async (): Promise<void> => {
			try {
				setUsers(await workflowApi.getUserOptions());
			} catch (error) {
				console.error("Failed to fetch users", error);
			}
		};

		void fetchUsers();
	}, []);

	const filterTabs = React.useMemo(
		() =>
			workflowListFilterOptions.map((option) => ({
				value: option.value,
				label: option.label,
				tooltipLabel: option.tooltipLabel,
				Icon: option.Icon,
			})),
		[],
	);
	const apps = React.useMemo(() => formatApps(permissions), [permissions]);

	const handleFilterChange = React.useCallback(
		({ fieldName, value }: { fieldName?: string; value: Option[] }) => {
			if (!fieldName) return;

			setFilters((currentFilters) => ({
				...currentFilters,
				[fieldName]: value,
			}));

			setPageIndex(0);
		},
		[setFilters, setPageIndex],
	);

	const handleEdit = React.useCallback(
		(workflow: WorkflowRow) => {
			if (!workflow.id) return;

			navigate(
				`/workflow/edit-workflows/${encodeURIComponent(String(workflow.id))}`,
			);
		},
		[navigate],
	);

	const handleOpenDelete = React.useCallback((workflow: WorkflowRow) => {
		setDeleteModal(workflow);
	}, []);

	// Non-editable (admin) templates get a read-only look via the same
	// summary view used at the end of the create/edit wizard, instead of
	// the Edit/Delete actions a USER-owned template gets.
	const handleOpenView = React.useCallback(async (workflow: WorkflowRow) => {
		setViewModal(workflow);
		setViewDetail(null);
		setViewError(null);

		if (!workflow.id) return;

		setViewLoading(true);

		try {
			const detail = await workflowApi.getById(workflow.id);

			setViewDetail({
				basics: mapBasics(detail),
				stages: mapStages(detail.stages ?? []),
			});
		} catch (error) {
			setViewError(
				getWorkflowErrorMessage(error, "Failed to load this workflow."),
			);
		} finally {
			setViewLoading(false);
		}
	}, []);

	const columns = React.useMemo(
		() =>
			getWorkflowColumns({
				onAssign: setAssignModalOpen,
				onEdit: handleEdit,
				onDelete: handleOpenDelete,
				onView: (workflow) => void handleOpenView(workflow),
			}),
		[handleEdit, handleOpenDelete, handleOpenView],
	);

	const handleDelete = React.useCallback(
		async (workflowId: string): Promise<void> => {
			try {
				const response = (await deleteMutation.mutateAsync(workflowId)) as {
					message?: string;
				};

				const message =
					typeof response?.message === "string"
						? response.message
						: "Workflow deleted successfully.";

				setData(data.filter((workflow) => workflow.id !== workflowId));

				showToast({
					type: "success",
					title: "Workflow deleted",
					description: message,
				});

				setDeleteModal(null);
			} catch (error) {
				showToast({
					type: "error",
					title: "Unable to delete workflow",
					description: getWorkflowErrorMessage(
						error,
						"Failed to delete the workflow.",
					),
				});
			}
		},
		[data, deleteMutation, setData, showToast],
	);

	return (
		<>
			<Card
				title={
					<FilterTabs
						ariaLabel="Filter Workflow listings"
						items={filterTabs}
						value={selectedFilter}
						variant="underline"
						onChange={handleListFilterChange}
						className="workflow-filter-tabs-reset"
					/>
				}
				secondaryHeader={
					<>
						<MultiSelectInput
							placeholder="Created By"
							options={users}
							name="createdBy"
							value={filters.createdBy}
							onValueChange={handleFilterChange}
							isSearchable
						/>
						<MultiSelectInput
							placeholder="Apps"
							options={apps}
							name="apps"
							value={filters.apps}
							onValueChange={handleFilterChange}
							isSearchable
						/>
						<SearchInput
							value={search}
							onChange={(value) => {
								setSearch(value);
								setPageIndex(0);
							}}
							placeholder="Search workflows"
							aria-label="Search workflows"
						/>

						<Button
							type="button"
							text="Create Workflow"
							Icon={Plus}
							iconPosition="left"
							iconSize={16}
							appearance="cta"
							variant="brand"
							size="sm"
							onClick={() => navigate("/workflow/create-workflows")}
						/>
					</>
				}
			>
				<section aria-label="Workflow records" aria-busy={loading}>
					{loading ? (
						<DataTableSkeleton
							rows={WORKFLOW_SKELETON_ROWS}
							columns={WORKFLOW_SKELETON_COLUMNS}
							showPagination
						/>
					) : (
						<DataTable<WorkflowRow>
							data={data}
							columns={columns}
							loading={false}
							sorting={sorting}
							onSortingChange={setSorting}
							manualSorting
							manualPagination
							pageIndex={pageIndex}
							pageSize={pageSize}
							pageCount={Math.max(totalPages, 1)}
							onPageChange={setPageIndex}
							onPageSizeChange={(nextPageSize) => {
								setPageSize(nextPageSize);
								setPageIndex(0);
							}}
							scrollTargetId="workflow-table-scroll"
							emptyTitle="No workflows found"
							emptyDescription="Create a workflow or adjust the current search and filters."
						/>
					)}
				</section>
			</Card>

			<WorkflowUserAssignment
				workflow={assignModalOpen}
				onClose={() => setAssignModalOpen(null)}
			/>

			<Modal
				open={Boolean(viewModal)}
				onClose={() => setViewModal(null)}
				size="lg"
				title={viewModal?.name ? `View: ${viewModal.name}` : "View Workflow"}
				footer_actions={
					<Button
						text="Close"
						onClick={() => setViewModal(null)}
						appearance="standard"
						variant="outline"
					/>
				}
			>
				{viewLoading ? (
					<p className="workflow-assignment-empty">Loading workflow…</p>
				) : viewError ? (
					<p className="workflow-fetch-stage-error" role="alert">
						{viewError}
					</p>
				) : viewDetail ? (
					<WorkflowViewForm
						basics={viewDetail.basics}
						stages={viewDetail.stages}
					/>
				) : null}
			</Modal>

			<Modal
				open={Boolean(deleteModal)}
				onClose={() => {
					if (!deleteMutation.loading) {
						setDeleteModal(null);
					}
				}}
				mode="shell"
				size="sm"
				dialogRole="alertdialog"
				ariaLabel="Delete workflow confirmation"
			>
				<Alert
					variant="warning"
					title="Delete Workflow"
					description={`Are you sure you want to delete "${
						deleteModal?.name ?? "this workflow"
					}"?`}
					primaryAction={{
						label: deleteMutation.loading ? "Deleting..." : "Delete",
						onClick: () => {
							if (!deleteModal?.id || deleteMutation.loading) {
								return;
							}

							void handleDelete(String(deleteModal.id));
						},
					}}
					secondaryAction={{
						label: "Cancel",
						onClick: () => {
							if (!deleteMutation.loading) {
								setDeleteModal(null);
							}
						},
					}}
				/>
			</Modal>
		</>
	);
};
