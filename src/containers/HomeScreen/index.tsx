import {
	Megaphone,
	Box,
	ShoppingBag,
	Construction,
	Pickaxe,
	Truck,
} from "lucide-react";
import Header from "./Header";
import ActionCard from "./components/Card";

export default function HomeScreen() {
	return (
		<div className="min-h-screen bg-gray-100">
			<Header />

			<main className="flex items-center justify-center px-4 py-12 sm:py-20">
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-6 w-full max-w-4xl">
					<ActionCard
						icon={<Megaphone size={40} className="text-orange-500" />}
						title="Marketing Activity Planner"
						description=""
						subText=""
						path="/listing"
					/>

					<ActionCard
						icon={<Box size={40} className="text-orange-500" />}
						title="Product Selector"
						description=""
						subText=""
						path="/listing"
					/>
					<ActionCard
						icon={<ShoppingBag size={40} className="text-orange-500" />}
						title="Sales"
						description=""
						subText=""
						path="/listing"
					/>
					<ActionCard
						icon={<Pickaxe size={40} className="text-orange-500" />}
						title="Mining"
						description=""
						subText=""
						path="/listing"
					/>
					<ActionCard
						icon={<Construction size={40} className="text-orange-500" />}
						title="Construction"
						description=""
						subText=""
						path="/listing"
					/>
					<ActionCard
						icon={<Truck size={40} className="text-orange-500" />}
						title="Machinery"
						description=""
						subText=""
						path="/listing"
					/>
				</div>
			</main>
		</div>
	);
}
