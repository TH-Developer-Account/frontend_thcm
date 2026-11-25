import { Outlet } from "react-router-dom";

import Header from "../components/ui/Header";
import { MAIN_CONTENT_ID } from "./MainLayout";
import { SkipLink } from "./SkipLink";

export default function HomeLayout() {
	return (
		<div className="home-layout">
			<SkipLink targetId={MAIN_CONTENT_ID} />

			<header className="home-layout-header">
				<div className="home-layout-header-inner">
					<Header />
				</div>
			</header>

			<main
				id={MAIN_CONTENT_ID}
				tabIndex={-1}
				className="home-layout-main scrollbar-sleek"
			>
				<Outlet />
			</main>
		</div>
	);
}
