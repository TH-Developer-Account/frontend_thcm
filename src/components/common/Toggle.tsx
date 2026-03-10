import React from "react";
import type { ToggleProps } from "./common.types";

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
			className={`
				toggle
				${disabled ? "toggle-disabled" : "toggle-enabled"}
				${className}
			`}
		>
			{label && <span className="toggle-label">{label}</span>}

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
					className={`
						toggle-track
						${styles.track}
						${checked ? "toggle-track-on" : "toggle-track-off"}
					`}
				/>

				{/* Thumb */}
				<div
					className={`
						toggle-thumb
						${styles.thumb}
						${checked ? "translate-x-6" : "translate-x-0"}
					`}
				/>
			</div>
		</label>
	);
};

export default Toggle;
