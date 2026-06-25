import React from "react";

type Props = {
	children: React.ReactNode;
	className?: string;
};

export const AuthLayout = ({ children, className }: Props) => {
	return (
		<div className="auth-layout">
			<div className={`auth-card ${className}`}>{children}</div>
		</div>
	);
};
