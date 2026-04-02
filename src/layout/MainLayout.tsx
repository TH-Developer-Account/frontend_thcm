import { type MainLayoutProps } from "./layout.types";

export const MainLayout = ({ children, className }: MainLayoutProps) => {
	return <main className={`${className ?? ""}`}>{children}</main>;
};
