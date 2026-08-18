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
	imageSrc = "/auth-machinery.jpg",
	eyebrow = "Enterprise access",
	title = "Built for demanding operations",
	description = "Secure access to Tata Hitachi enterprise applications, workflows, and operational tools.",
}: AuthLayoutProps) => {
	return (
		<main className="auth-layout">
			<section
				className="auth-visual"
				aria-label="Tata Hitachi Construction Machinery"
			>
				<img src={imageSrc} alt="" className="auth-visual-image" />

				<div aria-hidden="true" className="auth-visual-overlay" />

				<div aria-hidden="true" className="auth-visual-grid" />

				<div className="auth-visual-content">
					<Link
						to="/login"
						className="auth-brand-link"
						aria-label="Tata Hitachi login"
					>
						<img
							src="/th-brand-logo.png"
							alt="Tata Hitachi"
							className="auth-brand-logo"
						/>
					</Link>

					<div className="auth-visual-copy">
						<p className="auth-visual-eyebrow">{eyebrow}</p>

						<h1 className="auth-visual-title">{title}</h1>

						<p className="auth-visual-description">{description}</p>
					</div>

					<div className="auth-visual-footer">
						<span className="auth-system-status">
							<span aria-hidden="true" className="auth-system-dot" />
							Secure enterprise system
						</span>

						<span>Construction Machinery</span>
					</div>
				</div>
			</section>

			<section className="auth-form-panel">
				<div className={["auth-card", className].filter(Boolean).join(" ")}>
					{children}
				</div>

				<p className="auth-form-footer">Tata Hitachi Construction Machinery</p>
			</section>
		</main>
	);
};
