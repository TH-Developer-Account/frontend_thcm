import type { LucideIcon } from "lucide-react";

type FormHeaderProps = {
	title: string;
	Icon?: LucideIcon;
	iconColor?: string;
	className?: string;
};

export default function FormHeader({
	title,
	Icon,
	iconColor = "var(--color-brand)",
	className = "",
}: FormHeaderProps) {
	return (
		<div
			className={`mb-2 flex items-center justify-between px-3 py-1.5 ${className}`}
		>
			<div className="inline-flex min-w-0 items-center gap-2">
				<span className="h-4 w-0.5 shrink-0 rounded-full bg-[var(--color-brand)]" />

				{Icon && (
					<Icon
						color={iconColor}
						size={15}
						strokeWidth={2.2}
						className="shrink-0"
					/>
				)}

				<h3 className="truncate text-[13px] font-semibold tracking-tight text-[var(--color-brand)]">
					{title}
				</h3>
			</div>
		</div>
	);
}
