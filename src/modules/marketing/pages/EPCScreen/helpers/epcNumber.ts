import type { EpcFormValues, Option } from "../../../types";

export const getOptionCode = (options: Option[] = [], value?: string) => {
	return options.find((opt) => opt.value === value)?.code || "";
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

type MasterData = {
	departments?: Option[];
	branches?: Option[];
	regions?: Option[];
	vertical?: Option[];
};

export const generateProposalNumber = (
	formValues: EpcFormValues,
	masters?: MasterData,
) => {
	const departmentCode = getOptionCode(
		masters?.departments || [],
		formValues.department,
	);

	const branchCode = getOptionCode(masters?.branches || [], formValues.branch);

	const regionCode = getOptionCode(masters?.regions || [], formValues.region);

	const verticalCode = getOptionCode(
		masters?.vertical || [],
		formValues.vertical,
	);

	if (departmentCode && branchCode && regionCode && verticalCode) {
		return generateEpcNo(departmentCode, branchCode, regionCode, verticalCode);
	}

	return "";
};
