export const DEFAULT_COUNTRY_CODE = "+91";

// Longest codes first so "+971" isn't read as "+97"+"1".
// Extend this list as you support more countries.
export const COUNTRY_CODES = [
	{ code: "+91", label: "India (+91)" },
	{ code: "+971", label: "UAE (+971)" },
	{ code: "+1", label: "US/CA (+1)" },
	{ code: "+44", label: "UK (+44)" },
] as const;

export const joinMobile = (countryCode: string, mobile: string) =>
	`${countryCode}${mobile.replace(/\D/g, "")}`;

/** "+919845012345" -> { countryCode: "+91", mobile: "9845012345" } */
export const splitMobile = (full?: string) => {
	if (!full) return { countryCode: DEFAULT_COUNTRY_CODE, mobile: "" };

	const cleaned = full.replace(/[\s-]/g, "");
	const match = [...COUNTRY_CODES]
		.sort((a, b) => b.code.length - a.code.length)
		.find(({ code }) => cleaned.startsWith(code));

	if (match) {
		return {
			countryCode: match.code,
			mobile: cleaned.slice(match.code.length),
		};
	}
	// Legacy records saved without a code: assume default
	return {
		countryCode: DEFAULT_COUNTRY_CODE,
		mobile: cleaned.replace(/^0+/, ""),
	};
};
