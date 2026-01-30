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

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full
        bg-white
        text-orange-500
        flex items-center justify-center
        font-semibold
        overflow-hidden
        select-none
      `}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${firstName} ${lastName}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

export default Avatar;
