import React from "react";

export type ApprovalRow = {
  id: number;
  name: string;
  email: string;
  stageName: string;
  strategy: string;
};

type Props = {
  data: ApprovalRow[];
};

const ApprovalTable = ({ data }: Props) => {
  return (
    <React.Fragment>
      <div className="w-full overflow-x-auto rounded-sm px-3 mt-4 mb-25">
        {/* Table */}
        <table className="w-full text-xs md:text-sm border border-gray-400">
          <thead className="bg-gray-200 px-3  border-b border-gray-400 h-auto my-3 py-2 font-semibold text-gray-600 md:text-sm text-xs">
            <tr>
              <th className="px-3 py-2 text-left">Stage Order</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Stage</th>
              <th className="px-3 py-2 text-left">Strategy</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row) => (
              <tr
                key={row.email}
                className="border-t border-gray-400 hover:bg-gray-50 transition text-xs text-left m-1"
              >
                <td className="px-3 py-2">{row.id}</td>
                <td className="px-3 py-2 font-medium text-gray-800">
                  {row.name}
                </td>
                <td className="px-3 py-2 text-gray-600">{row.email}</td>
                <td className="px-3 py-2">{row.stageName}</td>
                <td className="px-3 py-2">{row.strategy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </React.Fragment>
  );
};

export default ApprovalTable;
