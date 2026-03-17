import React from "react";

/* ─── section wrapper ─────────────────────────────────────────────────────── */
const Section = ({ title, children }: any) => (
	<div className="mb-8">
		<div className="epf-section-header">
			<span className="epf-section-label">{title}</span>
		</div>
		{children}
	</div>
);
const BudgetShare = () => {
	return (
		<React.Fragment>
			{/* ── Section 6: Dealer / PO Share ─────────────────────────── */}
			<Section title="Dealer & Cost Sharing">
				<div className="grid grid-cols-2 gap-5 mb-5">
					<div className="epf-budget-card">
						<p className="epf-field-label">Dealer Name</p>
						<p className="epf-field-value">Recon Technologies Pvt Ltd.</p>
					</div>
					<div className="epf-budget-card">
						<p className="epf-field-label">Tata Hitachi PO Amount</p>
						<p className="epf-field-value">₹ 1,00,000.00</p>
					</div>
				</div>

				{/* share bar */}
				<div
					className="rounded-lg p-5"
					style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
				>
					<div className="flex justify-between text-sm mb-3">
						<div>
							<span className="epf-field-label">Dealer Share</span>
							<p className="text-slate-800 font-semibold mt-1">
								75% — ₹ 62,250.00
							</p>
						</div>
						<div className="text-right">
							<span className="epf-field-label">Tata Hitachi Share</span>
							<p className="text-slate-800 font-semibold mt-1">
								25% — ₹ 20,750.00
							</p>
						</div>
					</div>
					<div className="epf-share-bar">
						<div
							className="epf-share-bar-fill"
							style={{
								width: "75%",
								background: "linear-gradient(90deg,#3b82f6,#60a5fa)",
							}}
						/>
					</div>
					<div className="flex justify-between text-xs text-slate-400 mt-1">
						<span>Dealer 75%</span>
						<span>Tata Hitachi 25%</span>
					</div>
				</div>
			</Section>

			<hr className="epf-divider" />
		</React.Fragment>
	);
};

export default BudgetShare;
