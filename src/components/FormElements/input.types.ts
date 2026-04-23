import type { InputHTMLAttributes, ReactNode } from "react";
import React, { type TextareaHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
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
	// rightElement?: React.ReactNode; // for filters / buttons
};

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	name: string;
	label?: string;
	placeholder?: string;
	value?: string;
	error?: string;
	className?: string;
}
