import React from "react";
import type { ToggleProps } from "./common.types";



const Toggle: React.FC<ToggleProps> = ({
	checked,
	onChange,
	disabled = false,
	label,
	size = "md",
	className = "",
}) => {
	// Sizes live in CSS (.toggle-sm/md/lg). The old Tailwind sizes shrank
	// with the 0.7 root scale (md was 22×11px) and each thumb carried two
	// conflicting translate classes.
	return (
		<label
			className={[
				"toggle",
				`toggle-${size}`,
				disabled ? "toggle-disabled" : "toggle-enabled",
				className,
			]
				.filter(Boolean)
				.join(" ")}
		>
			{label && <span className="toggle-label">{label}</span>}

			<span className="toggle-control">
				<input
					type="checkbox"
					role="switch"
					className="toggle-input sr-only"
					checked={checked}
					aria-checked={checked}
					disabled={disabled}
					onChange={(e) => onChange(e.target.checked)}
				/>

				<span
					className={`toggle-track ${checked ? "toggle-track-on" : "toggle-track-off"}`}
					aria-hidden="true"
				/>

				<span className="toggle-thumb" aria-hidden="true" />
			</span>
		</label>
	);
};

export default Toggle;
