import { useId, useState } from "react";
import { Search, X } from "lucide-react";

import { useAuth } from "../../context/Auth/AuthContext";
import { formatDateTime } from "../../utils/format";
import ActionCard from "./components/Card";
import { actions } from "./constant";
import type { HomeActionAccess } from "./constant";
import homeHero from "../../assets/home-hero.webp";

/**
 * Hero illustration (excavator). Left empty on purpose — set it to an
 * imported asset, e.g.
 *   import homeHero from "../../assets/home-hero.webp";
 *   const HOME_HERO_IMAGE_SRC = homeHero;
 * The slot is hidden while this is empty, and on screens under 768px.
 */
const HOME_HERO_IMAGE_SRC = homeHero;

export default function HomeScreen() {
	const { user, canReadApp, canAccessAdministration, accessibleApps } =
		useAuth();

	const [query, setQuery] = useState("");
	const searchId = useId();
	const resultsId = useId();

	const isExternalUser = String(user?.userType ?? "").toUpperCase() === "TCS";

	const isVisible = (access: HomeActionAccess): boolean => {
		switch (access.kind) {
			case "everyone":
				return true;
			case "internal":
				return !isExternalUser;
			case "administration":
				return canAccessAdministration;
			case "app":
				return canReadApp(access.appKey);
		}
	};

	const findAppId = (access: HomeActionAccess): string =>
		access.kind === "app"
			? (accessibleApps.find((app) => app.appKey === access.appKey)?.appId ??
				"")
			: "";

	const visibleActions = actions.filter((action) => isVisible(action.access));

	const normalizedQuery = query.trim().toLowerCase();
	const filteredActions = normalizedQuery
		? visibleActions.filter((action) =>
				`${action.title} ${action.description}`
					.toLowerCase()
					.includes(normalizedQuery),
			)
		: visibleActions;

	const displayName = [user?.first_name, user?.last_name]
		.map((part) => part?.trim())
		.filter(Boolean)
		.join(" ");

	return (
		<div className="home-screen">
			<div className="home-subheader">
				<div className="home-subheader-content">
					<p className="home-meta">{formatDateTime(new Date())}</p>
				</div>
			</div>

			<section className="home-hero" aria-labelledby={`${searchId}-title`}>
				<div className="home-hero-inner">
					<div className="home-hero-copy">
						<p className="home-eyebrow">Module Selector</p>

						<h1 id={`${searchId}-title`} className="home-hero-title">
							Welcome back
							{displayName ? (
								<>
									, <span className="home-hero-name">{displayName}</span>
								</>
							) : null}
						</h1>

						<p className="home-hero-description">
							Your Tata Hitachi enterprise workspace for marketing, vendor
							management, contracts, medical, workflows and administration.
						</p>
					</div>

					{visibleActions.length > 0 ? (
						<div className="home-search" role="search">
							<label htmlFor={searchId} className="sr-only">
								Search modules
							</label>

							<Search aria-hidden="true" className="home-search-icon" />

							<input
								id={searchId}
								type="search"
								className="home-search-input"
								placeholder="Search for a module (e.g., Vendor Onboarding, Workflows...)"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Escape") setQuery("");
								}}
								aria-controls={resultsId}
								autoComplete="off"
							/>

							{query ? (
								<button
									type="button"
									className="home-search-clear"
									aria-label="Clear search"
									onClick={() => setQuery("")}
								>
									<X aria-hidden="true" size={18} />
								</button>
							) : null}
						</div>
					) : null}
				</div>

				{HOME_HERO_IMAGE_SRC ? (
					<div className="home-hero-media" aria-hidden="true">
						<img src={HOME_HERO_IMAGE_SRC} alt="" />
					</div>
				) : null}
			</section>

			<div className="home-main">
				<section
					id={resultsId}
					className="home-module-section"
					aria-label="Available applications"
				>
					{/* Announces filter results to screen readers */}
					<p className="sr-only" role="status">
						{normalizedQuery
							? `${filteredActions.length} module${filteredActions.length === 1 ? "" : "s"} found`
							: ""}
					</p>

					{visibleActions.length === 0 ? (
						<div className="home-empty-state" role="status">
							<p className="home-empty-title">No applications available</p>

							<p className="home-empty-description">
								You currently do not have access to any application modules.
							</p>
						</div>
					) : filteredActions.length === 0 ? (
						<div className="home-empty-state">
							<p className="home-empty-title">
								No modules match “{query.trim()}”
							</p>

							<p className="home-empty-description">
								Try a different name, or clear the search to see all modules.
							</p>

							<button
								type="button"
								className="home-empty-action"
								onClick={() => setQuery("")}
							>
								Clear search
							</button>
						</div>
					) : (
						<ul className="home-module-grid">
							{filteredActions.map((action) => {
								const Icon = action.icon;
								const DecorIcon = action.decorIcon;

								return (
									<li key={action.title}>
										<ActionCard
											appId={findAppId(action.access)}
											description={action.description}
											icon={<Icon strokeWidth={1.8} aria-hidden="true" />}
											decorIcon={<DecorIcon aria-hidden="true" />}
											badge={action.badge}
											isActive={action.isActive}
											path={action.path}
											title={action.title}
										/>
									</li>
								);
							})}
						</ul>
					)}
				</section>
			</div>
		</div>
	);
}
