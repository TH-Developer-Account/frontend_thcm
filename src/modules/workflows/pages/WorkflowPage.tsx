import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import WorkflowTable from "../components/WorkflowTable";

const WorkflowPage = () => {
	return (
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
	);
};

export default WorkflowPage;
