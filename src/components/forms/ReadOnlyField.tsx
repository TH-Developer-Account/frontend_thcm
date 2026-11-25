// ReadOnlyField — one submitted value, shown for reading (view mode).
//
// Read-only is NOT disabled: the value is the point of the screen, so it is
// set in strong primary text on a soft neutral surface. Disabled inputs are
// grey with faded text and a not-allowed cursor.
//
// Every shared form control (FormInput, SelectInput, TextareaInput,
// PhoneInput) renders this in mode="view", so changes here reach every
// view screen in the app (CPP, Vendor Onboarding, EPC/EPF, ...).
//
// All props added in the design-system revamp are optional; existing call
// sites keep working unchanged.
import {
	createContext,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
} from "react";
import { Check, Copy } from "lucide-react";

import HelperTooltip from "../common/HelperTooltip";

/* ------------------------------------------------------------------------ */
/* Empty values                                                             */
/* ------------------------------------------------------------------------ */

/**
 * Why a value is missing. Each reason reads differently, so the viewer
 * never has to guess what an ambiguous "--" means. An actual zero is a
 * value, not an empty state: pass 0 and it is shown as 0.
 */
export type ReadOnlyEmptyReason =
	| "not-provided"
	| "not-applicable"
	| "unavailable"
	| "pending"
	| "error"
	| "loading";

export const READ_ONLY_EMPTY_LABELS: Record<ReadOnlyEmptyReason, string> = {
	"not-provided": "Not provided",
	"not-applicable": "Not applicable",
	unavailable: "Unavailable",
	pending: "Not yet calculated",
	error: "Failed to load",
	loading: "Loading…",
};

type ReadOnlyEmptyValueProps = {
	reason?: ReadOnlyEmptyReason;
	/** Overrides the reason's default wording. */
	children?: ReactNode;
	className?: string;
};

/** The empty-state text on its own, for table cells and custom layouts. */
export const ReadOnlyEmptyValue = ({
	reason = "not-provided",
	children,
	className,
}: ReadOnlyEmptyValueProps) => {
	if (reason === "loading") {
		return (
			<span
				className={joinClassNames("readonly-empty-loading", className)}
				role="status"
			>
				<span className="sr-only">{children ?? READ_ONLY_EMPTY_LABELS.loading}</span>
			</span>
		);
	}

	return (
		<span
			className={joinClassNames(
				"readonly-empty",
				`readonly-empty-${reason}`,
				className,
			)}
		>
			{children ?? READ_ONLY_EMPTY_LABELS[reason]}
		</span>
	);
};

/* ------------------------------------------------------------------------ */
/* Grid context: inside <ReadOnlyGrid> fields render as <dt>/<dd> pairs      */
/* ------------------------------------------------------------------------ */

const ReadOnlyGridContext = createContext(false);

type ReadOnlyGridProps = {
	/** Columns at desktop width. Collapses to 2 on tablets and 1 on phones. */
	columns?: 1 | 2 | 3 | 4;
	/** Plain label-over-value layout (default) or boxed values. */
	variant?: "plain" | "boxed";
	className?: string;
	"aria-label"?: string;
	children: ReactNode;
};

/**
 * Key-value grid for submitted data. Renders a <dl>, so screen readers
 * announce each label with its value.
 *
 *   <ReadOnlyGrid columns={3}>
 *     <ReadOnlyField label="Vendor code" value={code} copyable />
 *     <ReadOnlyField label="Remarks" value={remarks} valueType="multiline" fullWidth />
 *   </ReadOnlyGrid>
 */
export const ReadOnlyGrid = ({
	columns = 3,
	variant = "plain",
	className,
	children,
	...rest
}: ReadOnlyGridProps) => (
	<ReadOnlyGridContext.Provider value>
		<dl
			className={joinClassNames(
				"readonly-grid",
				variant === "plain" && "readonly-grid-plain",
				className,
			)}
			style={{ "--readonly-grid-cols": columns } as CSSProperties}
			aria-label={rest["aria-label"]}
		>
			{children}
		</dl>
	</ReadOnlyGridContext.Provider>
);

/* ------------------------------------------------------------------------ */
/* Field                                                                    */
/* ------------------------------------------------------------------------ */

export type ReadOnlyValueType =
	| "text"
	| "numeric"
	| "currency"
	| "date"
	| "multiline";

export type ReadOnlyFieldProps = {
	id?: string;
	label?: string;
	value?: ReactNode;
	/**
	 * Several values (selected plants, models, effects). Shown as chips
	 * instead of one comma-joined string. Takes precedence over `value`.
	 */
	values?: ReadonlyArray<ReactNode>;
	/**
	 * Kept for API compatibility. The required asterisk is an editing cue, so
	 * view mode no longer shows it unless `showRequired` is set.
	 */
	required?: boolean;
	showRequired?: boolean;
	helperText?: string;
	isTooltip?: boolean;
	/** Why the value is missing. Default "not-provided". */
	emptyReason?: ReadOnlyEmptyReason;
	/** Custom empty content. Overrides `emptyReason`. */
	emptyValue?: ReactNode;
	/** numeric / currency / date use tabular figures; multiline wraps and scrolls. */
	valueType?: ReadOnlyValueType;
	/** Shows a copy button. Pass a string to copy something other than the shown text. */
	copyable?: boolean | string;
	/** "boxed" (default outside a grid): soft surface. "plain": label over value, no box. */
	variant?: "boxed" | "plain";
	/** Spans every column inside <ReadOnlyGrid>. */
	fullWidth?: boolean;
	className?: string;
	valueClassName?: string;
};

