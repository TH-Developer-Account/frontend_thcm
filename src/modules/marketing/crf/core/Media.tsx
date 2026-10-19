// crf/core/Media.tsx
// Product images for the CRF catalog and summary.
//
//   • Souvenirs     — the store image (imageUrl); placeholder if missing or broken.
//   • Printed / Art — no images in the product master → category placeholder.
//
// Placeholders are inline SVG data URIs: no asset files, no network, and they
// render the same everywhere (tiles, cart thumbnails, review).

import React from "react";

import type { CrfCategory } from "./types";

/* ========================================================================== */
/*                                Placeholders                                */
/* ========================================================================== */

const svg = (body: string, bg: string) =>
	`data:image/svg+xml;utf8,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" fill="${bg}"/>${body}</svg>`,
	)}`;

/** Folded brochure — printed materials. */
const PRINTED_PLACEHOLDER = svg(
	`<g fill="none" stroke="#a1a1aa" stroke-width="6" stroke-linejoin="round">
		<path d="M64 60h78l34 34v86H64z" fill="#fff"/>
		<path d="M142 60v34h34"/>
		<path d="M86 122h68M86 144h68M86 166h44"/>
	</g>`,
	"#f4f4f5",
);

/** Framed canvas with a landscape — digital artworks. */
const ARTWORK_PLACEHOLDER = svg(
	`<rect x="44" y="58" width="152" height="112" rx="10" fill="#fff" stroke="#f35a00" stroke-width="6"/>
	<circle cx="88" cy="94" r="12" fill="#fdba74"/>
	<path d="M52 160l46-42 30 26 22-18 38 34z" fill="#fed7aa"/>
	<path d="M84 196h72" stroke="#f35a00" stroke-width="6" stroke-linecap="round"/>`,
	"#fff7ed",
);

/** Gift box — souvenirs without a store image. */
const SOUVENIR_PLACEHOLDER = svg(
	`<g stroke="#a1a1aa" stroke-width="6" stroke-linejoin="round">
		<rect x="58" y="96" width="124" height="88" rx="6" fill="#fff"/>
		<rect x="50" y="76" width="140" height="28" rx="6" fill="#fff"/>
		<path d="M120 76v108" fill="none"/>
		<path d="M120 76c-14-24-44-22-38-4 4 10 24 6 38 4zM120 76c14-24 44-22 38-4-4 10-24 6-38 4z" fill="#fff"/>
	</g>`,
	"#f4f4f5",
);

export const CRF_PLACEHOLDER_IMAGES: Record<CrfCategory, string> = {
	PRINTED_MATERIAL: PRINTED_PLACEHOLDER,
	ARTWORK: ARTWORK_PLACEHOLDER,
	SOUVENIR: SOUVENIR_PLACEHOLDER,
};

export const getPlaceholderImage = (category?: string) =>
	CRF_PLACEHOLDER_IMAGES[category as CrfCategory] ?? SOUVENIR_PLACEHOLDER;

/* ========================================================================== */
/*                                 Component                                  */
/* ========================================================================== */

type CrfImageProps = {
	src?: string | null;
	alt: string;
	category?: string;
	className?: string;
};

/**
 * <img> that falls back to the category placeholder when there is no URL or
 * the URL fails to load. Lazy-loaded so long catalogs stay light.
 */
export function CrfImage({ src, alt, category, className }: CrfImageProps) {
	const fallback = getPlaceholderImage(category);
	const [failedSrc, setFailedSrc] = React.useState<string | null>(null);

	const resolved = src && src !== failedSrc ? src : fallback;

	return (
		<img
			src={resolved}
			alt={alt}
			className={className}
			loading="lazy"
			decoding="async"
			onError={() => {
				if (src && resolved === src) setFailedSrc(src);
			}}
		/>
	);
}
