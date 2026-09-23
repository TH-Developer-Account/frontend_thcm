/**
 * Indian states and union territories (28 + 8), stored by name — matches
 * how BusinessPartnerAddress.state is persisted ("Karnataka", not "KA").
 */
export type IndianStateOption = {
	label: string;
	value: string;
};

const INDIAN_STATE_NAMES = [
	"Andhra Pradesh",
	"Arunachal Pradesh",
	"Assam",
	"Bihar",
	"Chhattisgarh",
	"Goa",
	"Gujarat",
	"Haryana",
	"Himachal Pradesh",
	"Jharkhand",
	"Karnataka",
	"Kerala",
	"Madhya Pradesh",
	"Maharashtra",
	"Manipur",
	"Meghalaya",
	"Mizoram",
	"Nagaland",
	"Odisha",
	"Punjab",
	"Rajasthan",
	"Sikkim",
	"Tamil Nadu",
	"Telangana",
	"Tripura",
	"Uttar Pradesh",
	"Uttarakhand",
	"West Bengal",
	"Andaman and Nicobar Islands",
	"Chandigarh",
	"Dadra and Nagar Haveli and Daman and Diu",
	"Delhi",
	"Jammu and Kashmir",
	"Ladakh",
	"Lakshadweep",
	"Puducherry",
] as const;

export const INDIAN_STATE_OPTIONS: IndianStateOption[] = INDIAN_STATE_NAMES.map(
	(name) => ({ label: name, value: name }),
);
