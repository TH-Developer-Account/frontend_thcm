import { useEffect, useId, useRef, type RefObject } from "react";
import { AlertCircle } from "lucide-react";

import { flattenFieldErrors, focusFieldByName } from "../../utils/focusField";

type FieldMeta = {
	/** Field name / dot path as registered in the form (e.g. "vendorCode", "items.0.amount"). */
	name: string;
	/** Human label shown in the summary. Falls back to the field name. */
	label: string;
};

export type FormValidationSummaryProps = {
	/**
	 * react-hook-form `formState.errors`, or a plain { field: "message" } record.
	 * The component only reads it and never changes validation.
	 */
	errors: unknown;
	/**
	 * Field order and labels. Errors are listed in this order; errors for
	 * fields not listed here follow in the order they appear.
	 */
	fields?: ReadonlyArray<FieldMeta>;
	/** Element that contains the fields (usually the <form>). Defaults to document. */
	scopeRef?: RefObject<HTMLElement | null>;
	title?: string;
	/**
	 * Move keyboard focus to the summary when it appears (e.g. after a failed
	 * submit). Pass the form's submitCount so it re-focuses on every attempt.
	 */
	focusKey?: number;
	className?: string;
};

/**
 * Section-level error summary for long or multi-section forms.
 * Each item is a link-style button that scrolls to and focuses its field.
 * Renders nothing when there are no errors.
 */
export default function FormValidationSummary({
	errors,
	fields,
	scopeRef,
	title,
	focusKey,
	className = "",
}: FormValidationSummaryProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const titleId = `${useId()}-validation-summary-title`;

	const flat = flattenFieldErrors(errors);
	const labelOf = new Map(fields?.map((field) => [field.name, field.label]));
	const order = new Map(fields?.map((field, index) => [field.name, index]));

	const items = [...flat].sort(
		(a, b) =>
			(order.get(a.name) ?? Number.MAX_SAFE_INTEGER) -
			(order.get(b.name) ?? Number.MAX_SAFE_INTEGER),
	);

	const count = items.length;

	useEffect(() => {
		if (focusKey && count > 0) containerRef.current?.focus();
		// Focus only when a new submit attempt happens, not on every keystroke.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [focusKey]);

	if (count === 0) return null;

	const heading =
		title ??
		(count === 1
			? "1 field needs your attention"
			: `${count} fields need your attention`);

	return (
		<div
			ref={containerRef}
			className={["form-validation-summary", className].filter(Boolean).join(" ")}
			role="alert"
			aria-labelledby={titleId}
			tabIndex={-1}
		>
			<div className="form-validation-summary-header">
				<AlertCircle aria-hidden="true" className="form-validation-summary-icon" />
				<p id={titleId} className="form-validation-summary-title">
					{heading}
				</p>
			</div>

			<ul className="form-validation-summary-list">
				{items.map((item) => (
					<li key={item.name}>
						<button
							type="button"
							className="form-validation-summary-link"
							onClick={() => focusFieldByName(scopeRef?.current ?? null, item.name)}
						>
							<span className="form-validation-summary-field">
								{labelOf.get(item.name) ?? item.name}
							</span>
							<span className="form-validation-summary-message">{item.message}</span>
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}
