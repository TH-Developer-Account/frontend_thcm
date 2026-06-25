import SelectInput from "../../../../components/FormElements/SelectInput";
import "../bp.css";

const BPFilters = () => {
	return (
		<div className="top-box">
			<SelectInput
				placeholder="Active"
				name="status"
				options={["Active", "Inactive", "Pending"].map((s) => ({
					label: s,
					value: s,
				}))}
			/>
			<SelectInput
				placeholder="Group By"
				name="groupBy"
				options={["Active", "Inactive", "Pending"].map((s) => ({
					label: s,
					value: s,
				}))}
			/>
			<SelectInput
				placeholder="Active"
				name="status"
				options={["Active", "Inactive", "Pending"].map((s) => ({
					label: s,
					value: s,
				}))}
			/>
		</div>
	);
};

export default BPFilters;
