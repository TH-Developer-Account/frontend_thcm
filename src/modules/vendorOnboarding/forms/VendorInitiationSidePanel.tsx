const STEPS = [
	{
		title: "Vendor gets a secure link",
		description: "It arrives by email and opens the onboarding form.",
	},
	{
		title: "Vendor verifies and fills details",
		description: "Verification uses the mobile number you enter here.",
	},
	{
		title: "You track it in Vendors Listing",
		description: "The new vendor appears there with its onboarding status.",
	},
];

const VendorInitiationSidePanel = () => (
	<aside
		className="vendor-next-steps"
		aria-labelledby="vendor-next-steps-title"
	>
		<h3 id="vendor-next-steps-title" className="vendor-next-steps-title">
			What happens next
		</h3>

		<ol className="vendor-next-steps-list">
			{STEPS.map((step, index) => (
				<li key={step.title} className="vendor-next-steps-item">
					<span className="vendor-next-steps-number" aria-hidden="true">
						{index + 1}
					</span>
					<div className="vendor-next-steps-copy">
						<p className="vendor-next-steps-item-title">{step.title}</p>
						<p className="vendor-next-steps-item-description">
							{step.description}
						</p>
					</div>
				</li>
			))}
		</ol>
	</aside>
);

export default VendorInitiationSidePanel;
