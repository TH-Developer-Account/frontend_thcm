import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import type {
	DynamicWorkflowFilter,
	DynamicWorkflowTableItem,
} from "../types/workflow.types";
import { DYNAMIC_WORKFLOW_TABLE_DATA } from "../constant/workflow.constant";
import { DynamicWorkflowTable } from "../components/DynamicWorkflowTable";

const DynamicWorkflow = () => {
	const navigate = useNavigate();
	const [filter, setFilter] = useState<DynamicWorkflowFilter>("ALL");

	const workflows = useMemo(() => {
		if (filter === "ALL") {
			return DYNAMIC_WORKFLOW_TABLE_DATA;
		}

		return DYNAMIC_WORKFLOW_TABLE_DATA.filter(
			(workflow) => workflow.relationship === filter,
		);
	}, [filter]);

	const handleEdit = (workflow: DynamicWorkflowTableItem) => {
		navigate(`/workflows/${workflow.id}/edit`);
	};

	const handleAttach = (workflow: DynamicWorkflowTableItem) => {
		/*
		 * Open your workflow preview/customization drawer or modal.
		 *
		 * setSelectedWorkflow(workflow);
		 * setIsAttachDrawerOpen(true);
		 */
		console.log("Attach workflow:", workflow);
	};
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
				title={"Fetch all my workflows"}
				actions={
					<Button
						type="button"
						text="Fetch"
						size="sm"
						Icon={Plus}
						iconPosition="left"
						appearance="ghost"
						variant="outline"
						// onClick={onBack}
						// disabled={loading}
					/>
				}
			>
				<DynamicWorkflowTable
					workflows={workflows}
					onEdit={handleEdit}
					onAttach={handleAttach}
				/>
			</Card>
		</PageSectionLayout>
	);
};

export default DynamicWorkflow;
{
	/* <div className="grid min-w-0 grid-cols-1 gap-3 rounded-md  p-3 md:grid-cols-2 xl:grid-cols-[1.1fr_1.2fr_1fr_1.2fr_auto]">
    <FormInput placeholder="Enter lead name" required />

    <FormInput type="email" placeholder="Enter email" />

    <FormInput type="mobile" placeholder="Enter phone number" />

    <FormInput placeholder="Enter remarks" />

    <div className="flex items-end gap-1.5">
        <Button
            type="button"
            appearance="icon"
            variant="outline"
            size="sm"
        />

        <Button
            type="button"
            appearance="icon"
            variant="outline"
            size="sm"
        />
    </div>
</div> */
}
