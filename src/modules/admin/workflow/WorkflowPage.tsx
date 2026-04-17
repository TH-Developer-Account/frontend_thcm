// WorkflowPage.tsx
import WorkflowTopSection from "./components/WorkflowTopSection";
import PageSectionLayout, {
  PageSection,
} from "../../../layout/PageSectionLayout";
import { WorkflowProvider } from "./context/WorkflowProvider";
import WorkflowTable from "./WorkflowTable/WorkflowTable";

const WorkflowPage = () => {
  return (
    <WorkflowProvider>
      <PageSectionLayout>
        <PageSection>
          <WorkflowTopSection />
        </PageSection>

        <PageSection>
          <section className="workflow-section">
            <WorkflowTable />
          </section>
        </PageSection>
      </PageSectionLayout>{" "}
    </WorkflowProvider>
  );
};

export default WorkflowPage;
