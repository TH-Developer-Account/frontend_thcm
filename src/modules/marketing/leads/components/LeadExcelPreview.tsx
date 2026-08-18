import React from "react";

const COLUMNS = [
	{ label: "Name", required: true },
	{ label: "Email", required: true },
	{ label: "Phone", required: false },
	{ label: "Notes", required: false },
];

const EXAMPLE_ROWS = [
	["Rahul Sharma", "rahul@dealer.in", "9876543210", "Warm"],
	["Priya Mehta", "priya@example.com", "8765432109", "Cold"],
];

export function LeadExcelPreview() {
	const [activeRow, setActiveRow] = React.useState(0);
	const [activeCol, setActiveCol] = React.useState(0);
	const [charIdx, setCharIdx] = React.useState(0);
	const [phase, setPhase] = React.useState<"typing" | "pause" | "clear">(
		"typing",
	);
	const [displayRows, setDisplayRows] = React.useState(() =>
		EXAMPLE_ROWS.map((row) => row.map(() => "")),
	);

	React.useEffect(() => {
		const id = setInterval(() => {
			if (phase === "typing") {
				const full = EXAMPLE_ROWS[activeRow][activeCol];
				const next = charIdx + 1;

				setDisplayRows((previous) => {
					const copy = previous.map((row) => [...row]);
					copy[activeRow][activeCol] = full.slice(0, next);
					return copy;
				});

				if (next >= full.length) {
					const nextCol = activeCol + 1;

					if (nextCol >= COLUMNS.length) {
						const nextRow = activeRow + 1;

						if (nextRow >= EXAMPLE_ROWS.length) {
							setActiveCol(0);
							setCharIdx(0);
							setPhase("pause");
						} else {
							setActiveRow(nextRow);
							setActiveCol(0);
							setCharIdx(0);
						}
					} else {
						setActiveCol(nextCol);
						setCharIdx(0);
					}
				} else {
					setCharIdx(next);
				}
			} else if (phase === "pause") {
				setPhase("clear");
			} else {
				setDisplayRows(EXAMPLE_ROWS.map((row) => row.map(() => "")));
				setActiveRow(0);
				setActiveCol(0);
				setCharIdx(0);
				setPhase("typing");
			}
		}, 75);

		return () => clearInterval(id);
	}, [phase, activeRow, activeCol, charIdx]);

	const isActive = (rowIndex: number, columnIndex: number) =>
		phase === "typing" && rowIndex === activeRow && columnIndex === activeCol;

	return (
		<div className="lead-excel-preview">
			<div className="lead-excel-titlebar">
				<div className="lead-excel-window-controls" aria-hidden="true">
					<div className="lead-excel-window-dot lead-excel-window-dot-red" />
					<div className="lead-excel-window-dot lead-excel-window-dot-yellow" />
					<div className="lead-excel-window-dot lead-excel-window-dot-green" />
				</div>

				<span className="lead-excel-file-name">lead-import-template.xlsx</span>
			</div>

			<div className="lead-excel-formula-bar">
				<span className="lead-excel-cell-ref">
					{phase === "typing"
						? `${String.fromCharCode(65 + activeCol)}${activeRow + 2}`
						: "A1"}
				</span>

				<div className="lead-excel-formula-divider" aria-hidden="true" />

				<span className="lead-excel-formula-value">
					{phase === "typing"
						? EXAMPLE_ROWS[activeRow][activeCol].slice(0, charIdx + 1)
						: ""}
				</span>
			</div>

			<div className="lead-excel-sheet-scroll scrollbar-sleek">
				<table className="lead-excel-sheet">
					<colgroup>
						<col className="lead-excel-row-number-col" />
						{COLUMNS.map((column) => (
							<col key={column.label} className="lead-excel-data-col" />
						))}
					</colgroup>

					<thead>
						<tr>
							<th className="lead-excel-corner-cell" />

							{COLUMNS.map((column, index) => (
								<th key={column.label} className="lead-excel-column-cell">
									{String.fromCharCode(65 + index)}
								</th>
							))}
						</tr>
					</thead>

					<tbody>
						<tr>
							<td className="lead-excel-row-number-cell">1</td>

							{COLUMNS.map((column) => (
								<td
									key={column.label}
									className={
										column.required
											? "lead-excel-header-cell lead-excel-header-cell-required"
											: "lead-excel-header-cell lead-excel-header-cell-optional"
									}
								>
									{column.label}

									{column.required && (
										<span className="lead-excel-required-mark">*</span>
									)}
								</td>
							))}
						</tr>

						{EXAMPLE_ROWS.map((_, rowIndex) => (
							<tr key={rowIndex}>
								<td className="lead-excel-row-number-cell">{rowIndex + 2}</td>

								{COLUMNS.map((column, columnIndex) => {
									const active = isActive(rowIndex, columnIndex);

									return (
										<td
											key={column.label}
											className={[
												"lead-excel-data-cell",
												column.required
													? "lead-excel-data-cell-required"
													: "lead-excel-data-cell-optional",
												active ? "lead-excel-data-cell-active" : "",
											]
												.filter(Boolean)
												.join(" ")}
										>
											{displayRows[rowIndex]?.[columnIndex] ?? ""}

											{active && (
												<span className="lead-excel-caret" aria-hidden="true" />
											)}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="lead-excel-tabs">
				<div className="lead-excel-tab lead-excel-tab-active">Import Data</div>
				<div className="lead-excel-tab">Field Guide</div>
			</div>

			<div className="lead-excel-legend">
				<div className="lead-excel-legend-item">
					<div className="lead-excel-legend-swatch lead-excel-legend-required" />
					<span>Required</span>
				</div>

				<div className="lead-excel-legend-item">
					<div className="lead-excel-legend-swatch lead-excel-legend-optional" />
					<span>Optional</span>
				</div>

				<span className="lead-excel-legend-note">
					* Row 1 must be the header row
				</span>
			</div>
		</div>
	);
}
