import React from "react";

type ButtonProps = {
  text: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
};

 const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-[#f35a00] text-white py-2  rounded-md font-semibold hover:opacity-90 disabled:opacity-50 ${className}`}
    >
      {text}
    </button>
  );
};
export default Button;