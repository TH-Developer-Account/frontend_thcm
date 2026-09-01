import type { ReactNode } from "react";

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
		<div className="public-pages-layout">
			<header className="header-public bg-white">
				<div className="public-page-brand">
					<a className="home-brand" href="/" aria-label="Tata Hitachi home">
						<img src="/lo.jpg" alt="Tata Hitachi" />
					</a>
				</div>
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
