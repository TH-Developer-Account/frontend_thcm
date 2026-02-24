import React from "react";

export interface ToggleProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
	label?: string;
	size?: "sm" | "md" | "lg";
	className?: string;
}

const sizeStyles = {
	sm: {
		track: "w-7 h-3.5",
		thumb: "w-2.5 h-2.5 translate-x-3",
	},
	md: {
		track: "w-8 h-4",
		thumb: "w-3 h-3 translate-x-4",
	},
	lg: {
		track: "w-10 h-5",
		thumb: "w-4 h-4 translate-x-5",
	},
};

const Toggle: React.FC<ToggleProps> = ({
	checked,
	onChange,
	disabled = false,
	label,
	size = "md",
	className = "",
}) => {
	const styles = sizeStyles[size];

	return (
		<label
			className={`relative inline-flex items-center gap-2 ${
				disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
			} ${className}`}
		>
			{label && (
				<span className="text-sm text-zinc-400 select-none">{label}</span>
			)}

			<div className="relative">
				<input
					type="checkbox"
					className="sr-only"
					checked={checked}
					disabled={disabled}
					onChange={(e) => onChange(e.target.checked)}
				/>

				{/* Track */}
				<div
					className={`${styles.track} rounded-full transition-colors duration-200 ${
						checked ? "bg-amber-500" : "bg-zinc-700"
					}`}
				/>

				{/* Thumb */}
				<div
					className={`absolute top-0.5 right-6.5 ${
						size === "lg" ? "top-0.5" : "top-0.5"
					} rounded-full bg-white shadow transition-transform duration-200 ${
						styles.thumb
					} ${checked ? "translate-x-6" : "translate-x-0"}`}
				/>
			</div>
		</label>
	);
};

export default Toggle;
