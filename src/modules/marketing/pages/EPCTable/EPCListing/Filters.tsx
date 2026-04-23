import React from "react";
import SelectInput from "../../../../../components/FormElements/SelectInput";

const filters = ["Event Date", "Assigned To", "Region", "Status"];

export default function Filters() {
	return (
		<React.Fragment>
			<div className="grid grid-cols-4 content-around gap-2 mb-2 text-black">
				{filters.map((f) => (
					<SelectInput
						options={[{ label: f, value: f }]}
						key={f}
						className="text-left text-sm"
					/>
				))}
			</div>
		</React.Fragment>
	);
}
