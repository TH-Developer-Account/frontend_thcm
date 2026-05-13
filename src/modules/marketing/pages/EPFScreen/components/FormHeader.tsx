import type { LucideIcon } from "lucide-react";

interface FormHeaderProps {
	title: string;
	Icon?: LucideIcon;
	iconColor?: string;
	className?: string;
}

const FormHeader = ({
	title,
	Icon,
	iconColor = "var(--color-brand)",
	// className = "",
}: FormHeaderProps) => {
	return (
		<div className="flex items-center justify-between px-3 py-1.5 mb-2">
			<div className="inline-flex min-w-0 items-center gap-2">
				<span className="h-4 w-0.5 shrink-0 rounded-full bg-orange-600" />
				<span className="text-[11px] font-semibold text-orange-700">
					{Icon && <Icon color={iconColor} size={15} strokeWidth={2.2} />}
				</span>
				<h3 className="truncate text-[13px] font-semibold tracking-tight text-orange-800">
					{title}
				</h3>
			</div>
		</div>
	);
};

export default FormHeader;
