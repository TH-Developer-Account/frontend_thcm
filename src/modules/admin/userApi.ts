import { type TableUser } from "../../utils/types";

const BASE_URL = "http://localhost:3000/users";
// Can use json-server or real backend

export const userApi = {
	async getAll(): Promise<TableUser[]> {
		const res = await fetch(BASE_URL);
		return res.json();
	},

	async create(user: Omit<TableUser, "id">): Promise<TableUser> {
		const res = await fetch(BASE_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(user),
		});
		return res.json();
	},

	async update(id: number, user: Partial<TableUser>): Promise<TableUser> {
		const res = await fetch(`${BASE_URL}/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(user),
		});
		return res.json();
	},

	async delete(id: number): Promise<void> {
		await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
	},
};
