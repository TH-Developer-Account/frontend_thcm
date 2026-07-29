import { Plus } from "lucide-react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
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

			<Card
				title="Fetch all my workflows"
				actions={
					<Button
						type="button"
						text="Fetch"
						size="sm"
						Icon={Plus}
						iconPosition="left"
						appearance="ghost"
						variant="outline"
					/>
				}
			>
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
			</Card>
		</PageSectionLayout>
	);
};

export default DynamicWorkflow;
