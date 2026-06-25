import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWorkflowColumns } from "./workflow.columns";
import DataTable from "../../../../components/ui/DataTable";
import { Modal } from "../../../../components/common/Modal";
import { Alert } from "../../../../components/common/Alert";
import type { WorkflowRow } from "../types/workflow.types";
import { useWorkflow } from "../context/useWorkflows";
import { ServerAxios } from "../../../../services/ServerAxios";
import { WorkflowUserAssignment } from "./WorkflowUserAssignment"; // or your common modal wrapper
import { useToast } from "../../../../context/Auth/AuthContext";
import { api_routes } from "../constant/workflow.constant";

const WorkflowTable = () => {
	const {
		data,
		setData,
		sorting,
		setSorting,
		pageIndex,
		pageSize,
		setPageIndex,
		setPageSize,
		totalPages,
		loading,
	} = useWorkflow();
	const navigate = useNavigate();

	const [assignModalOpen, setAssignModalOpen] = useState<WorkflowRow | null>(
		null,
	);
	const [deleteModal, setDeleteModal] = useState<WorkflowRow | null>(null);
	const { showToast } = useToast(); // use your actual toast hook

	const handleAssignUser = async (
		userIds: string[],
		workflowId?: string,
	): Promise<void> => {
		if (!workflowId) return;

		try {
			const {
				data: { message },
			} = await ServerAxios.post(
				api_routes.create_assign_users_workflow_template,
				{
					userIds,
					templateId: workflowId,
				},
			);

			showToast({
				type: "success",
				title: "Success",
				description: message,
			});

			setAssignModalOpen(null);
		} catch (error) {
			console.error("Failed to assign users:", error);

			showToast({
				type: "error",
				title: "Assignment failed",
				description: "Unable to assign users. Please try again.",
			});

			throw error;
		}
	};

	const handleEdit = useCallback(
		(workflow: WorkflowRow) => {
			navigate(`/admin/edit-workflows/${workflow.id}`);
		},
		[navigate],
	);

	const setDelete = useCallback((workflow: WorkflowRow) => {
		setDeleteModal(workflow);
	}, []);

	const columns = useMemo(
		() =>
			getWorkflowColumns({
				onAssign: setAssignModalOpen,
				onEdit: handleEdit,
				onDelete: setDelete,
			}),
		[handleEdit, setDelete],
	);

	const handleDelete = async (workflowId: string) => {
		try {
			const {
				data: { message },
			} = await ServerAxios.delete(`/work-flow/delete/${workflowId}`);

			showToast({
				type: "success",
				title: "Success",
				description: message,
			});

			const filteredTemplates = data.filter((each) => each.id !== workflowId);
			setData(filteredTemplates);
		} catch (error) {
			console.error("Failed to fetch Workflow data", error);
		} finally {
			setDeleteModal(null);
		}
	};

	return (
		<>
			<DataTable<WorkflowRow>
				data={data}
				columns={columns}
				loading={loading}
				sorting={sorting}
				onSortingChange={setSorting}
				manualSorting
				manualPagination
				pageIndex={pageIndex}
				pageSize={pageSize}
				pageCount={totalPages}
				onPageChange={setPageIndex}
				onPageSizeChange={setPageSize}
				scrollTargetId="tableScroll"
				emptyTitle="No EPC records found"
				emptyDescription="Try adjusting filters or search"
				className="h-[56vh]"
			/>

			<WorkflowUserAssignment
				workflow={assignModalOpen}
				onClose={() => setAssignModalOpen(null)}
				handleAssignUser={handleAssignUser}
			/>

			{/* delete modal here later */}
			<Modal open={!!deleteModal} onClose={() => setDeleteModal(null)}>
				<Alert
					variant="warning"
					title="Delete Profile"
					description={`Are you sure you want to delete "${deleteModal?.name}"?`}
					primaryAction={{
						label: "Delete",
						onClick: () => {
							if (deleteModal) {
								handleDelete(deleteModal.id as string);
								setDeleteModal(null);
							}
						},
					}}
					secondaryAction={{
						label: "Cancel",
						onClick: () => setDeleteModal(null),
					}}
				/>
			</Modal>
		</>
	);
};

export default WorkflowTable;
