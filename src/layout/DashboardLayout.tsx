import { HeaderLayout } from "./HeaderLayout";
import { MainLayout } from "./MainLayout";
import { SidebarLayout } from "./SidebarLayout";
import type { DashboardLayoutProps } from "./layout.types";

export const DashboardLayout = ({
	isSidebarOpen,
	onToggleSidebar,
	onCloseSidebar,
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
					onClose={onCloseSidebar}
					onToggleSidebar={onToggleSidebar}
				/>

				<div className="app-main">
					<MainLayout>{children}</MainLayout>
				</div>
			</div>
		</div>
	);
};
