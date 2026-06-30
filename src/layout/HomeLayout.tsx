import { Outlet } from "react-router-dom";

import Header from "../components/ui/Header";

export default function HomeLayout() {
	return (
		<div className="app-shell home-layout">
			<header className="page-screen-header home-layout-header">
				<div className="page-screen-header-inner">
					<Header />
				</div>
			</header>

			<main className="home-layout-main scrollbar-sleek">
				<Outlet />
			</main>
		</div>
	);
}
