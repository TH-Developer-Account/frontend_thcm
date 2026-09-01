import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import { WorkflowFetchPage } from "./WorkflowFetchPage";

type DynamicWorkflowProps = {
  // Required — this component is rendered by a parent page (e.g. a Vendor
  // Onboarding or EPC detail view) that already knows the real record's
  // id and type. There's no standalone route for this component, so
  // there's no URL param to fall back to.
  sourceRecordRef: string;
  recordType: string;
  onWorkflowAttached?: () => void;
};

const DynamicWorkflow = ({
  sourceRecordRef = "123",
  recordType,
  onWorkflowAttached,
}: DynamicWorkflowProps) => {
  return (
    <PageSectionLayout>
      <PageHeader
        headerText="Workflow Onboarding Form"
        navigation={{
          variant: "breadcrumbs",
          ariaLabel: "Workflow Onboarding Form",
          breadcrumbs: [
            {
              label: "Home Screen",
              href: "/",
            },
            {
              label: "Workflow Listing",
              href: "/workflow/listing",
            },
            {
              label: "Workflow Onboarding Form",
            },
          ],
          separator: "›",
        }}
      />

      {sourceRecordRef ? (
        <WorkflowFetchPage
          sourceRecordRef={sourceRecordRef}
          recordType={recordType}
          onWorkflowAttached={onWorkflowAttached}
        />
      ) : (
        <div role="alert">
          A source record is required to attach a workflow.
        </div>
      )}
    </PageSectionLayout>
  );
};

export default DynamicWorkflow;
