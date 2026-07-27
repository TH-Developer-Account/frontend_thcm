import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import { WorkflowProvider } from "../context/WorkflowProvider";
import WorkflowTable from "../components/WorkflowTable";

const WorkflowPage = () => {
	return (
		<WorkflowProvider>
			<PageSectionLayout>
				<PageHeader
					headerText="Workflow Management"
					navigation={{
						variant: "breadcrumbs",
						ariaLabel: "Workflow management page location",
						breadcrumbs: [
							{
								label: "Home Screen",
								href: "/",
							},
							{
								label: "Workflows",
							},
						],
						separator: "›",
					}}
				/>

				<WorkflowTable />
			</PageSectionLayout>
		</WorkflowProvider>
	);
};

export default WorkflowPage;
