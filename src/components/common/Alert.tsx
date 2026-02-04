export type AlertVariant = "warning" | "info" | "error" | "success";

interface AlertCardProps {
	variant: AlertVariant;
	title: string;
	description: string;
	primaryAction: {
		label: string;
		onClick: () => void;
	};
	secondaryAction?: {
		label: string;
		onClick: () => void;
	};
}

const styles = {
	warning: {
		icon: "⚠️",
		iconBg: "bg-yellow-100 text-yellow-600",
	},
	info: {
		icon: "ℹ️",
		iconBg: "bg-blue-100 text-blue-600",
	},
	error: {
		icon: "⛔",
		iconBg: "bg-red-100 text-red-600",
	},
	success: {
		icon: "✅",
		iconBg: "bg-green-100 text-green-600",
	},
};

export function Alert({
	variant,
	title,
	description,
	primaryAction,
	secondaryAction,
}: AlertCardProps) {
	const { icon, iconBg } = styles[variant];

	return (
		<div
			className="mx-auto mt-4 w-full max-w-[380px] sm-w-[300px]
                        rounded-2xl bg-white p-4 sm:p-6
                        shadow-lg"
		>
			{/* Icon */}
			<div
				className={`
          mx-auto mb-3 sm:mb-4
          flex h-10 w-10 sm:h-12 sm:w-12
          items-center justify-center rounded-full
          ${iconBg}
        `}
			>
				<span className="text-base sm:text-lg">{icon}</span>
			</div>

			{/* Content */}
			<h3
				className="
          mb-2 text-center
          text-base sm:text-lg
          font-semibold
        "
			>
				{title}
			</h3>

			<p
				className="
          mb-5 sm:mb-6
          text-center
          text-xs sm:text-sm
          text-gray-500
        "
			>
				{description}
			</p>

			{/* Actions */}
			<div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
				<button
					onClick={primaryAction.onClick}
					className="
            flex-1 rounded-lg
            bg-black px-4 py-2
            text-xs sm:text-sm
            font-medium text-white
            hover:bg-black/90
          "
				>
					{primaryAction.label}
				</button>

				{secondaryAction && (
					<button
						onClick={secondaryAction.onClick}
						className="
              flex-1 rounded-lg border
              px-4 py-2
              text-xs sm:text-sm
              font-medium
              hover:bg-gray-50
            "
					>
						{secondaryAction.label}
					</button>
				)}
			</div>
		</div>
	);
}
