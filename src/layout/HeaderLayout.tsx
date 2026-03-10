import { Menu } from "lucide-react";
import Button from "../components/common/Button";
import { type HeaderLayoutProps } from "./layout.types";

export const HeaderLayout = ({
	onToggleSidebar,
	children,
}: HeaderLayoutProps) => {
	return (
		<header className="h-14 gap-3 px-3 header sm:px-3 py-2 flex items-center text-white shadow-[0px_3px_12px_0px_rgba(0,0,0,0.2)] ">
			<Button
				Icon={Menu}
				onClick={onToggleSidebar}
				className="p-2 rounded-md hover:bg-gray-50 bg-transparent font-bold text-xl text-black  hover:text-orange-600 transition-transform duration-300 ease-in-out cursor-pointer"
				aria-label="Toggle sidebar"
				iconSize="20"
			/>
			<div className="flex justify-between items-center w-full">{children}</div>
		</header>
	);
};
