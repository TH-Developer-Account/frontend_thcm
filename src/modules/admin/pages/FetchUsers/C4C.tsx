import React, { useEffect, useState } from "react";
import GenericDataTable from "./GenericTable";
import { ServerAxios } from "../../../../services/ServerAxios";
import { normalizeSapRow, mapHeader, c4cEmployeeColumnMap } from "./utils";
import FullScreenLoader from "../../../../components/common/FullScreenLoader";

export default function C4CUsers() {
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// simulate page load
		const timer = setTimeout(() => {
			setLoading(false);
		}, 3000); // loader shows for 3 seconds

		return () => clearTimeout(timer);
	}, []);

	async function fetchC4CEmployees() {
		const response = await ServerAxios.get("/users/c4c-employees");
		return response.data;
	}

	if (loading) {
		return <FullScreenLoader />;
	}
	return (
		<React.Fragment>
			<GenericDataTable
				title="Load C4C Employees"
				fetchData={fetchC4CEmployees}
				transformRow={normalizeSapRow}
				formatHeader={(key) => mapHeader(key, c4cEmployeeColumnMap)}
			/>
		</React.Fragment>
	);
}
