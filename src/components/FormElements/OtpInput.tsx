import React, { useRef, useState } from "react";

interface OtpInputProps {
  name?: string;
  length?: number;
  value?: string;
  error?: string;
  className?: string;
  onChange: (otp: string) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({
  name = "otp",
  length = 6,
  value,
  error,
  className = "",
  onChange,
}) => {
  const inputsRef = useRef<HTMLInputElement[]>([]);

  // Initialize once from value
  const [otp, setOtp] = useState<string[]>(() => {
    const chars = value?.split("").slice(0, length) ?? [];
    return [...chars, ...Array(length - chars.length).fill("")];
  });

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
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="mb-4">
      <div className="mt-2 flex flex-wrap justify-center gap-2 ">
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
              text-center font-semibold rounded-lg border
              bg-[#F3F4F6] outline-none transition
              w-8 h-8 text-base
              sm:w-10 sm:h-10 sm:text-lg
              md:w-12 md:h-12 md:text-xl
              ${
                error
                  ? "border-red-500 focus:ring-2 focus:ring-red-500"
                  : "border-[#F3F4F6] focus:ring-2 focus:ring-[#f35a00]"
              }
              ${className}
            `}
          />
        ))}
      </div>

      {error && (
        <p
          id={`${name}-error`}
          className="mt-1 text-xs text-red-600 text-left"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default OtpInput;
