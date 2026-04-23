import Header from "../../components/ui/Header";
import ActionCard from "./components/Card";
import { actions } from "./constant";
import { useAuth } from "../../context/Auth/AuthContext";

export default function HomeScreen() {
	const { canReadApp } = useAuth();
	return (
		<div className="min-h-screen bg-gray-100 overflow-hidden">
			<header className="wrapper header px-4 sm:px-6 py-2 flex items-center justify-between text-white">
				<Header />
			</header>
			<main className="flex items-center justify-center px-4 py-4 sm:py-4 sm:pt-6">
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-6 w-full max-w-4xl">
					{actions.map((action) => {
						const Icon = action.icon;
						if (canReadApp(action.appKey)) {
							return (
								<ActionCard
									key={action.title}
									icon={<Icon size={40} />}
									title={action.title}
									description={action.description}
									subText={action.subText}
									path={action.path}
								/>
							);
						}
					})}
				</div>
			</main>
		</div>
	);
}
