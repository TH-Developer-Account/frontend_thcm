import * as React from "react";

const COLUMNS = [
	{ label: "Employee Name", required: true },
	{ label: "Grade", required: true },
	{ label: "Email", required: true },
	{ label: "Phone Number", required: true },
];

const EXAMPLE_ROWS = [
	["Rahul Sharma", "M1", "rahul.sharma@example.com", "9876543210"],
	["Priya Mehta", "M2", "priya.mehta@example.com", "8765432109"],
];

export function MedicalClaimInitiationExcelPreview() {
	return (
		<div className="overflow-hidden rounded-md border border-zinc-300 bg-white">
			<div className="flex min-h-9 items-center bg-[#1d6f42] px-3">
				<span className="text-xs font-medium text-white">
					medical-claim-initiation-template.xlsx
				</span>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full min-w-[620px] border-collapse text-xs">
					<thead>
						<tr className="bg-zinc-100 text-zinc-500">
							<th className="w-10 border border-zinc-200 px-2 py-1" />

							{COLUMNS.map((column, index) => (
								<th
									key={column.label}
									className="border border-zinc-200 px-3 py-1 font-medium"
								>
									{String.fromCharCode(65 + index)}
								</th>
							))}
						</tr>
					</thead>

					<tbody>
						<tr>
							<td className="border border-zinc-200 bg-zinc-100 px-2 py-2 text-center text-zinc-500">
								1
							</td>

							{COLUMNS.map((column) => (
								<td
									key={column.label}
									className="border border-zinc-300 bg-green-100 px-3 py-2 font-semibold text-green-900"
								>
									{column.label}

									{column.required ? (
										<span className="ml-0.5 text-red-500">*</span>
									) : null}
								</td>
							))}
						</tr>

						{EXAMPLE_ROWS.map((row, rowIndex) => (
							<tr key={rowIndex}>
								<td className="border border-zinc-200 bg-zinc-100 px-2 py-2 text-center text-zinc-500">
									{rowIndex + 2}
								</td>

								{row.map((value, columnIndex) => (
									<td
										key={`${rowIndex}-${COLUMNS[columnIndex].label}`}
										className="border border-zinc-300 bg-green-50 px-3 py-2 text-zinc-700"
									>
										{value}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="flex items-center gap-2 border-t border-zinc-200 px-3 py-2 text-[11px] text-zinc-500">
				<span className="h-3 w-3 rounded-sm bg-green-100" />
				<span>Required fields</span>

				<span className="ml-auto">Row 1 must remain the header row</span>
			</div>
		</div>
	);
}
