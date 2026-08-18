import { Outlet } from "react-router-dom";

import Header from "../components/ui/Header";

export default function HomeLayout() {
	return (
		<div className="home-layout">
			<header className="home-layout-header">
				<div className="home-layout-header-inner">
					<Header />
				</div>
			</header>

			<main className="home-layout-main scrollbar-sleek">
				<Outlet />
			</main>
		</div>
	);
}
