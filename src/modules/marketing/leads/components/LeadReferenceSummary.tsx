import type { LeadInfo } from "../types/leads.types";

type LeadReferenceSummaryProps = {
	leadInfo: LeadInfo;
};

export const LeadReferenceSummary = ({
	leadInfo,
}: LeadReferenceSummaryProps) => {
	const items = [
		{
			label: "EPC No",
			value: leadInfo.proposalNumber || leadInfo.epcId || "--",
		},
		// { label: "Event Name", value: leadInfo.eventName || "--" },
		{ label: "Location", value: leadInfo.location || "--" },
	];

	return (
		<div className="leads-reference-summary">
			{items.map((item) => (
				<div key={item.label} className="leads-reference-item">
					<span className="leads-reference-label uppercase-label-text">
						{item.label}
					</span>

					<p className="leads-reference-value" title={item.value}>
						{item.value}
					</p>
				</div>
			))}
		</div>
	);
};
