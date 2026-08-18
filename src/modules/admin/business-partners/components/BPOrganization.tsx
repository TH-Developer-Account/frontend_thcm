type InfoField = {
	label: string;
	value?: string;
};

type BPOrganizationData = {
	orgName?: string;
	joinedOn?: string;
	branches?: string;
	gstNo?: string;
	panNo?: string;
	bpCode?: string;
	zone?: string;
	segment?: string;
	category?: string;
	partnerType?: string;
	registrationNo?: string;
	website?: string;
	status?: string;
};

type BPOrganizationProps = {
	data?: BPOrganizationData;
};

const fallbackValue = "--";

const BPOrganization = ({ data }: BPOrganizationProps) => {
	const fields: InfoField[] = [
		{ label: "Organization Name", value: data?.orgName },
		{ label: "Organization Code", value: data?.bpCode },
		{ label: "Status", value: data?.status },
		{ label: "Joined On", value: data?.joinedOn },
		{ label: "Branches", value: data?.branches },
		{ label: "Website", value: data?.website },
		{ label: "GST No", value: data?.gstNo },
		{ label: "PAN No", value: data?.panNo },
		{ label: "Registration No", value: data?.registrationNo },
		{ label: "Zone", value: data?.zone },
		{ label: "Segment", value: data?.segment },
		{ label: "Category", value: data?.category },
		{ label: "Partner Type", value: data?.partnerType },
	];

	return (
		<div className="bp-gen-content">
			<div className="detail-section">
				<div className="detail-grid">
					{fields.map((field) => (
						<div key={field.label} className="detail-row">
							<p className="detail-label">{field.label}</p>
							<p className="detail-value">{field.value || fallbackValue}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default BPOrganization;
