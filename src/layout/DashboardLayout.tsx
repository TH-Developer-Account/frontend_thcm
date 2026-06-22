import { HeaderLayout } from "./HeaderLayout";
import { SidebarLayout } from "./SidebarLayout";
import { MainLayout } from "./MainLayout";
import type { DashboardLayoutProps } from "./layout.types";

export const DashboardLayout = ({
	isSidebarOpen,
	onToggleSidebar,
	sidebarItems,
	header,
	children,
}: DashboardLayoutProps) => {
	return (
		<div className="app-layout">
			<HeaderLayout
				isSidebarOpen={isSidebarOpen}
				onToggleSidebar={onToggleSidebar}
			>
				{header}
			</HeaderLayout>

			<div className="app-body">
				<SidebarLayout
					isOpen={isSidebarOpen}
					items={sidebarItems}
					onClose={onToggleSidebar}
					onToggleSidebar={onToggleSidebar}
				/>

				<div className="app-main">
					<MainLayout>{children}</MainLayout>
				</div>
			</div>
		</div>
	);
};
