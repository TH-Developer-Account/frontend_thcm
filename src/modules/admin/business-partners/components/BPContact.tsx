import type { BPContactData, InfoField } from "../utils/bp.types";

type BPContactProps = {
	data?: BPContactData;
	onNavigateTab?: (tab: string) => void;
};

const FALLBACK_VALUE = "--";

const BPContact = ({ data, onNavigateTab }: BPContactProps) => {
	const fields: InfoField[] = [
		{
			label: "Name",
			value: data?.name,
			isLink: true,
			tab: "Organization",
		},
		{
			label: "Email",
			value: data?.email,
		},
		{
			label: "Fax",
			value: data?.fax,
		},
		{
			label: "Mobile Number",
			value: data?.mobile_number,
		},
		{
			label: "Phone",
			value: data?.phone,
		},
		{
			label: "Main Contact Person",
			value: data?.mainContactPerson,
			isLink: true,
			tab: "People",
		},
		{
			label: "Main Contact Number",
			value: data?.mainContactNumber,
		},
		{
			label: "State",
			value: data?.state,
		},
		{
			label: "City",
			value: data?.city,
		},
		{
			label: "Country",
			value: data?.country,
		},
	];

	return (
		<div className="bp-gen-content">
			<div className="detail-section">
				<div className="detail-grid">
					{fields.map((field) => (
						<div key={field.label} className="detail-row">
							<p className="detail-label">{field.label}</p>

							<p className="detail-value">
								{field.isLink && field.value ? (
									<button
										type="button"
										onClick={() => {
											if (field.tab) {
												onNavigateTab?.(field.tab);
											}
										}}
										className="detail-link"
									>
										{field.value}
									</button>
								) : (
									field.value || FALLBACK_VALUE
								)}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default BPContact;
