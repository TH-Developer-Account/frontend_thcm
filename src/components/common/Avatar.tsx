interface AvatarProps {
	firstName: string;
	lastName?: string;
	imageUrl?: string;
	size?: "sm" | "md" | "lg";
}

const sizeClasses = {
	sm: "w-8 h-8 text-xs",
	md: "w-10 h-10 text-sm",
	lg: "w-14 h-14 text-lg",
};

const Avatar: React.FC<AvatarProps> = ({
	firstName,
	lastName = "",
	imageUrl,
	size = "md",
}) => {
	const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
	const fullName = `${firstName} ${lastName}`.trim();

	return (
		<div className="relative inline-flex group">
			{/* Avatar */}
			<div
				tabIndex={0}
				className={`
          ${sizeClasses[size]}
          rounded-full
          bg-transparent
          flex items-center justify-center
          font-semibold
          overflow-hidden
          select-none
          cursor-default
          text-white
          text-md
        `}
				aria-label={fullName}
			>
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={fullName}
						className="w-full h-full object-cover"
						onError={(e) => {
							(e.currentTarget as HTMLImageElement).style.display = "none";
						}}
					/>
				) : (
					<span>{initials}</span>
				)}
			</div>

			{/* Tooltip */}
			<div
				className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          whitespace-nowrap
          rounded-md bg-gray-900 text-white text-xs
          px-2 py-1 shadow-lg
          opacity-0 scale-95
          pointer-events-none
          transition-all duration-150
          group-hover:opacity-100
          group-hover:scale-100
          group-focus-within:opacity-100
          group-focus-within:scale-100
          z-50
        "
			>
				{fullName}
			</div>
		</div>
	);
};

export default Avatar;
