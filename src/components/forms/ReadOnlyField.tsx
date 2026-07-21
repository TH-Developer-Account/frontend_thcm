import type { ReactNode } from "react";

import HelperTooltip from "../common/HelperTooltip";

export type ReadOnlyFieldProps = {
	label?: string;
	value?: ReactNode;
	required?: boolean;
	helperText?: string;
	isTooltip?: boolean;
	emptyValue?: ReactNode;
	className?: string;
	valueClassName?: string;
};

const joinClassNames = (
	...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(" ");

const hasDisplayValue = (value: ReactNode): boolean => {
	if (value === null || value === undefined) {
		return false;
	}

	if (typeof value === "string") {
		return value.trim().length > 0;
	}

	return true;
};

const ReadOnlyField = ({
	label,
	value,
	required = false,
	helperText,
	isTooltip = true,
	emptyValue = "--",
	className,
	valueClassName,
}: ReadOnlyFieldProps) => {
	const resolvedValue = hasDisplayValue(value) ? value : emptyValue;

	const title = typeof resolvedValue === "string" ? resolvedValue : undefined;

	return (
		<div
			className={joinClassNames("form-field", "form-readonly-field", className)}
			aria-readonly="true"
		>
			{label ? (
				<div className="form-label-row">
					<div className="form-label">
						{label}

						{required ? (
							<span className="form-required" aria-hidden="true">
								*
							</span>
						) : null}
					</div>

					{helperText && isTooltip ? (
						<HelperTooltip label={label} text={helperText} />
					) : null}
				</div>
			) : null}

			<div
				className={joinClassNames("form-readonly-value", valueClassName)}
				title={title}
			>
				{resolvedValue}
			</div>

			{helperText && !isTooltip ? (
				<p className="form-helper-text">{helperText}</p>
			) : null}
		</div>
	);
};

export default ReadOnlyField;
