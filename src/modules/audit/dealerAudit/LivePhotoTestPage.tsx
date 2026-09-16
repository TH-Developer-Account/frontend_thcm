import React from "react";

import { LivePhotoUploadField } from "./LivePhotoUploadField";
import type { LivePhotoValue } from "./LivePhotoUploadField";

// Throwaway reverse-geocode stub for manual testing — swap for your real
// backend proxy before this touches production data.
async function mockReverseGeocode(lat: number, lng: number): Promise<string> {
	const res = await fetch(
		`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16`,
		{ headers: { "Accept-Language": "en" } },
	);
	const data = await res.json();
	const a = data.address ?? {};
	return (
		[a.suburb || a.neighbourhood || a.road, a.city || a.town, a.state]
			.filter(Boolean)
			.join(", ") || data.display_name
	);
}

export default function LivePhotoTestPage() {
	const [photos, setPhotos] = React.useState<LivePhotoValue[]>([]);

	return (
		<div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
			<h2 style={{ fontSize: 16, marginBottom: 12 }}>
				Live Photo Upload — Test
			</h2>

			<LivePhotoUploadField
				label="Site photo"
				description="Captures your location automatically"
				value={photos}
				onChange={setPhotos}
				maxFiles={5}
				reverseGeocode={mockReverseGeocode}
			/>

			{/* Raw state dump so you can see exactly what the component is
			    producing while you test — remove once you're wiring this
			    into a real form. */}
			<pre
				style={{
					marginTop: 16,
					fontSize: 10,
					background: "#f8fafc",
					padding: 8,
					borderRadius: 8,
					overflowX: "auto",
				}}
			>
				{JSON.stringify(
					photos.map((p) => ({ ...p, url: "[blob-url]" })),
					null,
					2,
				)}
			</pre>
		</div>
	);
}
