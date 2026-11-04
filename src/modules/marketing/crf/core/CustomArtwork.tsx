// crf/core/CustomArtwork.tsx
// "Custom artwork" option for the Artworks tab.
//
// When none of the catalog artworks fit, the user can request one of their own:
// width × height, a unit and a free-text description. It is a normal CRF line
// (category ARTWORK, `isCustom: true`) with no catalog product behind it, so:
//   • it has no price — rate / total stay 0 and marketing quotes it,
//   • it is sent to the API as { kind: "CUSTOM_ARTWORK", … } (see mapper.ts),
//   • it is emailed to marketing with the rest of the artworks on final approval.
//
// Two pieces, both rendered inside the Artworks grid by CrfCatalog:
//   <AddCustomArtworkTile />  slim bar with the "Add custom artwork" button
//   <CustomArtworkTile />     the bigger, full-row card holding the inputs
//
// The quantity stepper / remove button stay in CrfCatalog (QuantityControls)
// and are passed in as `children`, so this file never imports CrfCatalog
// (no circular import).

import React from "react";
import { PencilRuler, Plus } from "lucide-react";

import FormInput from "../../../../components/forms/FormInput";
import SelectInput from "../../../../components/forms/SelectInput";
import TextareaInput from "../../../../components/forms/TextareaInput";

import {
	ARTWORK_UNIT,
	ARTWORK_UNITS,
	CRF_LIMITS,
	sanitizeDecimalInput,
	type ArtworkUnit,
	type CrfFormErrors,
} from "./schema";
import {
	ARTWORK_CUSTOM_PRESET,
	CUSTOM_ARTWORK_ID_PREFIX,
	CUSTOM_ARTWORK_LABEL,
	type CrfLineItem,
} from "./types";

/* ========================================================================== */
/*                                   Helpers                                  */
/* ========================================================================== */

type LineErrors = CrfFormErrors["items"][number];

const UNIT_LABELS: Record<ArtworkUnit, string> = {
	px: "Pixels (px)",
	mm: "Millimetres (mm)",
	cm: "Centimetres (cm)",
	in: "Inches (in)",
	ft: "Feet (ft)",
	m: "Metres (m)",
};

const UNIT_OPTIONS = ARTWORK_UNITS.map((unit) => ({
	value: unit,
	label: UNIT_LABELS[unit],
}));

/** Fields this card renders itself — everything else is listed under the card. */
const OWN_FIELDS = ["width", "height", "unit", "description"] as const;

/** Unique, stable key for a new custom line (the form needs a non-empty `value`). */
const newCustomValue = () =>
	`${CUSTOM_ARTWORK_ID_PREFIX}${
		typeof crypto !== "undefined" && "randomUUID" in crypto
			? crypto.randomUUID()
			: Math.random().toString(36).slice(2)
	}`;

/** A blank custom-artwork line, ready to be filled in. */
export const createCustomLine = (): CrfLineItem => {
	const value = newCustomValue();

	return {
		id: undefined, // new line — no server id yet
		value,
		label: CUSTOM_ARTWORK_LABEL,
		particular: value,
		description: "",
		category: "ARTWORK",
		isCustom: true,

		// Not priced: marketing quotes custom artwork.
		rate: 0,
		quantity: 1,
		total: 0,

		width: undefined,
		height: undefined,
		unit: ARTWORK_UNIT,
		resolutionPreset: ARTWORK_CUSTOM_PRESET,
	};
};

/** "12.5" → 12.5, "" / "." → undefined. */
const toDimension = (text: string) => {
	const parsed = Number(text);
	return text === "" || !Number.isFinite(parsed) ? undefined : parsed;
};

/* ========================================================================== */
/*                              Dimension input                               */
/* ========================================================================== */

type DimensionInputProps = {
	id: string;
	label: string;
	value: number | undefined;
	/** Pixels are whole numbers; other units allow up to 2 decimals. */
	wholeOnly: boolean;
	error?: string;
	readOnly: boolean;
	unitSuffix: string;
	onValue: (value: number | undefined) => void;
};

/**
 * The line stores a number, but a number can't hold a half-typed "12." — so the
 * text being typed lives here and the parsed value is pushed up on every key.
 */
const DimensionInput = ({
	id,
	label,
	value,
	wholeOnly,
	error,
	readOnly,
	unitSuffix,
	onValue,
}: DimensionInputProps) => {
	const [text, setText] = React.useState(
		value === undefined ? "" : String(value),
	);

	// Follow outside changes (reset / reload) without fighting the user's typing.
	React.useEffect(() => {
		setText((current) =>
			toDimension(current) === value
				? current
				: value === undefined
					? ""
					: String(value),
		);
	}, [value]);

	const handleChange = (raw: string) => {
		const next = (
			wholeOnly ? raw.replace(/\D/g, "") : sanitizeDecimalInput(raw)
		).slice(0, 10);
		setText(next);
		onValue(toDimension(next));
	};

	return (
		<FormInput
			id={id}
			label={label}
			required
			mode={readOnly ? "view" : "edit"}
			inputMode={wholeOnly ? "numeric" : "decimal"}
			placeholder={wholeOnly ? "e.g. 1920" : "e.g. 120.5"}
			value={text}
			readOnlyValue={value === undefined ? undefined : `${value} ${unitSuffix}`}
			error={error}
			autoComplete="off"
			onChange={(event) => handleChange(event.target.value)}
		/>
	);
};

