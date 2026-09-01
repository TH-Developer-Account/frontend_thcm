import React, { useId, useMemo, useState } from "react";
import Select from "react-select";
import type {
	//  ActionMeta,
	InputActionMeta,
	SingleValue,
} from "react-select";

import { useDebounce } from "../../hooks/useDebounce";
import { ServerAxios } from "../../services/ServerAxios";
import type { UserResponse } from "../../modules/admin/user-profile/types/profile.types";

export type UserOption = {
	value: string;
	label: string;
	email?: string;
	firstName?: string;
	lastName?: string;
};

type UserAsyncSelectProps = {
	name?: string;
	value?: UserOption | null;
	onChange: (user: UserOption | null) => void;
	excludedUserIds?: string[];
	placeholder?: string;
	isClearable?: boolean;
	isDisabled?: boolean;
	required?: boolean;
	error?: string;
	label?: string;
	helperText?: string;
	className?: string;
	success?: boolean;
};

const UserAsyncSelect: React.FC<UserAsyncSelectProps> = ({
	name = "user",
	value = null,
	onChange,
	excludedUserIds = [],
	error,
	label,
	helperText,
	placeholder = "Search users...",
	isClearable = true,
	isDisabled = false,
	required = false,
	success,
	className = "",
}) => {
	const generatedId = useId();
	const inputId = `${name}-${generatedId}`;
	const errorId = error ? `${inputId}-error` : undefined;
	const helperId = helperText && !error ? `${inputId}-helper` : undefined;
	const describedBy = errorId ?? helperId;

	const [inputValue, setInputValue] = useState("");
	const [options, setOptions] = useState<UserOption[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const debouncedInput = useDebounce(inputValue.trim(), 400);

	/*
	 * Keep a stable lookup representation so filtering does not repeatedly
	 * scan the original array for every returned user.
	 */
	const excludedUserIdKey = excludedUserIds.join("|");

	const excludedUserIdSet = useMemo(
		() => new Set(excludedUserIds),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[excludedUserIdKey],
	);

	React.useEffect(() => {
		if (!debouncedInput || isDisabled) return;

		const controller = new AbortController();
		let requestIsActive = true;

		const fetchUsers = async () => {
			try {
				const { data } = await ServerAxios.get<UserResponse[]>("/users", {
					params: {
						search: debouncedInput,
					},
					signal: controller.signal,
				});

				if (!requestIsActive) return;

				const formattedOptions = data
					.filter((user) => !excludedUserIdSet.has(user.id))
					.map<UserOption>((user) => ({
						value: user.id,
						firstName: user.first_name,
						lastName: user.last_name,
						label: `${user.first_name} ${user.last_name}`.trim(),
						email: user.email,
					}));

				setOptions(formattedOptions);
			} catch (err) {
				if (!requestIsActive || controller.signal.aborted) return;

				console.error("User search failed:", err);
				setOptions([]);
			} finally {
				if (requestIsActive) {
					setIsLoading(false);
				}
			}
		};

		void fetchUsers();

		return () => {
			requestIsActive = false;
			controller.abort();
		};
	}, [debouncedInput, excludedUserIdSet, isDisabled]);

	const handleInputChange = (
		nextValue: string,
		actionMeta: InputActionMeta,
	) => {
		if (actionMeta.action !== "input-change") {
			return;
		}

		setInputValue(nextValue);

		if (!nextValue.trim()) {
			setOptions([]);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
	};

	const handleChange = (
		selected: SingleValue<UserOption>,
		// _actionMeta: ActionMeta<UserOption>,
	) => {
		onChange(selected);
		setInputValue("");
		setOptions([]);
		setIsLoading(false);
	};

	return (
		<div
			className={[
				"form-field",
				"user-async-select-field",
				isDisabled ? "is-disabled" : "",
				className,
			]
				.filter(Boolean)
				.join(" ")}
		>
			{label && (
				<div className="form-label-row">
					<label htmlFor={inputId} className="form-label">
						{label}

						{required && (
							<span className="form-required" aria-hidden="true">
								*
							</span>
						)}
					</label>
				</div>
			)}

			<Select<UserOption, false>
				inputId={inputId}
				name={name}
				value={value}
				inputValue={inputValue}
				options={options}
				isLoading={isLoading}
				isDisabled={isDisabled}
				isClearable={isClearable}
				placeholder={placeholder}
				filterOption={null}
				className={[
					"react-select-container",
					error ? "react-select-container-error" : "",
					success && !error && "react-select-container-success",
				]
					.filter(Boolean)
					.join(" ")}
				classNamePrefix="react-select"
				menuPortalTarget={
					typeof document !== "undefined" ? document.body : undefined
				}
				menuPosition="fixed"
				menuPlacement="auto"
				aria-invalid={Boolean(error)}
				aria-describedby={describedBy}
				aria-required={required}
				onInputChange={handleInputChange}
				onChange={handleChange}
				noOptionsMessage={({ inputValue: currentInput }) =>
					currentInput.trim()
						? "No matching users found"
						: "Start typing to search users"
				}
				loadingMessage={() => "Searching users..."}
				formatOptionLabel={(option) => (
					<div className="select-option-content">
						<div className="select-option-primary">{option.label}</div>

						{option.email && (
							<div className="select-option-secondary">{option.email}</div>
						)}
					</div>
				)}
			/>

			{error ? (
				<p id={errorId} className="form-error-text" role="alert">
					{error}
				</p>
			) : helperText ? (
				<p id={helperId} className="form-helper-text">
					{helperText}
				</p>
			) : null}
		</div>
	);
};

export default UserAsyncSelect;
