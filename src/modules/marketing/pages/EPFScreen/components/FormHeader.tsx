import type { LucideIcon } from "lucide-react";

interface FormHeaderProps {
	title: string;
	Icon?: LucideIcon;
	iconColor?: string;
}
const FormHeader = ({ title, Icon, iconColor }: FormHeaderProps) => {
	return (
		<div className="bg-gray-200 px-3  border-b border-gray-400 text-lg font-normal h-auto my-3 py-2">
			<div className="flex gap-2 items-center">
				{Icon && <Icon color={iconColor ? iconColor : "gray"} size={20} />}
				<h3 className="font-semibold text-gray-600 md:text-sm text-xs">
					{title}
				</h3>
			</div>
		</div>
	);
};

export default FormHeader;
