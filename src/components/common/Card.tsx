import React from "react";

type CardProps = {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
	hoverable?: boolean;
	style?: React.CSSProperties;
};
export const Card: React.FC<CardProps> = ({
	children,
	className = "",
	onClick,
	hoverable,
	style,
}) => (
	<div
		onClick={onClick}
		style={style}
		className={`bg-zinc-900 border border-zinc-800 rounded-xl ${hoverable ? "hover:border-zinc-600 hover:bg-zinc-800/60 cursor-pointer transition-all duration-200" : ""} ${className}`}
	>
		{children}
	</div>
);
