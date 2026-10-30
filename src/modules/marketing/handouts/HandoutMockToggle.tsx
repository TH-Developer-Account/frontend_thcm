// handouts/HandoutMockToggle.tsx
// MOCK-LAYER (delete this file when the real API is live)
//
// The "Use mock data" checkbox. Checked: Handouts runs on the in-memory demo
// data. Unchecked: it calls the real /handouts API.

import { useHandoutMockMode } from "./handouts.mockMode";

export default function HandoutMockToggle() {
	const [isMock, setMock] = useHandoutMockMode();

	return (
		<label
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: "var(--space-2)",
				fontSize: "0.8125rem",
				cursor: "pointer",
				userSelect: "none",
			}}
		>
			<input
				type="checkbox"
				checked={isMock}
				onChange={(event) => setMock(event.target.checked)}
			/>
			Use mock data
		</label>
	);
}
