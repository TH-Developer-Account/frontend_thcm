import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWorkflowColumns } from "./workflow.columns";
import DataTable from "../../../../components/ui/DataTable";
import type { WorkflowRow } from "../types/workflow.types";
import { useWorkflow } from "../context/useWorkflows";
import { ServerAxios } from "../../../../services/ServerAxios";
import { WorkflowUserAssignment } from "../components/WorkflowUserAssignment"; // or your common modal wrapper
import { useToast } from "../../../../context/Auth/AuthContext";
import { api_routes } from "../constant/workflow.constant";

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
  const navigate = useNavigate();

  const [assignModalOpen, setAssignModalOpen] = useState<WorkflowRow | null>(
    null,
  );
  useEffect(() => {}, [assignModalOpen]);
  const [deleteModal, setDeleteModal] = useState<WorkflowRow | null>(null);
  const { showToast } = useToast(); // use your actual toast hook

  const handleAssignUser = async (
    userIds: string[],
    workflow: WorkflowRow | null,
  ): Promise<void> => {
    try {
      const {
        data: { message },
      } = await ServerAxios.post(
        api_routes.create_assign_users_workflow_template,
        {
          userIds,
          templateId: workflow,
        },
      );

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
    navigate(`/admin/edit-workflows/${workflow.id}`);
  };

  const handleDelete = (workflow: WorkflowRow) => {
    console.log("Delete workflow", workflow);
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
