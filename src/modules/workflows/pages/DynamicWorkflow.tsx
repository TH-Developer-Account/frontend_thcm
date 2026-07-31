import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { useParams } from "react-router-dom";

import { WorkflowFetchPage } from "./WorkflowFetchPage";

type DynamicWorkflowProps = {
	sourceRecordRef?: string;
	recordType?: string;
	onWorkflowAttached?: () => void;
};

const DynamicWorkflow = ({
	sourceRecordRef,
	recordType = "VENDOR_ONBOARDING",
	onWorkflowAttached,
}: DynamicWorkflowProps) => {
	const { recordRef } = useParams<{ recordRef?: string }>();
	// const resolvedRecordRef = sourceRecordRef ?? recordRef;
	const resolvedRecordRef = "11100992282";
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

			{resolvedRecordRef ? (
				<WorkflowFetchPage
					sourceRecordRef={resolvedRecordRef}
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
