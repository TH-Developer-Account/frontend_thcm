import { useState } from "react";
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface AppLayoutProps {
	children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
	const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
	const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

	return (
		<div className="flex min-h-screen bg-gray-50">
			<Sidebar
				isOpen={isSidebarOpen}
				onClose={() => setIsSidebarOpen(false)}
				active={window.location.pathname}
			/>

			<div className="flex-1 flex flex-col">
				<Topbar
					onOpen={() => setIsSidebarOpen(true)}
					setIsFilterOpen={setIsFilterOpen}
					isFilterOpen={isFilterOpen}
				/>

				<main className="p-4 md:p-6 overflow-x-auto">{children}</main>
			</div>
		</div>
	);
};

export default AppLayout;