function joinClassNames(
	...classes: Array<string | false | null | undefined>
): string {
	return classes.filter(Boolean).join(" ");
}

const hasDisplayValue = (value: ReactNode): boolean => {
	if (value === null || value === undefined || value === false) {
		return false;
	}

	if (typeof value === "string") {
		return value.trim().length > 0;
	}

	if (Array.isArray(value)) {
		return value.some(hasDisplayValue);
	}

	return true;
};

const toCopyText = (value: ReactNode): string | undefined => {
	if (typeof value === "string") return value;
	if (typeof value === "number") return String(value);
	return undefined;
};

const VALUE_TYPE_CLASS: Record<ReadOnlyValueType, string | undefined> = {
	text: undefined,
	numeric: "form-readonly-value-numeric",
	currency: "form-readonly-value-numeric form-readonly-value-currency",
	date: "form-readonly-value-numeric",
	multiline: "form-readonly-value-multiline",
};

type CopyState = "idle" | "copied" | "failed";

const CopyValueButton = ({
	text,
	label,
}: {
	text: string;
	label?: string;
}) => {
	const [state, setState] = useState<CopyState>("idle");
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[],
	);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setState("copied");
		} catch {
			setState("failed");
		}
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setState("idle"), 2000);
	};

	const name = label ? `Copy ${label}` : "Copy value";
	const title =
		state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : name;

	return (
		<button
			type="button"
			className={joinClassNames(
				"form-readonly-copy",
				state === "copied" && "is-copied",
			)}
			onClick={() => void copy()}
			aria-label={name}
			title={title}
		>
			{state === "copied" ? (
				<Check size={14} aria-hidden="true" />
			) : (
				<Copy size={14} aria-hidden="true" />
			)}
			<span className="sr-only" aria-live="polite">
				{state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : ""}
			</span>
		</button>
	);
};

const ReadOnlyField = ({
	id,
	label,
	value,
	values,
	required = false,
	showRequired = false,
	helperText,
	isTooltip = true,
	emptyReason = "not-provided",
	emptyValue,
	valueType = "text",
	copyable = false,
	variant,
	fullWidth = false,
	className,
	valueClassName,
}: ReadOnlyFieldProps) => {
	const inGrid = useContext(ReadOnlyGridContext);
	const autoId = useId();
	const baseId = id ?? `readonly-${autoId.replace(/:/g, "")}`;
	const labelId = `${baseId}-label`;
	const helperId = `${baseId}-helper`;

	const chipValues = values?.filter(hasDisplayValue) ?? [];
	const hasChips = chipValues.length > 0;
	const hasValue = hasChips || (!values && hasDisplayValue(value));

	const resolvedVariant = variant ?? (inGrid ? undefined : "boxed");

	const content: ReactNode = hasChips ? (
		<ul className="form-readonly-chips">
			{chipValues.map((chip, index) => (
				<li key={typeof chip === "string" ? chip : index} className="form-readonly-chip">
					{chip}
				</li>
			))}
		</ul>
	) : hasValue ? (
		value
	) : (
		<ReadOnlyEmptyValue reason={emptyReason}>{emptyValue}</ReadOnlyEmptyValue>
	);

	const copyText =
		hasValue && copyable
			? typeof copyable === "string"
				? copyable
				: toCopyText(value)
			: undefined;

	// Native tooltip only for plain text that may be cut off.
	const title = hasValue && !hasChips ? toCopyText(value) : undefined;

	const valueClasses = joinClassNames(
		"form-readonly-value",
		resolvedVariant === "plain" && "form-readonly-value-plain",
		VALUE_TYPE_CLASS[valueType],
		hasChips && "form-readonly-value-chips",
		!hasValue && "is-empty",
		copyText && "has-copy",
		valueClassName,
	);

	const labelContent = label ? (
		<>
			{label}
			{required && showRequired ? (
				<span className="form-required" aria-hidden="true">
					*
				</span>
			) : null}
		</>
	) : null;

	const tooltip =
		helperText && isTooltip && label ? (
			<HelperTooltip label={label} text={helperText} />
		) : null;

	const inlineHelper =
		helperText && !isTooltip ? (
			<p id={helperId} className="form-helper-text">
				{helperText}
			</p>
		) : null;

	const valueBody = (
		<>
			<span className="form-readonly-value-text">{content}</span>
			{copyText ? <CopyValueButton text={copyText} label={label} /> : null}
		</>
	);

	const wrapperClasses = joinClassNames(
		"form-field",
		"form-readonly-field",
		fullWidth && "readonly-span-full",
		className,
	);

	/* Inside <ReadOnlyGrid>: a <div> holding a <dt>/<dd> pair (valid inside <dl>). */
	if (inGrid) {
		return (
			<div className={wrapperClasses}>
				{label ? (
					<dt className="form-label-row">
						<span className="form-label" id={labelId}>
							{labelContent}
						</span>
						{tooltip}
					</dt>
				) : null}
				<dd
					className={valueClasses}
					title={title}
					aria-describedby={inlineHelper ? helperId : undefined}
				>
					{valueBody}
				</dd>
				{inlineHelper}
			</div>
		);
	}

	return (
		<div
			className={wrapperClasses}
			role={label ? "group" : undefined}
			aria-labelledby={label ? labelId : undefined}
			aria-describedby={inlineHelper ? helperId : undefined}
		>
			{label ? (
				<div className="form-label-row">
					<span className="form-label" id={labelId}>
						{labelContent}
					</span>
					{tooltip}
				</div>
			) : null}

			<div className={valueClasses} title={title}>
				{valueBody}
			</div>

			{inlineHelper}
		</div>
	);
};

export default ReadOnlyField;
