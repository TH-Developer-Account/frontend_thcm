import type { ReactNode } from "react";
import logo from "../assets/thcm-logo/th-brand-logo.png";

type PublicPagesLayoutProps = {
	children: ReactNode;
	className?: string;
};

const joinClassNames = (...classNames: Array<string | undefined | false>) =>
	classNames.filter(Boolean).join(" ");

export const PublicPagesLayout = ({
	className,
	children,
}: PublicPagesLayoutProps) => {
	return (
		<div className="public-pages-layout flex min-h-dvh flex-col bg-slate-50">
			<header className="header-public shrink-0 border-b border-slate-200 bg-white">
				<div className="public-page-brand">
					<a className="home-brand" href="/" aria-label="Tata Hitachi home">
						<img src={logo} alt="Tata Hitachi" />
					</a>
				</div>
			</header>

			<main className="public-page flex flex-1">
				<div className="public-page-container flex w-full">
					<section
						className={joinClassNames("public-page-content w-full", className)}
					>
						{children}
					</section>
				</div>
			</main>

			<footer className="public-page-footer shrink-0 border-t border-slate-200 bg-white">
				Tata Hitachi Construction Machinery
			</footer>
		</div>
	);
};
export default PublicPagesLayout;
