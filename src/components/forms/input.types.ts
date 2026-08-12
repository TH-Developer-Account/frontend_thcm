import type { InputHTMLAttributes, ReactNode } from "react";
import React, { type TextareaHTMLAttributes } from "react";

export type FormFieldMode = "edit" | "view";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
	isTooltip?: boolean;

	/**
	 * "edit" renders the native input.
	 * "view" renders a formatted read-only value.
	 */
	mode?: FormFieldMode;

	/**
	 * Optional display value used only in view mode.
	 * Useful for formatted dates, currency, mapped codes, etc.
	 */
	readOnlyValue?: ReactNode;

	/**
	 * Value shown when view mode has no usable value.
	 */
	emptyReadOnlyValue?: ReactNode;
	success?: boolean;
}

export interface CheckboxProps {
	checked?: boolean;
	indeterminate?: boolean;
	disabled?: boolean;
	size?: number;
	color?: string;
	className?: string;
	style?: React.CSSProperties;
	onChange?: (checked: boolean) => void;
	success?: boolean;
}

export interface Option {
	label: string;
	value: string;
}

export interface OtpInputProps {
	name?: string;
	length?: number;
	value?: string;
	error?: string;
	className?: string;
	timerSeconds?: number;
	onTimerChange?: (secondsLeft: number, isActive: boolean) => void;
	onChange: (otp: string) => void;
}

export type SearchBoxProps = {
	value: string;
	onChange: (value: string) => void;
	onClear?: () => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	containerClassName?: string;
	success?: boolean;
	// rightElement?: React.ReactNode; // for filters / buttons
};

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	error?: string;
	helperText?: string;
	isTooltip?: boolean;

	mode?: FormFieldMode;
	success?: boolean;
	/**
	 * Optional formatted content displayed in view mode.
	 * When omitted, the textarea value is displayed.
	 */
	readOnlyValue?: ReactNode;

	/**
	 * Fallback displayed when the view-mode value is empty.
	 */
	emptyReadOnlyValue?: ReactNode;
}
