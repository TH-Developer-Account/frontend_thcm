import { HeaderLayout } from "./HeaderLayout";
import { SidebarLayout } from "./SidebarLayout";
import { MainLayout } from "./MainLayout";
import { type DashboardLayoutProps } from "./layout.types";

export const DashboardLayout = ({
	isSidebarOpen,
	onToggleSidebar,
	sidebarItems,
	header,
	children,
}: DashboardLayoutProps) => {
	return (
		<div className="h-screen flex flex-col overflow-hidden">
			<HeaderLayout onToggleSidebar={onToggleSidebar}>{header}</HeaderLayout>

			<div className="relative flex flex-1 overflow-hidden transition-transform duration-300 ease-in-out">
				<SidebarLayout
					isOpen={isSidebarOpen}
					items={sidebarItems}
					onClose={onToggleSidebar}
				/>

				{/* Main content NEVER resizes on mobile */}
				<div className="flex-1 md:ml-0 overflow-y-auto scrollbar-sleek">
					<MainLayout>{children}</MainLayout>
				</div>
			</div>
		</div>
	);
};
