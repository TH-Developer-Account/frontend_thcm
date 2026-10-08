import type { ReactNode } from "react";
import logo from "../assets/thcm-logo/th-brand-logo.png";

type PublicPagesLayoutProps = {
	children: ReactNode;
	className?: string;
	/** Page name shown in the middle of the header (e.g. "Medical Claim Form"). */
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
			<header className="header-public relative bg-white">
				<div className="public-page-brand">
					<a className="home-brand" href="/" aria-label="Tata Hitachi home">
						<img src={logo} alt="Tata Hitachi" />
					</a>
				</div>

				{title ? (
					// Centred on the header itself (not between logo and edge), and
					// kept narrow enough that it never runs into the logo.
					<h1 className="pointer-events-none absolute left-1/2 top-1/2 m-0 max-w-[50%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-base font-semibold tracking-tight text-iron-dark sm:text-lg">
						{title}
					</h1>
				) : null}
			</header>

			<main className="public-page">
				<div className="public-page-container">
					<section className={joinClassNames("public-page-content", className)}>
						{children}
					</section>
				</div>
			</main>

			<footer className="public-page-footer bg-white">
				Tata Hitachi Construction Machinery
			</footer>
		</div>
	);
};

export default PublicPagesLayout;
