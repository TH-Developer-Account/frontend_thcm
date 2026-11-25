// utils/cpp.amount.ts — one place for how CPP shows and cleans money.
//   cleanAmountInput("12,50,000.5x") -> "1250000.5"   (what the form stores and the API gets)
//   formatAmountText("1250000.5")    -> "12,50,000.5" (what the user sees)
//   amountInWords("1250000.5")       -> "Rupees Twelve Lakh Fifty Thousand and Fifty Paise Only"
// Indian grouping (lakh / crore), as on the CPP sheet.

const MAX_DECIMALS = 2;

/**
 * Keeps what a typed amount may contain: digits, one decimal point (max 2
 * decimals) and a leading minus. Commas, spaces and ₹ are dropped, so the form
 * value is always the raw number text the API expects.
 */
export const cleanAmountInput = (text: string): string => {
	const trimmed = String(text ?? "").trim();
	const negative = trimmed.startsWith("-");
	const kept = trimmed.replace(/[^\d.]/g, "");
	const [whole, ...rest] = kept.split(".");
	const decimals = rest.join("").slice(0, MAX_DECIMALS);
	const body = rest.length ? `${whole}.${decimals}` : whole;
	return negative && body ? `-${body}` : body;
};

const isAmountText = (value: string): boolean =>
	/^-?\d+(\.\d*)?$/.test(value);

/** Indian digit grouping on the whole part; typed decimals are kept as they are. */
export const formatAmountText = (raw: string | number | null | undefined): string => {
	const value = raw === null || raw === undefined ? "" : String(raw).trim();
	if (!value || !isAmountText(value)) return value;
	const negative = value.startsWith("-");
	const [whole, decimals] = value.replace("-", "").split(".");
	const grouped = Number(whole || "0").toLocaleString("en-IN", {
		maximumFractionDigits: 0,
	});
	return `${negative ? "-" : ""}${grouped}${decimals !== undefined ? `.${decimals}` : ""}`;
};

/* ----------------------------- amount in words ---------------------------- */

const ONES = [
	"",
	"One",
	"Two",
	"Three",
	"Four",
	"Five",
	"Six",
	"Seven",
	"Eight",
	"Nine",
	"Ten",
	"Eleven",
	"Twelve",
	"Thirteen",
	"Fourteen",
	"Fifteen",
	"Sixteen",
	"Seventeen",
	"Eighteen",
	"Nineteen",
];
const TENS = [
	"",
	"",
	"Twenty",
	"Thirty",
	"Forty",
	"Fifty",
	"Sixty",
	"Seventy",
	"Eighty",
	"Ninety",
];

const twoDigits = (n: number): string =>
	n < 20
		? ONES[n]
		: `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;

const threeDigits = (n: number): string => {
	const hundreds = Math.floor(n / 100);
	const rest = n % 100;
	return [hundreds ? `${ONES[hundreds]} Hundred` : "", rest ? twoDigits(rest) : ""]
		.filter(Boolean)
		.join(" ");
};

/** Whole number in the Indian system: crore, lakh, thousand, hundred. */
const indianWords = (n: number): string => {
	if (n === 0) return "Zero";
	const parts: string[] = [];
	const crore = Math.floor(n / 1e7);
	let rest = n % 1e7;
	const lakh = Math.floor(rest / 1e5);
	rest %= 1e5;
	const thousand = Math.floor(rest / 1000);
	rest %= 1000;
	// Above 99 crore the crore count itself is said in the same system.
	if (crore) parts.push(`${indianWords(crore)} Crore`);
	if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
	if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
	if (rest) parts.push(threeDigits(rest));
	return parts.join(" ");
};

/**
 * "Rupees Ten Lakh Only" for the help text under an amount field.
 * Blank or non-numeric input gives "" so nothing is shown.
 */
export const amountInWords = (raw: string | number | null | undefined): string => {
	const value = cleanAmountInput(String(raw ?? ""));
	if (!value || !isAmountText(value)) return "";
	const negative = value.startsWith("-");
	const [wholeText, decimalText = ""] = value.replace("-", "").split(".");
	const rupees = Number(wholeText || "0");
	const paise = Number(decimalText.padEnd(2, "0").slice(0, 2) || "0");
	if (!Number.isSafeInteger(rupees)) return "";
	if (rupees === 0 && paise === 0) return "Rupees Zero Only";

	const rupeeText = rupees ? `Rupees ${indianWords(rupees)}` : "";
	const paiseText = paise ? `${twoDigits(paise)} Paise` : "";
	const joined = [rupeeText, paiseText].filter(Boolean).join(" and ");
	return `${negative ? "Minus " : ""}${joined} Only`;
};

/** Number from stored amount text (commas tolerated). null when blank or invalid. */
export const amountToNumber = (
	raw: string | number | null | undefined,
): number | null => {
	if (raw === null || raw === undefined) return null;
	const value = cleanAmountInput(String(raw));
	if (!value || !isAmountText(value)) return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};
