// crf/core/CustomArtwork.tsx
// "Artwork request" form for the Artworks tab.
//
// Flow:  Artwork (product)  →  Type of artwork  →  then the rest appears:
//        Unit, Width, Height, Label, Description, and reference images
//        (image files only, 5 MB each, max 5, each with its own description).
// A request may be one of many: every "Add artwork request" adds another card.
// It is a normal CRF line
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
import { ImagePlus, PencilRuler, Plus, Trash2 } from "lucide-react";

import FormInput from "../../../../components/forms/FormInput";
import SelectInput from "../../../../components/forms/SelectInput";
import TextareaInput from "../../../../components/forms/TextareaInput";

import { useUploadArtworkAttachmentMutation } from "./api";
import {
	ARTWORK_UNIT,
	ARTWORK_UNITS,
	CRF_LIMITS,
	sanitizeDecimalInput,
	type ArtworkUnit,
	type CrfFormErrors,
} from "./schema";
import type { LineItemOption } from "../../shared/lineItem.types";
import {
	ARTWORK_ATTACHMENT_LIMITS,
	ARTWORK_CUSTOM_PRESET,
	ARTWORK_TYPES,
	CUSTOM_ARTWORK_ID_PREFIX,
	CUSTOM_ARTWORK_LABEL,
	type ArtworkType,
	type CrfArtworkAttachment,
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
const OWN_FIELDS = [
	"width",
	"height",
	"unit",
	"description",
	"label",
	"artworkProductId",
	"artworkType",
	"attachments",
] as const;

const TYPE_OPTIONS = ARTWORK_TYPES.map((type) => ({
	value: type.value,
	label: type.label,
}));

const formatFileSize = (bytes: number) =>
	bytes >= 1024 * 1024
		? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
		: `${Math.max(1, Math.round(bytes / 1024))} KB`;

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
		// Typed by the requester on the form (required there).
		label: "",
		particular: value,
		description: "",
		category: "ARTWORK",
		isCustom: true,
		artworkProductId: null,
		artworkProductName: null,
		artworkType: null,
		attachments: [],

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
/*                          Reference images (attachments)                    */
/* ========================================================================== */

type AttachmentsFieldProps = {
	idPrefix: string;
	attachments: CrfArtworkAttachment[];
	helper: string;
	error?: string;
	readOnly: boolean;
	onChange: (attachments: CrfArtworkAttachment[]) => void;
};

/**
 * Image-only uploader. Each file is uploaded the moment it is picked (the CRF
 * save replaces every line, so files can't travel with it) and only its
 * storage key is kept on the line.
 */
const AttachmentsField = ({
	idPrefix,
	attachments,
	helper,
	error,
	readOnly,
	onChange,
}: AttachmentsFieldProps) => {
	const upload = useUploadArtworkAttachmentMutation();
	const inputRef = React.useRef<HTMLInputElement>(null);
	const [problem, setProblem] = React.useState<string>();

	const remaining = ARTWORK_ATTACHMENT_LIMITS.MAX_FILES - attachments.length;

	const handleFiles = async (picked: FileList | null) => {
		if (!picked || picked.length === 0) return;
		setProblem(undefined);

		const files = Array.from(picked);
		const messages: string[] = [];
		const accepted: File[] = [];

		for (const file of files) {
			if (!(ARTWORK_ATTACHMENT_LIMITS.ACCEPT as readonly string[]).includes(file.type)) {
				messages.push(`${file.name}: only JPG, PNG or WebP images are allowed.`);
			} else if (file.size > ARTWORK_ATTACHMENT_LIMITS.MAX_BYTES) {
				messages.push(`${file.name}: larger than 5 MB.`);
			} else if (accepted.length >= remaining) {
				messages.push(
					`Only ${ARTWORK_ATTACHMENT_LIMITS.MAX_FILES} images can be attached.`,
				);
				break;
			} else {
				accepted.push(file);
			}
		}

		// Accumulate locally: the line prop doesn't update between awaits.
		let next = attachments;
		for (const file of accepted) {
			try {
				const saved = await upload.mutateAsync(file);
				next = [
					...next,
					{
						key: saved.key,
						fileName: saved.fileName || file.name,
						sizeBytes: saved.sizeBytes || file.size,
						description: "",
						url: saved.url,
					},
				];
				onChange(next);
			} catch {
				messages.push(`${file.name}: upload failed. Try again.`);
			}
		}

		if (messages.length > 0) setProblem(messages.join(" "));
		if (inputRef.current) inputRef.current.value = "";
	};

	if (readOnly && attachments.length === 0) return null;

	return (
		<div className="crf-custom-attach">
			<div className="crf-custom-attach-head">
				<strong className="crf-custom-attach-title">
					Reference images{" "}
					<span className="crf-custom-attach-count">
						{attachments.length}/{ARTWORK_ATTACHMENT_LIMITS.MAX_FILES}
					</span>
				</strong>

				{!readOnly ? (
					<>
						<input
							ref={inputRef}
							id={`${idPrefix}-files`}
							type="file"
							hidden
							multiple
							accept={ARTWORK_ATTACHMENT_LIMITS.ACCEPT.join(",")}
							onChange={(event) => void handleFiles(event.target.files)}
						/>
						<button
							type="button"
							className="crf-custom-attach-btn"
							disabled={remaining <= 0 || upload.isPending}
							onClick={() => inputRef.current?.click()}
						>
							<ImagePlus aria-hidden="true" />
							<span>{upload.isPending ? "Uploading…" : "Add images"}</span>
						</button>
					</>
				) : null}
			</div>

			{!readOnly ? <p className="crf-custom-hint">{helper}</p> : null}

			{attachments.length > 0 ? (
				<ul className="crf-custom-attach-list">
					{attachments.map((file, position) => (
						<li key={file.key} className="crf-custom-attach-row">
							{file.url ? (
								<img
									className="crf-custom-attach-thumb"
									src={file.url}
									alt={file.fileName}
								/>
							) : (
								<span className="crf-custom-attach-thumb crf-custom-attach-thumb--empty">
									<ImagePlus aria-hidden="true" />
								</span>
							)}

							<div className="crf-custom-attach-meta">
								<span className="crf-custom-attach-name" title={file.fileName}>
									{file.fileName}
								</span>
								<small>{formatFileSize(file.sizeBytes)}</small>
							</div>

							<div className="crf-custom-attach-desc">
								<FormInput
									id={`${idPrefix}-file-${position}-desc`}
									aria-label={`Description for ${file.fileName}`}
									placeholder="What does this image show?"
									mode={readOnly ? "view" : "edit"}
									maxLength={ARTWORK_ATTACHMENT_LIMITS.MAX_DESCRIPTION}
									value={file.description}
									onChange={(event) =>
										onChange(
											attachments.map((existing) =>
												existing.key === file.key
													? { ...existing, description: event.target.value }
													: existing,
											),
										)
									}
								/>
							</div>

							{!readOnly ? (
								<button
									type="button"
									className="crf-custom-attach-remove"
									aria-label={`Remove ${file.fileName}`}
									onClick={() =>
										onChange(attachments.filter((existing) => existing.key !== file.key))
									}
								>
									<Trash2 aria-hidden="true" />
								</button>
							) : null}
						</li>
					))}
				</ul>
			) : null}

			{problem || error ? (
				<p className="crf-custom-attach-error" role="alert">
					{problem ?? error}
				</p>
			) : null}
		</div>
	);
};

/* ========================================================================== */
/*                               Add-option bar                               */
/* ========================================================================== */

export const AddCustomArtworkTile = ({ onAdd }: { onAdd: () => void }) => (
	<article
		className="crf-tile crf-tile--custom crf-tile--custom-add"
		aria-label="Add artwork request"
	>
		<span className="crf-custom-icon" aria-hidden="true">
			<PencilRuler />
		</span>

		<div className="crf-custom-add-text">
			<h4 className="crf-custom-title">Need an artwork made?</h4>
			<p className="crf-custom-sub">
				Pick the artwork and its type, give the size, describe what you need
				and attach references. You can add more than one request.
			</p>
		</div>

		<button type="button" className="crf-tile-add" onClick={onAdd}>
			<Plus aria-hidden="true" />
			<span>Add artwork request</span>
		</button>
	</article>
);

/* ========================================================================== */
/*                             Custom artwork card                            */
/* ========================================================================== */

type CustomArtworkTileProps = {
	line: CrfLineItem;
	/** ARTWORK products from the product master — the "Artwork" dropdown. */
	productOptions?: LineItemOption[];
	lineErrors?: LineErrors;
	readOnly: boolean;
	onPatch: (patch: Partial<CrfLineItem>) => void;
	/** Quantity stepper + remove button (rendered by CrfCatalog). */
	children?: React.ReactNode;
};

export const CustomArtworkTile = ({
	line,
	productOptions = [],
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
	const attachments = line.attachments ?? [];

	// Lines saved before the request form existed have no product / type; show
	// the whole form for them straight away instead of hiding it behind two
	// dropdowns they were never asked to fill.
	const isLegacy = Boolean(line.id) && !line.artworkProductId && !line.artworkType;
	const showDetails =
		readOnly || isLegacy || Boolean(line.artworkProductId && line.artworkType);

	const productSelectOptions = productOptions.map((option) => ({
		value: option.value,
		label: option.label,
	}));
	const selectedType = ARTWORK_TYPES.find((type) => type.value === line.artworkType);
	const attachHelper =
		line.artworkType === "CUSTOM"
			? "Custom artwork: attach sketches, mood boards, logos or any layout you have in mind. JPG, PNG or WebP, up to 5 MB each, max 5 images."
			: "Optional: attach reference images. JPG, PNG or WebP, up to 5 MB each, max 5 images.";

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
			aria-label={line.label?.trim() || "Artwork request"}
		>
			<header className="crf-custom-header">
				<span className="crf-custom-icon" aria-hidden="true">
					<PencilRuler />
				</span>
				<div>
					<h4 className="crf-custom-title">
						{line.label?.trim() || "Artwork request"}
					</h4>
					<p className="crf-custom-sub">
						{[line.artworkProductName, selectedType?.label]
							.filter(Boolean)
							.join(" · ") || "Made to your brief · prepared by the artwork team"}
					</p>
				</div>
			</header>

			<div className="crf-custom-body">
				{/* ------------------- 1. Artwork  →  2. Type of artwork ------------------- */}
				{!isLegacy ? (
					<div className="crf-custom-pick">
						<SelectInput
							inputId={`${line.value}-product`}
							label="Artwork"
							required
							mode={readOnly ? "view" : "edit"}
							placeholder="Select an artwork"
							options={productSelectOptions}
							value={
								productSelectOptions.find(
									(option) => option.value === line.artworkProductId,
								) ?? null
							}
							error={lineErrors?.artworkProductId}
							onChange={(option) =>
								onPatch({
									artworkProductId: option?.value ?? null,
									artworkProductName: option?.label ?? null,
								})
							}
						/>

						<div>
							<SelectInput
								inputId={`${line.value}-type`}
								label="Type of artwork"
								required
								mode={readOnly ? "view" : "edit"}
								isSearchable={false}
								placeholder="Select the type"
								options={TYPE_OPTIONS}
								value={
									TYPE_OPTIONS.find((option) => option.value === line.artworkType) ??
									null
								}
								error={lineErrors?.artworkType}
								onChange={(option) =>
									onPatch({
										artworkType: (option?.value as ArtworkType | undefined) ?? null,
									})
								}
							/>
							{!readOnly && selectedType ? (
								<p className="crf-custom-hint">{selectedType.hint}</p>
							) : null}
						</div>
					</div>
				) : null}

				{!showDetails ? (
					<p className="crf-custom-hint crf-custom-hint--pending">
						Choose the artwork and its type to continue.
					</p>
				) : (
					<>
						{/* ------------------ Unit, Width, Height ------------------ */}
						<div className="crf-custom-size">
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
						</div>

						{/* ------------------------ Label ------------------------ */}
						<FormInput
							id={`${line.value}-label`}
							label="Label"
							required={!isLegacy}
							mode={readOnly ? "view" : "edit"}
							maxLength={CRF_LIMITS.MAX_LABEL}
							placeholder="A short name, e.g. Stage backdrop – Mysuru dealer meet"
							value={line.label === CUSTOM_ARTWORK_LABEL ? "" : (line.label ?? "")}
							error={lineErrors?.label}
							autoComplete="off"
							onChange={(event) => onPatch({ label: event.target.value })}
						/>

						{/* --------------------- Description --------------------- */}
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

						{/* ------------------ Reference images ------------------- */}
						<AttachmentsField
							idPrefix={line.value}
							attachments={attachments}
							helper={attachHelper}
							error={lineErrors?.attachments}
							readOnly={readOnly}
							onChange={(next) => onPatch({ attachments: next })}
						/>
					</>
				)}
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
