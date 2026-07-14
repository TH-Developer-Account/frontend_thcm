import React from "react";

import type { MainContact, User } from "../utils/bp.types";

import MainContactCurrentCard from "./MainContactCurrentCard";
import MainContactManagerCard from "./MainContactManagerCard";

const availableUsers: User[] = [
	{
		id: "1",
		name: "John Doe",
		email: "john.doe@company.com",
		number: "+91 9876543210",
		department: "Sales",
	},
	{
		id: "2",
		name: "Jane Smith",
		email: "jane.smith@company.com",
		number: "+91 9123456780",
		department: "Operations",
	},
	{
		id: "3",
		name: "Arun Kumar",
		email: "arun.kumar@company.com",
		number: "+91 9988776655",
		department: "Finance",
	},
];

const fallbackValue = "--";

const BPMainContact = () => {
	const [search, setSearch] = React.useState("");
	const [contacts, setContacts] = React.useState<MainContact[]>([
		{
			id: "1",
			name: "John Doe",
			email: "john.doe@company.com",
			number: "+91 9876543210",
			department: "Sales",
			isDefault: true,
		},
		{
			id: "2",
			name: "Jane Smith",
			email: "jane.smith@company.com",
			number: "+91 9123456780",
			department: "Operations",
			isDefault: false,
		},
	]);

	const filteredUsers = React.useMemo(() => {
		const query = search.trim().toLowerCase();

		if (!query) {
			return availableUsers;
		}

		return availableUsers.filter(
			(user) =>
				user.name.toLowerCase().includes(query) ||
				user.email.toLowerCase().includes(query) ||
				user.number.toLowerCase().includes(query),
		);
	}, [search]);

	const handleSearch = (value: string) => {
		setSearch(value);
	};

	const handleAddContact = (user: User) => {
		setContacts((prev) => {
			const exists = prev.some((contact) => contact.id === user.id);
			if (exists) return prev;

			const next = [...prev, { ...user, isDefault: prev.length === 0 }];
			return next;
		});
	};

	const handleSetDefault = (id: string) => {
		setContacts((prev) =>
			prev.map((contact) => ({
				...contact,
				isDefault: contact.id === id,
			})),
		);
	};

	const handleRemoveContact = (id: string) => {
		setContacts((prev) => {
			const target = prev.find((contact) => contact.id === id);
			const remaining = prev.filter((contact) => contact.id !== id);

			if (!target?.isDefault) return remaining;
			if (remaining.length === 0) return [];

			return remaining.map((contact, index) => ({
				...contact,
				isDefault: index === 0,
			}));
		});
	};

	return (
		<div className="bp-gen-content">
			<MainContactManagerCard
				search={search}
				contacts={contacts}
				filteredUsers={filteredUsers}
				fallbackValue={fallbackValue}
				onSearch={handleSearch}
				onAddContact={handleAddContact}
			/>

			<MainContactCurrentCard
				contacts={contacts}
				fallbackValue={fallbackValue}
				onSetDefault={handleSetDefault}
				onRemoveContact={handleRemoveContact}
			/>
		</div>
	);
};

export default BPMainContact;
