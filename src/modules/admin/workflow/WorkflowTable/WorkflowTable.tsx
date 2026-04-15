import { useMemo, useState } from "react";
import { getWorkflowColumns } from "./workflow.columns";
import DataTable from "../../../../components/ui/DataTable";
import type { WorkflowRow } from "../types/workflow.types";
import { useWorkflow } from "../context/useWorkflows";
import { ServerAxios } from "../../../../services/ServerAxios";
import { WorkflowUserAssignment } from "../components/WorkflowUserAssignment"; // or your common modal wrapper
import { useToast } from "../../../../context/Auth/AuthContext";

const WorkflowTable = () => {
	const {
		data,
		sorting,
		setSorting,
		pageIndex,
		pageSize,
		setPageIndex,
		setPageSize,
		totalPages,
		loading,
		// refetch,
	} = useWorkflow();

	const [assignModalOpen, setAssignModalOpen] = useState<WorkflowRow | null>(
		null,
	);
	const [deleteModal, setDeleteModal] = useState<WorkflowRow | null>(null);

	const { showToast } = useToast(); // use your actual toast hook

	const handleAssignUser = async (
		userIds: string[],
		workflowId: string | undefined,
	): Promise<void> => {
		try {
			console.log("Submitting assignment...");
			console.log("User IDs:", userIds);
			console.log("Workflow ID:", workflowId);

			const {
				data: { message },
			} = await ServerAxios.post("/users/assign-workflow", {
				userIds,
				workflowId,
			});

			console.log("API Success:", message);

			showToast({
				type: "success",
				title: "Success",
				description: message,
			});
		} catch (error) {
			console.error("Failed to assign users:", error);
		} finally {
			setAssignModalOpen(null);
		}
	};

	const handleEdit = (workflow: WorkflowRow) => {
		console.log("Edit workflow", workflow);
		// navigate or open edit drawer/modal
	};

	const handleDelete = (workflow: WorkflowRow) => {
		setDeleteModal(workflow);
	};

	const columns = useMemo(
		() =>
			getWorkflowColumns({
				onAssign: setAssignModalOpen,
				onEdit: handleEdit,
				onDelete: handleDelete,
			}),
		[],
	);

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
			/>

			<WorkflowUserAssignment
				workflow={assignModalOpen}
				onClose={() => setAssignModalOpen(null)}
				handleAssignUser={handleAssignUser}
			/>

			{/* delete modal here later */}
			{/* <DeleteWorkflowModal
        workflow={deleteModal}
        onClose={() => setDeleteModal(null)}
      /> */}
		</>
	);
};

export default WorkflowTable;
