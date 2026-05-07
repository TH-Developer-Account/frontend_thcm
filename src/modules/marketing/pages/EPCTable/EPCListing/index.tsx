import EPCTable from "./EPCTable";
import { EPCProvider } from "../../../context/EPCprovider";
import { useState } from "react";
import Topbar from "../layouts/Topbar";
import PageRowSectionLayout from "../../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../../components/ui/PageHeader";

export default function EPCList() {
	const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

	return (
		<EPCProvider>
			<PageRowSectionLayout
				contentClassName="min-w-0 overflow-hidden"
				stickyHeader
				header_children={
					<PageHeader
						headerText="Event Planning Calendar (EPC) Listing"
						subtitleText="Manage your Event Planning Calendar (EPC) details here"
						badgeProps={{
							text: "Back to Home Screen",
							to: "/",
							direction: "back",
						}}
						className="flex flex-row justify-between items-start"
					>
						<Topbar
							setIsFilterOpen={setIsFilterOpen}
							isFilterOpen={isFilterOpen}
						/>
					</PageHeader>
				}
			>
				<EPCTable />
			</PageRowSectionLayout>
		</EPCProvider>
	);
}
