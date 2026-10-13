const COLUMNS = [
	{ label: "employeeName", required: true },
	{ label: "ticketNumber", required: true },
	{ label: "email", required: true },
	{ label: "mobile", required: true },
];

const EXAMPLE_ROWS = [
	["Rahul Sharma", "RE10214", "rahul.sharma@example.com", "9876543210"],
	["Priya Mehta", "RE10373", "priya.mehta@example.com", "8765432109"],
];

/** Visual hint of the template layout shown inside the import modal. */
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
								<th key={column.label} className="border border-zinc-200 px-3 py-1 font-medium">
									{String.fromCharCode(65 + index)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						<tr>
							<td className="border border-zinc-200 bg-zinc-100 px-2 py-2 text-center text-zinc-500">1</td>
							{COLUMNS.map((column) => (
								<td
									key={column.label}
									className="border border-zinc-300 bg-green-100 px-3 py-2 font-semibold text-green-900"
								>
									{column.label}
									{column.required ? <span className="ml-0.5 text-red-500">*</span> : null}
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
				<span>Required fields · mobile: 10 digits starting 6-9 · ticket: retiree code</span>
				<span className="ml-auto">Row 1 must remain the header row</span>
			</div>
		</div>
	);
}
