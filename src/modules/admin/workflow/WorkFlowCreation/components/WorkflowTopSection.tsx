import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "../../../../../context/Auth/useAuth";
import { ServerAxios } from "../../../../../services/ServerAxios";
import MultiSelectInput from "../../../../../components/FormElements/MultiSelectInput";
import { useWorkflow } from "../../context/useWorkflows";
import { SearchInput } from "../../../../../components/FormElements/SearchInput";
import { formatApps } from "../../constant/workflow.constant";
import type { Option } from "../../../../../components/FormElements/input.types";
import type { UserResponse } from "../../../user-profile/types/profile.types";
import Button from "../../../../../components/common/Button";
import NavigateButton from "../../../../../components/common/NavigateButton";

const WorkflowTopSection = () => {
	const { search, setSearch, filters, setFilters } = useWorkflow();
	const { permissions } = useAuth();
	const navigate = useNavigate();
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
						<NavigateButton text="Back" direction="back" iconPosition="left" />

						<h2 className="workflow-page-title">Workflow Management</h2>
						<p className="workflow-page-subtitle">
							Create, review, and manage approval workflows across modules.
						</p>
					</div>

					<div className="workflow-section-header-actions">
						<Button
							text="Create Workflow"
							iconPosition="right"
							status="brand"
							Icon={Plus}
							onClick={() => navigate("/admin/create-workflows")}
						/>
					</div>
				</div>
				<span className="workflow-filter-section">
					<div className="filters">
						<span className="basis-64">
							<MultiSelectInput
								placeholder="Created By"
								options={users}
								name="createdBy"
								value={filters["createdBy"]}
								onValueChange={handleFilterChange}
								isSearchable
							/>
						</span>
						<span className="basis-64">
							<MultiSelectInput
								placeholder="Apps"
								options={apps}
								name="apps"
								value={filters["apps"]}
								onValueChange={handleFilterChange}
								isSearchable
							/>
						</span>
					</div>
					<div className="workflow-search">
						<SearchInput
							value={search}
							onChange={setSearch}
							placeholder="Search workflows..."
						/>
					</div>
				</span>
			</section>
		</React.Fragment>
	);
};

export default WorkflowTopSection;
