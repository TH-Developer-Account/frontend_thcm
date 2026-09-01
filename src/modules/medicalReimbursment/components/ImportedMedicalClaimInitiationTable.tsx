import * as React from "react";
import { Send, Trash2 } from "lucide-react";

import Button from "../../../components/common/Button";
import type { ImportedMedicalClaimInitiationRow } from "../types/medicalClaimInitiation.types";
import SimpleViewTable, {
	type SimpleTableColumn,
} from "../../../components/ui/tables/SimpleViewTable";

type ImportedMedicalClaimInitiationTableProps = {
	rows: ImportedMedicalClaimInitiationRow[];
	error?: string;
	isInitiating: boolean;
	onInitiateAll: () => void;
	onClear: () => void;
};

export function ImportedMedicalClaimInitiationTable({
	rows,
	error,
	isInitiating,
	onInitiateAll,
	onClear,
}: ImportedMedicalClaimInitiationTableProps) {
	const columns = React.useMemo<
		SimpleTableColumn<ImportedMedicalClaimInitiationRow>[]
	>(
		() => [
			{
				key: "serialNumber",
				header: "S.No.",
				width: "70px",
				minWidth: 70,
				align: "center",
				render: (_row, index) => index + 1,
			},
			{
				key: "employeeName",
				header: "Employee Name",
				widthUnits: 3,
				minWidth: 180,
				render: (row) => row.employeeName,
			},
			{
				key: "grade",
				header: "Grade",
				widthUnits: 1,
				minWidth: 100,
				render: (row) => row.grade,
			},
			{
				key: "email",
				header: "Email",
				widthUnits: 3,
				minWidth: 220,
				render: (row) => row.email,
			},
			{
				key: "mobile",
				header: "Phone Number",
				widthUnits: 2,
				minWidth: 150,
				render: (row) => row.mobile,
			},
		],
		[],
	);

	if (rows.length === 0) {
		return null;
	}

	return (
		<div className="mt-6 border-t border-zinc-200 pt-5">
			<SimpleViewTable
				title={`Imported Employees (${rows.length})`}
				data={rows}
				columns={columns}
				getRowId={(row) => row.rowId}
				maxHeight="360px"
				ariaLabel="Imported medical claim employees"
				headerActions={
					<div className="flex items-center gap-2">
						<Button
							type="button"
							text="Clear"
							Icon={Trash2}
							size="sm"
							appearance="standard"
							variant="outline"
							disabled={isInitiating}
							onClick={onClear}
						/>

						<Button
							type="button"
							text={
								isInitiating ? "Initiating..." : `Initiate All (${rows.length})`
							}
							Icon={Send}
							size="sm"
							appearance="standard"
							variant="brand"
							disabled={isInitiating}
							onClick={onInitiateAll}
						/>
					</div>
				}
			/>

			{error ? (
				<p role="alert" className="mt-3 text-sm text-red-600">
					{error}
				</p>
			) : null}
		</div>
	);
}
