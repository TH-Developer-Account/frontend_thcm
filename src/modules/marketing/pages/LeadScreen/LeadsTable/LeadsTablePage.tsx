import PageRowSectionLayout from "../../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../../components/ui/PageHeader";
import { Plus } from "lucide-react";
import Button from "../../../../../components/common/Button";
import LeadsTable from "./components/LeadsTable";
import { Can } from "../../../../../context/permissionHelpers";

export default function LeadsTablePage() {
	return (
		<PageRowSectionLayout
			stickyHeader
			header_children={
				<PageHeader
					headerText="Leads Listing"
					subtitleText="Manage your Lead details here"
					badgeProps={{
						text: "Back to Home Screen",
						direction: "back",
						to: "/",
					}}
					className="flex flex-row justify-between items-end"
				>
					<Can action="write" app="MAP" module="EPC">
						<Button
							type="button"
							text={"Create New Lead"}
							Icon={Plus}
							status="brand"
							className="text-xs m-2 sm:m-4"
							path="/marketing/leads/create"
						/>
					</Can>
				</PageHeader>
			}
		>
			<LeadsTable />
		</PageRowSectionLayout>
	);
}
