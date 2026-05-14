import type { EpcFormValues } from "../../types/epc.types";

type MasterOption = {
	value: string;
	label: string;
	code?: string;
	[key: string]: unknown;
};

type EpcMasters = {
	regions?: MasterOption[];
	branches?: MasterOption[];
	departments?: MasterOption[];
	vertical?: MasterOption[];
	eventNames?: MasterOption[];
	budgetMasters?: MasterOption[];
};

export const generateEpcNo = (
	deptCode: string,
	branchCode: string,
	zoneCode: string,
	verticalCode: string,
) => {
	const now = new Date();

	const yyyy = now.getFullYear();
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	const dd = String(now.getDate()).padStart(2, "0");

	const time = now
		.toLocaleTimeString("en-GB", { hour12: false })
		.replace(/:/g, "");

	return `${deptCode}/${verticalCode}/${zoneCode}/${branchCode}/${yyyy}${mm}${dd}${time}`;
};

const findOption = (options: MasterOption[] = [], value?: string | null) => {
	if (!value) return null;

	return (
		options.find(
			(option) =>
				option.value === value ||
				option.code === value ||
				option.label === value,
		) ?? null
	);
};

const getCode = (option?: MasterOption | null) => {
	return String(option?.code || option?.value || "").trim();
};

export const buildEpcNoFromValues = (
	values: EpcFormValues,
	masters?: EpcMasters,
) => {
	const department = findOption(masters?.departments, values.department);
	const branch = findOption(masters?.branches, values.branch);
	const region = findOption(masters?.regions, values.region);
	const vertical = findOption(masters?.vertical, values.vertical);

	const deptCode = getCode(department);
	const branchCode = getCode(branch);
	const zoneCode = getCode(region);
	const verticalCode = getCode(vertical);

	if (!deptCode || !branchCode || !zoneCode || !verticalCode) {
		return "";
	}

	return generateEpcNo(deptCode, branchCode, zoneCode, verticalCode);
};
