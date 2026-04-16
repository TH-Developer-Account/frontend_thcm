import React from "react";
import { GitBranch, Plus } from "lucide-react";
import { useAuth } from "../../../../context/Auth/useAuth";
import { ServerAxios } from "../../../../services/ServerAxios";
import MultiSelectInput from "../../../../components/FormElements/MultiSelectInput";
import type { WorkflowFilterKey } from "../types/workflow.types";
import { useWorkflow } from "../context/useWorkflows";
import { SearchInput } from "../../../../components/FormElements/SearchInput";
import type { Option } from "../../../../components/FormElements/input.types";
import type {
  WorkspacePayload,
  UserResponse,
} from "../../user-profile/types/profile.types";

type WorkflowTopSectionProps = {
  activeFilter: WorkflowFilterKey;
  onFilterChange: (filter: WorkflowFilterKey) => void;
  onCreateWorkflow?: () => void;
  cardCounts: Record<WorkflowFilterKey, number>;
};

const WorkflowTopSection = ({ onCreateWorkflow }: WorkflowTopSectionProps) => {
  const { search, setSearch, filters, setFilters } = useWorkflow();
  const { permissions } = useAuth();
  const [users, setUsers] = React.useState<Option[]>([]);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await ServerAxios.get("/users", {
          params: {
            profile: "all",
          },
        });

        if (data) {
          const formattedUsers = data.map((user: UserResponse) => ({
            value: user.id,
            label: `${user.first_name} ${user.last_name}`,
          }));
          setUsers(formattedUsers);
        }
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };

    fetchUsers();
  }, []);

  const formatApps = (data: WorkspacePayload) => {
    const uniqueMap = new Map();

    data.forEach((item) => {
      if (item.action === "read") {
        if (!uniqueMap.has(item.appId)) {
          uniqueMap.set(item.appId, {
            value: item.appId,
            label: item.appName,
          });
        }
      }
    });

    return Array.from(uniqueMap.values());
  };

  const apps = formatApps(permissions);

  const handleFilterChange = (data: {
    fieldName?: string;
    value: Option[];
  }) => {
    const { fieldName, value } = data;

    if (!fieldName) return;

    setFilters((prev) => ({
      ...prev,
      [fieldName]: value,
      //    [fieldName]: value.map((item) => item.value), // 👈 extract IDs
    }));
  };

  return (
    <React.Fragment>
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
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search workflows..."
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
        <span className="workflow-filter-section">
          <span className="basis-64">
            <MultiSelectInput
              label="Created By"
              options={users}
              name="createdBy"
              value={filters["createdBy"]}
              onValueChange={handleFilterChange}
              isSearchable
            />
          </span>
          <span className="basis-64">
            <MultiSelectInput
              label="Apps"
              options={apps}
              name="apps"
              value={filters["apps"]}
              onValueChange={handleFilterChange}
              isSearchable
            />
          </span>
        </span>
      </section>
    </React.Fragment>
  );
};

export default WorkflowTopSection;
