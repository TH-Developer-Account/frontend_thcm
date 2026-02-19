import {
	Megaphone,
	PackageSearch,
	UserCheck,
	Database,
	Warehouse,
	FileText,
	MonitorCog,
} from "lucide-react";
import Header from "../../components/ui/Header";
import ActionCard from "./components/Card";

export default function HomeScreen() {
	return (
		<div className="min-h-screen bg-gray-100 overflow-hidden">
			<header className="header px-4 sm:px-6 py-2 flex items-center justify-between text-white">
				<Header />
			</header>
			<main className="flex items-center justify-center px-4 py-12 sm:py-20">
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-6 w-full max-w-4xl">
					<ActionCard
						icon={<Megaphone size={40} className="text-orange-500" />}
						title="Marketing Activity Planner"
						description=""
						subText=""
						path="/marketing/listing"
					/>
					<ActionCard
						icon={<MonitorCog size={40} className="text-orange-500" />}
						title="Administrator"
						description=""
						subText=""
						path="/admin/users"
					/>

					<ActionCard
						icon={<PackageSearch size={40} className="text-orange-500" />}
						title="Product Selector"
						description=""
						subText=""
						path="/marketing/listing"
					/>
					<ActionCard
						icon={<UserCheck size={40} className="text-orange-500" />}
						title="Key Account"
						description=""
						subText=""
						path="/marketing/listing"
					/>
					<ActionCard
						icon={<Database size={40} className="text-orange-500" />}
						title="Customer Master Data"
						description=""
						subText=""
						path="/admin/users"
					/>
					<ActionCard
						icon={<FileText size={40} className="text-orange-500" />}
						title="Dealer Claims"
						description=""
						subText=""
						path="/marketing/listing"
					/>
					<ActionCard
						icon={<Warehouse size={40} className="text-orange-500" />}
						title="Asset Master"
						description=""
						subText=""
						path="/marketing/listing"
					/>
				</div>
			</main>
		</div>
	);
}
