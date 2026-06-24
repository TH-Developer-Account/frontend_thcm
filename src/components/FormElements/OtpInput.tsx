import React, { useEffect, useRef, useState } from "react";
import type { OtpInputProps } from "./input.types";

const createOtpValue = (currentValue: string | undefined, length: number) => {
	const chars = currentValue?.split("").slice(0, length) ?? [];

	return [...chars, ...Array(Math.max(length - chars.length, 0)).fill("")];
};

const OtpInput: React.FC<OtpInputProps> = ({
	name = "otp",
	length = 6,
	value,
	error,
	className = "",
	timerSeconds = 30,
	onTimerChange,
	onChange,
}) => {
	const inputsRef = useRef<HTMLInputElement[]>([]);

	const [internalOtp, setInternalOtp] = useState<string[]>(() =>
		createOtpValue(value, length),
	);

	const [timerState, setTimerState] = useState(() => ({
		configuredSeconds: timerSeconds,
		secondsLeft: timerSeconds,
	}));

	/*
	 * Controlled mode derives directly from `value`, so no synchronising effect
	 * or cascading render is needed. Without `value`, the component keeps its
	 * own local OTP state.
	 */
	const otp =
		value !== undefined
			? createOtpValue(value, length)
			: createOtpValue(internalOtp.join(""), length);

	/*
	 * React permits adjusting state during render when a prop changes, provided
	 * it is guarded like this. This avoids calling setState synchronously inside
	 * an effect while still resetting the timer when timerSeconds changes.
	 */
	if (timerState.configuredSeconds !== timerSeconds) {
		setTimerState({
			configuredSeconds: timerSeconds,
			secondsLeft: timerSeconds,
		});
	}

	const secondsLeft = timerState.secondsLeft;

	useEffect(() => {
		onTimerChange?.(secondsLeft, secondsLeft > 0);
	}, [secondsLeft, onTimerChange]);

	useEffect(() => {
		if (secondsLeft <= 0) return;

		const timeoutId = window.setTimeout(() => {
			setTimerState((previous) => ({
				...previous,
				secondsLeft: Math.max(previous.secondsLeft - 1, 0),
			}));
		}, 1000);

		return () => window.clearTimeout(timeoutId);
	}, [secondsLeft]);

	const commitOtp = (nextOtp: string[]) => {
		if (value === undefined) {
			setInternalOtp(nextOtp);
		}

		onChange(nextOtp.join(""));
	};

	const handleChange = (inputValue: string, index: number) => {
		if (!/^\d?$/.test(inputValue)) return;

		const nextOtp = [...otp];
		nextOtp[index] = inputValue;
		commitOtp(nextOtp);

		if (inputValue && index < length - 1) {
			inputsRef.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (
		event: React.KeyboardEvent<HTMLInputElement>,
		index: number,
	) => {
		if (event.key === "Backspace" && !otp[index] && index > 0) {
			inputsRef.current[index - 1]?.focus();
		}

		if (event.key === "ArrowLeft" && index > 0) {
			event.preventDefault();
			inputsRef.current[index - 1]?.focus();
		}

		if (event.key === "ArrowRight" && index < length - 1) {
			event.preventDefault();
			inputsRef.current[index + 1]?.focus();
		}
	};

	const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
		const pastedDigits = event.clipboardData
			.getData("text")
			.replace(/\D/g, "")
			.slice(0, length);

		if (!pastedDigits) return;

		event.preventDefault();

		const nextOtp = createOtpValue(pastedDigits, length);
		commitOtp(nextOtp);

		const focusIndex = Math.min(pastedDigits.length, length) - 1;
		inputsRef.current[Math.max(focusIndex, 0)]?.focus();
	};

	const errorId = error ? `${name}-error` : undefined;
	const timerId = `${name}-timer`;

	return (
		<div className={`otp-wrapper ${className}`.trim()}>
			<div
				className="otp-container"
				role="group"
				aria-label="One-time password"
				onPaste={handlePaste}
			>
				{otp.map((digit, index) => (
					<input
						key={`${name}-${index}`}
						id={`${name}-${index}`}
						ref={(element) => {
							if (element) inputsRef.current[index] = element;
						}}
						type="text"
						inputMode="numeric"
						autoComplete={index === 0 ? "one-time-code" : "off"}
						pattern="[0-9]*"
						maxLength={1}
						value={digit}
						aria-label={`OTP digit ${index + 1} of ${length}`}
						aria-invalid={Boolean(error)}
						aria-describedby={[errorId, timerId].filter(Boolean).join(" ")}
						onChange={(event) => handleChange(event.target.value, index)}
						onKeyDown={(event) => handleKeyDown(event, index)}
						className={`otp-input ${error ? "otp-error" : "otp-normal"}`}
					/>
				))}
			</div>

			{error && (
				<p id={errorId} className="otp-error-text" role="alert">
					{error}
				</p>
			)}

			<p id={timerId} className="otp-timer" aria-live="polite">
				{secondsLeft > 0
					? `Resend OTP in ${secondsLeft}s`
					: "You can resend the OTP now"}
			</p>
		</div>
	);
};

export default OtpInput;
