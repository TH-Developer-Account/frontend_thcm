import React from "react";
import GenericDataTable from "./GenericTable";
import { ServerAxios } from "../../../../services/ServerAxios";
import { normalizeSapRow } from "./utils";
import { mapHeader, bydEmployeeColumnMap } from "./utils";

export default function ByDesignUsers() {
  async function fetchByDesignEmployees() {
    const response = await ServerAxios.get("/users/byd-employees");
    return response.data;
  }

  return (
    <React.Fragment>
      <GenericDataTable
        title="Load ByDesign Employees"
        fetchData={fetchByDesignEmployees}
        transformRow={normalizeSapRow}
        formatHeader={(key) => mapHeader(key, bydEmployeeColumnMap)}
      />
    </React.Fragment>
  );
}
