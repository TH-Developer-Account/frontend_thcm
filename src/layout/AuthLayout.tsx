import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthLayoutProps = {
	children: ReactNode;
	className?: string;
	imageSrc?: string;
	eyebrow?: string;
	title?: string;
	description?: string;
};

export const AuthLayout = ({
	children,
	className,
	// imageSrc,
}: AuthLayoutProps) => {
	return (
		<main className="auth-layout">
			<section
				className="auth-visual"
				aria-label="Tata Hitachi Construction Machinery"
			>
				<div aria-hidden="true" className="auth-visual-overlay" />
				<div aria-hidden="true" className="auth-visual-grid" />

				<div className="auth-visual-content">
					<Link
						to="/login"
						className="auth-brand-link"
						aria-label="Tata Hitachi login"
					>
						<img
							src="src/assets/thcm-logo/th-brand-logo.png"
							alt="Tata Hitachi"
							className="auth-brand-logo"
						/>
					</Link>

					<div className={["auth-card", className].filter(Boolean).join(" ")}>
						{children}
					</div>

					<div className="auth-visual-footer">
						<span className="auth-system-status">
							<span aria-hidden="true" className="auth-system-dot" />
							Secure
						</span>

						<span>TATA Hitachi Construction Machinery</span>
					</div>
				</div>
			</section>
		</main>
	);
};
