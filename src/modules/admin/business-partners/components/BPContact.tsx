type BPContactData = {
	name?: string;
	email?: string;
	mobile_number?: string;
	phone?: string;
	fax?: string;
	status?: string;
	mainContactPerson?: string;
	mainContactNumber?: string;
	state?: string;
	city?: string;
	country?: string;
};

type InfoField = {
	label: string;
	value?: string;
	isLink?: boolean;
	tab?: string;
};

type BPContactProps = {
	data?: BPContactData;
	onNavigateTab?: (tab: string) => void;
};

const fallbackValue = "--";

const BPContact = ({ data, onNavigateTab }: BPContactProps) => {
	const fields: InfoField[] = [
		{ label: "Name", value: data?.name, isLink: true, tab: "Organization" },
		{ label: "Email", value: data?.email },
		{ label: "Fax", value: data?.fax },
		{ label: "Mobile Number", value: data?.mobile_number },
		{ label: "Phone", value: data?.phone },
		{
			label: "Main Contact Person",
			value: data?.mainContactPerson,
			isLink: true,
			tab: "Main Contact",
		},
		{ label: "Main Contact Number", value: data?.mainContactNumber },
		{ label: "State", value: data?.state },
		{ label: "City", value: data?.city },
		{ label: "Country", value: data?.country },
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
										onClick={() => field.tab && onNavigateTab?.(field.tab)}
										className="detail-link"
									>
										{field.value}
									</button>
								) : (
									field.value || fallbackValue
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
