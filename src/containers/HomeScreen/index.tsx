import Header from "../../components/ui/Header";
import { useAuth } from "../../context/Auth/AuthContext";

import ActionCard from "./components/Card";
import { actions } from "./constant";

export default function HomeScreen() {
	const { canReadApp, permissions } = useAuth();

	const visibleActions = actions.filter((action) => canReadApp(action.appKey));

	return (
		<div className="home-screen">
			<header className="home-header">
				<div className="home-header-content">
					<Header />
				</div>
			</header>

			<div className="home-subheader">
				<div className="home-subheader-content">
					<span className="home-eyebrow">Module Selector</span>

					<span className="home-meta">
						FY 2025–26 · Sales &amp; Marketing Ops
					</span>
				</div>
			</div>

			<main className="home-main">
				<section className="home-intro" aria-labelledby="home-title">
					<h1 id="home-title" className="home-title">
						Choose an application
					</h1>

					<p className="home-description">
						Access enterprise tools for planning, administration, master data,
						and business operations.
					</p>
				</section>

				<section className="home-module-section">
					{visibleActions.length > 0 ? (
						<div className="action-card-grid">
							{visibleActions.map((action) => {
								const Icon = action.icon;

								const appInfo = permissions.find(
									(permission) => permission.appKey === action.appKey,
								);

								return (
									<ActionCard
										key={action.appKey}
										appId={appInfo?.appId ?? ""}
										description={action.description}
										icon={<Icon size={22} strokeWidth={1.8} />}
										isActive={action.isActive}
										path={action.path}
										title={action.title}
									/>
								);
							})}
						</div>
					) : (
						<div className="home-empty-state">
							<p className="home-empty-title">No applications available</p>

							<p className="home-empty-description">
								You currently do not have access to any application modules.
							</p>
						</div>
					)}
				</section>
			</main>
		</div>
	);
}
