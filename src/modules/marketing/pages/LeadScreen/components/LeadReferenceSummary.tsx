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
		{ label: "Event Name", value: leadInfo.eventName || "--" },
		{ label: "Location", value: leadInfo.location || "--" },
		// { label: "Status", value: leadInfo.status || "--" },
	];

	return (
		<div className="leads-reference-grid text-left">
			{items.map((item) => (
				<div key={item.label}>
					<span className="leads-reference-label uppercase-label-text">
						{item.label}
					</span>
					<p className="leads-reference-value">{item.value}</p>
				</div>
			))}
		</div>
	);
};
