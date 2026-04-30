// WorkflowPage.tsx
import WorkflowTopSection from "./WorkFlowCreation/components/WorkflowTopSection";

import { WorkflowProvider } from "./context/WorkflowProvider";
import WorkflowTable from "./WorkflowTable/WorkflowTable";
import PageRowSectionLayout from "../../../layout/PageRowSectionLayout";

const WorkflowPage = () => {
	return (
		<WorkflowProvider>
			<PageRowSectionLayout
				stickyHeader
				header_children={<WorkflowTopSection />}
			>
				<WorkflowTable />
			</PageRowSectionLayout>
		</WorkflowProvider>
	);
};

export default WorkflowPage;
