import React from "react";
import type { CardProps } from "./common.types";

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
		className={`
			card
			${hoverable ? "card-hover" : ""}
			${className}
		`}
	>
		{children}
	</div>
);
