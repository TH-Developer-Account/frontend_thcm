import { Menu } from "lucide-react";
import Button from "../components/common/Button";
import { type HeaderLayoutProps } from "./layout.types";

export const HeaderLayout = ({
	onToggleSidebar,
	children,
}: HeaderLayoutProps) => {
	return (
		<header className="app-header header">
			<Button
				Icon={Menu}
				onClick={onToggleSidebar}
				className="app-header-btn"
				aria-label="Toggle sidebar"
				iconSize="20"
			/>

			<div className="app-header-content">{children}</div>
		</header>
	);
};
