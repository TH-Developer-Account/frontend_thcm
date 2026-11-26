// modules/audit/shared/checklist/GeoLocationLink.tsx
//
// Evidence coordinates as a tappable Google Maps link plus a one-tap copy of
// "lat, lng". Used by evidence capture, reviewer evidence views and reports,
// so every screen shows location the same way.

import { Check, Copy, ExternalLink, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { auditExecutionContent as content } from "../execution/audit-execution.content";
import type { GeoCoordinates } from "./evidence.types";

const text = content.evidence;

export const formatCoordinates = (
	location: Pick<GeoCoordinates, "latitude" | "longitude">,
): string => `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;

/** Google Maps search URL that drops a pin on the exact point. */
export const buildGoogleMapsUrl = (
	location: Pick<GeoCoordinates, "latitude" | "longitude">,
): string =>
	`https://www.google.com/maps?q=${encodeURIComponent(
		`${location.latitude},${location.longitude}`,
	)}`;

async function copyToClipboard(value: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(value);
		return true;
	} catch {
		// Older WebViews / non-secure contexts: fall back to a hidden textarea.
		const area = document.createElement("textarea");
		area.value = value;
		area.setAttribute("readonly", "");
		area.style.position = "fixed";
		area.style.opacity = "0";
		document.body.appendChild(area);
		area.select();
		const ok = document.execCommand("copy");
		document.body.removeChild(area);
		return ok;
	}
}

interface GeoLocationLinkProps {
	location: GeoCoordinates;
	/** Show the capture date/time after the coordinates. */
	showTime?: boolean;
}

export default function GeoLocationLink({
	location,
	showTime = true,
}: GeoLocationLinkProps) {
	const [copied, setCopied] = useState(false);
	const timerRef = useRef<number | null>(null);
	const coordinates = formatCoordinates(location);

	useEffect(
		() => () => {
			if (timerRef.current !== null) window.clearTimeout(timerRef.current);
		},
		[],
	);

	const handleCopy = async () => {
		const ok = await copyToClipboard(coordinates);
		if (!ok) return;
		setCopied(true);
		if (timerRef.current !== null) window.clearTimeout(timerRef.current);
		timerRef.current = window.setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600">
			<MapPin className="size-3.5 shrink-0" aria-hidden="true" />
			<a
				href={buildGoogleMapsUrl(location)}
				target="_blank"
				rel="noopener noreferrer"
				className="inline-flex min-h-8 items-center gap-1 font-semibold text-brand underline-offset-2 hover:underline"
			>
				{coordinates}
				<ExternalLink className="size-3" aria-hidden="true" />
				<span className="sr-only">{text.openInMaps}</span>
			</a>
			<button
				type="button"
				onClick={handleCopy}
				className="inline-flex min-h-8 items-center gap-1 rounded border border-slate-300 bg-white px-2 font-semibold text-slate-700 hover:border-brand hover:text-brand"
			>
				{copied ? (
					<Check className="size-3" aria-hidden="true" />
				) : (
					<Copy className="size-3" aria-hidden="true" />
				)}
				<span aria-live="polite">{copied ? text.copied : text.copyCoordinates}</span>
			</button>
			{showTime ? (
				<span>{new Date(location.capturedAt).toLocaleString()}</span>
			) : null}
		</div>
	);
}
