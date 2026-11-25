import { HeaderLayout } from "./HeaderLayout";
import { MainLayout, MAIN_CONTENT_ID } from "./MainLayout";
import { SidebarLayout } from "./SidebarLayout";
import { SkipLink } from "./SkipLink";
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
			<SkipLink targetId={MAIN_CONTENT_ID} />

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
