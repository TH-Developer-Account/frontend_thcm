import React from "react";

const filters = ["Event Date", "Assigned To", "EPF No", "Region", "Status"];

export default function Filters() {
	return (
		<React.Fragment>
			<div className="grid grid-cols-5 content-around gap-2 mb-4">
				{filters.map((f) => (
					<select
						key={f}
						className="border rounded-full px-3 py-2 text-sm w-full sm:w-auto"
					>
						<option>{f}</option>
					</select>
				))}
			</div>
		</React.Fragment>
	);
}
