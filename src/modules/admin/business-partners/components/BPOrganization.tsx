import React from "react";

type InfoField = {
	label: string;
	value?: string;
	isLink?: boolean;
	onClick?: () => void;
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
	const organizationFields: InfoField[] = [
		{ label: "Organization Name", value: data?.orgName },
		{ label: "Joined On", value: data?.joinedOn },
		{ label: "Branches", value: data?.branches },
		{ label: "GST No", value: data?.gstNo },
		{ label: "PAN No", value: data?.panNo },
		{ label: "Registration No", value: data?.registrationNo },
	];

	const businessPartnerFields: InfoField[] = [
		{ label: "Organization Code", value: data?.bpCode },
		{ label: "Zone", value: data?.zone },
		{ label: "Segment", value: data?.segment },
		{ label: "Category", value: data?.category },
		{ label: "Partner Type", value: data?.partnerType },
		{ label: "Status", value: data?.status },
	];

	const additionalFields: InfoField[] = [
		{ label: "Website", value: data?.website },
	];

	return (
		<div className="bp-gen-content">
			<div className="bp-general-info">
				<div className="general-box">
					{organizationFields.map((field) => (
						<div key={field.label} className="info-row">
							<p className="info-label">{field.label} :</p>
							<p className="info-value">{field.value || fallbackValue}</p>
						</div>
					))}
				</div>

				<div className="general-box">
					{businessPartnerFields.map((field) => (
						<div key={field.label} className="info-row">
							<p className="info-label">{field.label} :</p>
							<p className="info-value">{field.value || fallbackValue}</p>
						</div>
					))}
				</div>

				{additionalFields.some((field) => field.value) && (
					<div className="general-box">
						{additionalFields.map((field) => (
							<div key={field.label} className="info-row">
								<p className="info-label">{field.label} :</p>
								<p className="info-value">{field.value || fallbackValue}</p>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default BPOrganization;
