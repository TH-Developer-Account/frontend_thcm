import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

import HelperTooltip from "../common/HelperTooltip";

/*
 * Shared building blocks for every form control (FormInput, SelectInput,
 * TextareaInput, …). One place owns the label row, the required / optional
 * markers, the helper tooltip and the message under the field, so they look
 * and behave the same everywhere.
 *
 * Message priority under a field: error > warning > helper text.
 */

export const joinClassNames = (
	...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(" ");

type FieldA11yInput = {
	fieldId: string;
	error?: string;
	warning?: string;
	helperText?: string;
	isTooltip?: boolean;
};

export type FieldA11y = {
	errorId: string;
	warningId: string;
	helperId: string;
	tooltipId: string;
	/** Space-separated ids for the control's aria-describedby (undefined when empty). */
	describedBy: string | undefined;
	/** Error wins; a warning is only shown when there is no error. */
	visibleWarning: string | undefined;
};

/**
 * Ids and aria-describedby for a field. The helper text is announced whether
 * it is shown as a tooltip or inline. Before, tooltip help was not linked to
 * the control, so screen readers never read it.
 */
export const getFieldA11y = ({
	fieldId,
	error,
	warning,
	helperText,
	isTooltip = true,
}: FieldA11yInput): FieldA11y => {
	const errorId = `${fieldId}-error`;
	const warningId = `${fieldId}-warning`;
	const helperId = `${fieldId}-helper`;
	const tooltipId = `${fieldId}-tooltip`;
	const visibleWarning = !error && warning ? warning : undefined;

	const ids = [
		error ? errorId : undefined,
		visibleWarning ? warningId : undefined,
		helperText && !isTooltip ? helperId : undefined,
		helperText && isTooltip && !error ? tooltipId : undefined,
	].filter(Boolean);

	return {
		errorId,
		warningId,
		helperId,
		tooltipId,
		describedBy: ids.length ? ids.join(" ") : undefined,
		visibleWarning,
	};
};

type FieldLabelProps = {
	htmlFor: string;
	label?: ReactNode;
	required?: boolean;
	/**
	 * Marks the field as optional. `true` shows "(optional)"; a string
	 * replaces that text. Ignored when `required` is set.
	 */
	optional?: boolean | string;
	helperText?: string;
	isTooltip?: boolean;
	/** Tooltip is hidden while an error is shown (existing behaviour). */
	hasError?: boolean;
	tooltipId?: string;
};

export function FieldLabel({
	htmlFor,
	label,
	required = false,
	optional,
	helperText,
	isTooltip = true,
	hasError = false,
	tooltipId,
}: FieldLabelProps) {
	if (!label) return null;

	const optionalText =
		!required && optional
			? typeof optional === "string"
				? optional
				: "(optional)"
			: null;

	return (
		<div className="form-label-row">
			<label htmlFor={htmlFor} className="form-label">
				{label}

				{required ? (
					<span className="form-required" aria-hidden="true">
						*
					</span>
				) : null}

				{optionalText ? (
					<span className="form-optional">{optionalText}</span>
				) : null}
			</label>

			{helperText && isTooltip && !hasError ? (
				<HelperTooltip
					label={typeof label === "string" ? label : undefined}
					text={helperText}
					descriptionId={tooltipId}
				/>
			) : null}
		</div>
	);
}

type FieldMessageProps = {
	a11y: FieldA11y;
	error?: string;
	helperText?: string;
	isTooltip?: boolean;
};

/** The single line under a field: error, else warning, else inline helper text. */
export function FieldMessage({
	a11y,
	error,
	helperText,
	isTooltip = true,
}: FieldMessageProps) {
	if (error) {
		return (
			<p id={a11y.errorId} className="form-error-text" role="alert">
				{error}
			</p>
		);
	}

	if (a11y.visibleWarning) {
		return (
			<p id={a11y.warningId} className="form-warning-text" role="status">
				<AlertTriangle aria-hidden="true" className="form-warning-icon" />
				<span>{a11y.visibleWarning}</span>
			</p>
		);
	}

	if (helperText && !isTooltip) {
		return (
			<p id={a11y.helperId} className="form-helper-text">
				{helperText}
			</p>
		);
	}

	return null;
}
