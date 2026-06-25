import React, { useEffect, useRef, useState } from "react";
import type { OtpInputProps } from "./input.types";

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

	const [otp, setOtp] = useState<string[]>(() => {
		const chars = value?.split("").slice(0, length) ?? [];
		return [...chars, ...Array(length - chars.length).fill("")];
	});

	const [secondsLeft, setSecondsLeft] = useState(timerSeconds);

	useEffect(() => {
		if (secondsLeft <= 0) {
			onTimerChange?.(0, false);
			return;
		}

		onTimerChange?.(secondsLeft, true);

		const interval = setInterval(() => {
			setSecondsLeft((prev) => prev - 1);
		}, 1000);

		return () => clearInterval(interval);
	}, [secondsLeft, onTimerChange]);

	const handleChange = (val: string, index: number) => {
		if (!/^[0-9]?$/.test(val)) return;

		const newOtp = [...otp];
		newOtp[index] = val;
		setOtp(newOtp);
		onChange(newOtp.join(""));

		if (val && index < length - 1) {
			inputsRef.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>,
		index: number,
	) => {
		if (e.key === "Backspace" && !otp[index] && index > 0) {
			inputsRef.current[index - 1]?.focus();
		}
	};

	return (
		<div className="otp-wrapper">
			<div className="otp-container">
				{otp.map((digit, index) => (
					<input
						key={index}
						id={`${name}-${index}`}
						ref={(el) => {
							if (el) inputsRef.current[index] = el;
						}}
						type="text"
						inputMode="numeric"
						maxLength={1}
						value={digit}
						aria-invalid={!!error}
						aria-describedby={error ? `${name}-error` : undefined}
						onChange={(e) => handleChange(e.target.value, index)}
						onKeyDown={(e) => handleKeyDown(e, index)}
						className={`
							otp-input
							otp-size
							${error ? "otp-error" : "otp-normal"}
							${className}
						`}
					/>
				))}
			</div>

			{error && (
				<p id={`${name}-error`} className="otp-error-text">
					{error}
				</p>
			)}

			<p className="otp-timer">Resend OTP in {secondsLeft}s</p>
		</div>
	);
};

export default OtpInput;
