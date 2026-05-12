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
	className = "",
}: FormHeaderProps) => {
	return (
		<div className={`form-section-header ${className}`}>
			<div className="form-section-header-accent" />

			<div className="form-section-header-icon">
				{Icon && <Icon color={iconColor} size={15} strokeWidth={2.2} />}
			</div>

			<h3 className="form-section-header-title">{title}</h3>
		</div>
	);
};

export default FormHeader;
