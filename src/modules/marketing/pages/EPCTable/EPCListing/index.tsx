import EPCTable from "./EPCTable";
import { EPCProvider } from "../../../context/EPCprovider";
import { useState } from "react";
import Topbar from "../layouts/Topbar";
import PageRowSectionLayout from "../../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../../components/ui/PageHeader";
import { ArrowLeft } from "lucide-react";

export default function EPCList() {
	const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

	return (
		<EPCProvider>
			<PageRowSectionLayout
				header_children={
					<PageHeader
						headerText="Event Planning Calendar (EPC) Listing"
						subtitleText="Manage your Event Planning Calendar (EPC) details here"
						Icon={ArrowLeft}
						badgeText="Home Screen"
						className="flex flex-row justify-between items-start"
						path="/"
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
