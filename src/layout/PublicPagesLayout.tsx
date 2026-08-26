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
		<div>
			<header className="bg-white header-public">
				<div className="public-page-brand">
					<div className="home-brand">
						<img src="/lo.jpg" alt="logo" />
					</div>

					{/* <span className="public-page-security">
						<span
							aria-hidden="true"
							className="public-page-security-indicator"
						/>
						Secure portal
					</span> */}
				</div>
			</header>
			<main className="public-page">
				<section className={joinClassNames("public-page-content", className)}>
					{children}
				</section>
			</main>
			<footer className="public-page-footer bg-white">
				Tata Hitachi Construction Machinery
			</footer>
		</div>
	);
};

export default PublicPagesLayout;
