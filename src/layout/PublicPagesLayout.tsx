import type { ReactNode } from "react";
import logo from "../assets/thcm-logo/th-brand-logo.png";

type PublicPagesLayoutProps = {
	children: ReactNode;
	className?: string;
	title?: ReactNode;
};

const joinClassNames = (...classNames: Array<string | undefined | false>) =>
	classNames.filter(Boolean).join(" ");

export const PublicPagesLayout = ({
	className,
	children,
	title,
}: PublicPagesLayoutProps) => {
	return (
		<div className="public-pages-layout">
			<header className="header-public relative">
				<div className="public-page-brand">
					{/* Plain wrapper: an aria-label on a div without a role is ignored */}
					<div className="home-brand">
						<img src={logo} alt="Tata Hitachi" />
					</div>

					{/* Mirrors the logo column so the title stays centred */}
					<div className="public-page-brand-spacer" aria-hidden="true" />
				</div>

				{title ? (
					// Centred on the header itself (not between logo and edge), and
					// kept narrow enough that it never runs into the logo.
					<h1 className="pointer-events-none absolute left-1/2 top-1/2 m-0 max-w-[50%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-base font-semibold tracking-tight text-fg sm:text-lg">
						{title}
					</h1>
				) : null}
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

			<footer className="public-page-footer">
				Tata Hitachi Construction Machinery
			</footer>
		</div>
	);
};
export default PublicPagesLayout;
