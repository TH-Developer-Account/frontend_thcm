import { useState } from "react";
import { type TableUser } from "../utils/types";
import Button from "../components/common/Button";

interface Props {
	initial?: Partial<TableUser>;
	onSubmit: (data: Omit<TableUser, "id">) => void;
}

export const UserForm = ({ initial = {}, onSubmit }: Props) => {
	const [form, setForm] = useState<Omit<TableUser, "id">>({
		name: initial.name || "",
		email: initial.email || "",
		phone: initial.phone || "",
		company: initial.company || "",
		role: initial.role || "",
		status: initial.status || "Active",
		avatar: initial.avatar || "https://i.pravatar.cc/40",
	});

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	return (
		<form
			className="form space-y-8"
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit(form);
			}}
		>
			<input
				name="name"
				value={form.name}
				onChange={handleChange}
				placeholder="Name"
			/>
			<input
				name="email"
				value={form.email}
				onChange={handleChange}
				placeholder="Email"
			/>
			<input
				name="phone"
				value={form.phone}
				onChange={handleChange}
				placeholder="Phone"
			/>
			<input
				name="company"
				value={form.company}
				onChange={handleChange}
				placeholder="Company"
			/>
			<input
				name="role"
				value={form.role}
				onChange={handleChange}
				placeholder="Role"
			/>

			<select name="status" value={form.status} onChange={handleChange}>
				<option>Active</option>
				<option>Pending</option>
				<option>Banned</option>
			</select>

			<Button type="submit" text="Save" disabled />
			<Button text="Cancel" disabled />
		</form>
	);
};
