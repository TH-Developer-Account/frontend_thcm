import type { EpcFormValues } from "../../../types";

type APCBasicInfoProps = {
	formData?: EpcFormValues;
};
const APCBasicInfo = ({ formData }: APCBasicInfoProps) => {
	const eventName =
		typeof formData?.event_name === "object"
			? formData?.event_name
			: formData?.event_name;

	const branchName =
		typeof formData?.branch === "object" ? formData?.branch : formData?.branch;

	const departmentName =
		typeof formData?.department === "object"
			? formData?.department
			: formData?.department;

	const verticalName =
		typeof formData?.vertical === "object"
			? formData?.vertical
			: formData?.vertical;

	const regionName =
		typeof formData?.region === "object" ? formData?.region : formData?.region;

	const budgetValue =
		typeof formData?.budgetDescription === "object"
			? formData?.budgetDescription
			: formData?.budgetDescription;
	return (
		<div className="grid grid-cols-2 gap-6 mt-6 text-sm mb-6">
			<div>
				<span className="text-gray-500">Location</span>
				<br />
				{/* {formData?.location || "--"}/ */}
			</div>

			<div>
				<span className="text-gray-500">Branch</span>
				<br />
				{branchName || "--"}
			</div>

			<div>
				<span className="text-gray-500">Department</span>
				<br />
				{/* {formData?.department || "--"} */}
			</div>

			<div>
				<span className="text-gray-500">Vertical</span>
				<br />
				{/* {formData?.vertical || "--"} */}
			</div>

			<div>
				<span className="text-gray-500">Zone</span>
				<br />
				{/* {formData?.region || "--"} */}
			</div>

			{/* <div>
				<span className="text-gray-500">Created</span>
				<br />
				{formatDate(formData?.)}
			</div> */}

			<div>
				<span className="text-gray-500">Event Scale</span>
				<br />
				{/* {formData?.event_scale || "--"} */}
			</div>

			<div>
				<span className="text-gray-500">Budget</span>
				<br />
				{/* {formData?.budgetDescription || "--"} */}
			</div>
		</div>
	);
};

export default APCBasicInfo;