/* ========================================================================== */
/*                               Add-option bar                               */
/* ========================================================================== */

export const AddCustomArtworkTile = ({ onAdd }: { onAdd: () => void }) => (
	<article
		className="crf-tile crf-tile--custom crf-tile--custom-add"
		aria-label="Add custom artwork"
	>
		<span className="crf-custom-icon" aria-hidden="true">
			<PencilRuler />
		</span>

		<div className="crf-custom-add-text">
			<h4 className="crf-custom-title">Need a size that isn't listed?</h4>
			<p className="crf-custom-sub">
				Request a custom artwork — give the dimensions and describe what you
				need.
			</p>
		</div>

		<button type="button" className="crf-tile-add" onClick={onAdd}>
			<Plus aria-hidden="true" />
			<span>Add custom artwork</span>
		</button>
	</article>
);

/* ========================================================================== */
/*                             Custom artwork card                            */
/* ========================================================================== */

type CustomArtworkTileProps = {
	line: CrfLineItem;
	lineErrors?: LineErrors;
	readOnly: boolean;
	onPatch: (patch: Partial<CrfLineItem>) => void;
	/** Quantity stepper + remove button (rendered by CrfCatalog). */
	children?: React.ReactNode;
};

export const CustomArtworkTile = ({
	line,
	lineErrors,
	readOnly,
	onPatch,
	children,
}: CustomArtworkTileProps) => {
	const unit = (ARTWORK_UNITS as readonly string[]).includes(line.unit ?? "")
		? (line.unit as ArtworkUnit)
		: ARTWORK_UNIT;
	const wholeOnly = unit === ARTWORK_UNIT;
	const description = line.description ?? "";

	// Errors for fields shown elsewhere (quantity, …) — the inputs above carry
	// their own inline message.
	const otherErrors = lineErrors
		? Object.entries(lineErrors)
				.filter(
					([field, message]) =>
						message && !(OWN_FIELDS as readonly string[]).includes(field),
				)
				.map(([, message]) => message as string)
		: [];
	const hasError = Boolean(
		lineErrors && Object.values(lineErrors).some(Boolean),
	);

	return (
		<article
			className={[
				"crf-tile",
				"crf-tile--custom",
				"crf-tile--selected",
				hasError && "crf-tile--error",
			]
				.filter(Boolean)
				.join(" ")}
			aria-label={CUSTOM_ARTWORK_LABEL}
		>
			<header className="crf-custom-header">
				<span className="crf-custom-icon" aria-hidden="true">
					<PencilRuler />
				</span>
				<div>
					<h4 className="crf-custom-title">{CUSTOM_ARTWORK_LABEL}</h4>
					<p className="crf-custom-sub">
						Made to your size · priced by the marketing team
					</p>
				</div>
			</header>

			<div className="crf-custom-body">
				{/* ---------------------------- Dimensions ---------------------------- */}
				<div className="crf-custom-size">
					<DimensionInput
						id={`${line.value}-width`}
						label="Width"
						value={line.width}
						wholeOnly={wholeOnly}
						unitSuffix={unit}
						readOnly={readOnly}
						error={lineErrors?.width}
						onValue={(width) => onPatch({ width })}
					/>

					<DimensionInput
						id={`${line.value}-height`}
						label="Height"
						value={line.height}
						wholeOnly={wholeOnly}
						unitSuffix={unit}
						readOnly={readOnly}
						error={lineErrors?.height}
						onValue={(height) => onPatch({ height })}
					/>

					<div className="crf-custom-unit">
						<SelectInput
							inputId={`${line.value}-unit`}
							label="Unit"
							required
							mode={readOnly ? "view" : "edit"}
							isSearchable={false}
							options={UNIT_OPTIONS}
							value={UNIT_OPTIONS.find((option) => option.value === unit)}
							error={lineErrors?.unit}
							onChange={(option) => option && onPatch({ unit: option.value })}
						/>
					</div>
				</div>

				{/* --------------------------- Description --------------------------- */}
				<div className="crf-custom-desc">
					<TextareaInput
						id={`${line.value}-description`}
						label="Description"
						required
						rows={5}
						mode={readOnly ? "view" : "edit"}
						maxLength={CRF_LIMITS.MAX_DESCRIPTION}
						placeholder="What should the artwork show? Add text, branding, usage (screen, print, social) and any reference."
						value={description}
						error={lineErrors?.description}
						onChange={(event) => onPatch({ description: event.target.value })}
					/>
					{!readOnly ? (
						<span className="crf-custom-counter" aria-hidden="true">
							{description.length}/{CRF_LIMITS.MAX_DESCRIPTION}
						</span>
					) : null}
				</div>
			</div>

			{children ? (
				<footer className="crf-custom-footer">{children}</footer>
			) : null}

			{otherErrors.length > 0 ? (
				<ul className="crf-tile-errors" role="alert">
					{otherErrors.map((message) => (
						<li key={message}>{message}</li>
					))}
				</ul>
			) : null}
		</article>
	);
};
