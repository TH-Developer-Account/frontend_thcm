import React from "react";
import Select from "react-select";
import type { SingleValue } from "react-select";
import { ServerAxios } from "../../services/ServerAxios";
import { useDebounce } from "../../hooks/useDebounce";
import type { UserResponse } from "../../modules/admin/user-profile/types/profile.types";

export type UserOption = {
	value: string;
	label: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	error?: string;
};

type Props = {
	value?: UserOption | null;
	onChange: (user: UserOption | null) => void;
	excludedUserIds?: string[];
	placeholder?: string;
	isClearable?: boolean;
	label?: string;
};

const UserAsyncSelect: React.FC<Props> = ({
	onChange,
	excludedUserIds = [],
	error,
	placeholder = "Search users...",
	isClearable = true,
	...props
}) => {
	const [inputValue, setInputValue] = React.useState("");
	const [options, setOptions] = React.useState<UserOption[]>([]);
	const [isLoading, setIsLoading] = React.useState(false);

	// 🔥 your debounce hook
	const debouncedInput = useDebounce(inputValue, 400);
	// 🔥 API call triggered only when debounced value changes
	React.useEffect(() => {
		const fetchUsers = async () => {
			if (!debouncedInput) {
				setOptions([]);
				return;
			}

			setIsLoading(true);

			try {
				const { data } = await ServerAxios.get(
					`/users?search=${encodeURIComponent(debouncedInput)}`,
				);

				const formatted = data
					.filter((user: UserResponse) => !excludedUserIds.includes(user.id))
					.map((user: UserResponse) => ({
						value: user.id,
						firstName: user.first_name,
						lastName: user.last_name,
						label: `${user.first_name} ${user.last_name}`,
						email: user.email,
					}));

				setOptions(formatted);
			} catch (err) {
				console.error("User search failed:", err);
				setOptions([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchUsers();
	}, [debouncedInput, excludedUserIds]);

	return (
		<React.Fragment>
			<label className="text-xs font-semibold text-zinc-600">
				{props.label}
			</label>
			<Select<UserOption>
				inputValue={inputValue}
				onInputChange={(val, { action }) => {
					if (action === "input-change") {
						setInputValue(val);
					}
				}}
				options={options} // 🔥 controlled options
				isLoading={isLoading}
				value={null}
				onChange={(selected: SingleValue<UserOption>) => {
					onChange(selected as UserOption);
					setInputValue("");
					setOptions([]);
				}}
				isClearable={isClearable}
				placeholder={placeholder}
				filterOption={null}
				className={`
					 userAsyncSelect
					${error ? "form-input-error" : ""}
				`}
				menuPortalTarget={document.body}
				styles={{
					menuPortal: (base) => ({ ...base, zIndex: 9999 }),
					menu: (base) => ({ ...base, zIndex: 9999 }),
				}}
				classNamePrefix="react-select"
				formatOptionLabel={(option: UserOption) => (
					<div>
						<div>{option.label}</div>
						{option.email && (
							<div style={{ fontSize: 12, opacity: 0.7 }}>{option.email}</div>
						)}
					</div>
				)}
			/>
		</React.Fragment>
	);
};

export default UserAsyncSelect;
