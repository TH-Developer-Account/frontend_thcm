import React from "react";
import GenericDataTable from "./GenericTable";
import { ServerAxios } from "../../../../services/ServerAxios";
import { normalizeSapRow, mapHeader, c4cEmployeeColumnMap } from "./utils";

export default function C4CUsers() {
  async function fetchC4CEmployees() {
    const response = await ServerAxios.get("/users/c4c-employees");
    return response.data;
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
