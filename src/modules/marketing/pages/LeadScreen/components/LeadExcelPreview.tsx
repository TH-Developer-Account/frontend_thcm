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
		EXAMPLE_ROWS.map((r) => r.map(() => "")),
	);

	React.useEffect(() => {
		const id = setInterval(() => {
			if (phase === "typing") {
				const full = EXAMPLE_ROWS[activeRow][activeCol];
				const next = charIdx + 1;

				setDisplayRows((prev) => {
					const copy = prev.map((r) => [...r]);
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
				setDisplayRows(EXAMPLE_ROWS.map((r) => r.map(() => "")));
				setActiveRow(0);
				setActiveCol(0);
				setCharIdx(0);
				setPhase("typing");
			}
		}, 75);

		return () => clearInterval(id);
	}, [phase, activeRow, activeCol, charIdx]);

	const isActive = (r: number, c: number) =>
		phase === "typing" && r === activeRow && c === activeCol;

	return (
		<div className="rounded-lg border border-zinc-200 overflow-hidden text-xs font-mono">
			{/* Titlebar */}
			<div className="flex items-center gap-2 bg-[#1D6F42] px-3 py-1.5">
				<div className="flex gap-1.5">
					{["#ff5f57", "#febc2e", "#28c840"].map((c) => (
						<div
							key={c}
							className="w-2.5 h-2.5 rounded-full"
							style={{ background: c }}
						/>
					))}
				</div>
				<span className="text-white text-[11px] font-sans">
					lead-import-template.xlsx
				</span>
			</div>

			{/* Formula bar */}
			<div className="flex items-center gap-2 bg-zinc-50 border-b border-zinc-200 px-3 py-1">
				<span className="text-[#1D6F42] font-sans text-[11px] font-medium min-w-[28px]">
					{phase === "typing"
						? `${String.fromCharCode(65 + activeCol)}${activeRow + 2}`
						: "A1"}
				</span>
				<div className="w-px h-3 bg-zinc-300" />
				<span className="text-zinc-600 font-sans text-[11px] truncate">
					{phase === "typing"
						? EXAMPLE_ROWS[activeRow][activeCol].slice(0, charIdx + 1)
						: ""}
				</span>
			</div>

			{/* Sheet */}
			<div className="overflow-x-auto bg-white">
				<table className="w-full border-collapse table-fixed">
					<colgroup>
						<col style={{ width: 28 }} />
						{COLUMNS.map((_, i) => (
							<col key={i} />
						))}
					</colgroup>
					<thead>
						<tr>
							<th
								className="border border-zinc-200 bg-zinc-100 text-zinc-400 text-center font-normal"
								style={{ fontSize: 10 }}
							/>
							{COLUMNS.map((_, i) => (
								<th
									key={i}
									className="border border-zinc-200 bg-zinc-100 text-zinc-500 text-center font-normal py-0.5"
									style={{ fontSize: 10 }}
								>
									{String.fromCharCode(65 + i)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{/* Header row */}
						<tr>
							<td
								className="border border-zinc-200 bg-zinc-100 text-zinc-400 text-center font-sans"
								style={{ fontSize: 10 }}
							>
								1
							</td>
							{COLUMNS.map((col, i) => (
								<td
									key={i}
									className="border py-1 px-2 font-sans font-medium truncate"
									style={{
										fontSize: 11,
										background: col.required ? "#C6EFCE" : "#BDD7EE",
										color: col.required ? "#276221" : "#1D4F76",
										borderColor: "#D0D0D0",
									}}
								>
									{col.label}
									{col.required && (
										<span className="ml-0.5 text-red-500">*</span>
									)}
								</td>
							))}
						</tr>

						{/* Data rows */}
						{EXAMPLE_ROWS.map((_, rIdx) => (
							<tr key={rIdx}>
								<td
									className="border border-zinc-200 bg-zinc-100 text-zinc-400 text-center font-sans"
									style={{ fontSize: 10 }}
								>
									{rIdx + 2}
								</td>
								{COLUMNS.map((col, cIdx) => {
									const active = isActive(rIdx, cIdx);
									return (
										<td
											key={cIdx}
											className="border py-1 px-2 font-sans truncate"
											style={{
												fontSize: 11,
												color: "#222",
												background: col.required ? "#F0FFF4" : "#EFF6FF",
												borderColor: active ? "#1D6F42" : "#D8D8D8",
												borderWidth: active ? 2 : 0.5,
												outline: active ? "1px solid #1D6F42" : "none",
											}}
										>
											{displayRows[rIdx]?.[cIdx] ?? ""}
											{active && (
												<span
													className="inline-block w-px bg-zinc-800 align-middle ml-px"
													style={{
														height: 11,
														animation: "blink 0.8s step-end infinite",
													}}
												/>
											)}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Sheet tab */}
			<div className="flex bg-zinc-100 border-t border-zinc-200 px-2 pt-1">
				<div
					className="bg-white border border-b-0 border-zinc-300 rounded-t px-3 py-0.5 font-sans text-[#1D6F42] font-medium"
					style={{ fontSize: 10 }}
				>
					Import Data
				</div>
				<div
					className="px-3 py-0.5 font-sans text-zinc-400"
					style={{ fontSize: 10 }}
				>
					Field Guide
				</div>
			</div>

			{/* Legend */}
			<div className="flex gap-4 bg-white border-t border-zinc-100 px-3 py-1.5">
				{[
					{ color: "#C6EFCE", text: "Required" },
					{ color: "#BDD7EE", text: "Optional" },
				].map(({ color, text }) => (
					<div key={text} className="flex items-center gap-1.5">
						<div
							className="w-3 h-3 rounded-sm border border-black/10"
							style={{ background: color }}
						/>
						<span className="font-sans text-zinc-500" style={{ fontSize: 10 }}>
							{text}
						</span>
					</div>
				))}
				<span
					className="font-sans text-zinc-400 ml-auto"
					style={{ fontSize: 10 }}
				>
					* Row 1 must be the header row
				</span>
			</div>

			<style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
		</div>
	);
}
