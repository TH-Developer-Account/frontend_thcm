import { Accordion } from "../../../../components/common/Accordion";
import { SearchInput } from "../../../../components/forms/SearchInput";
import type { MainContact, User } from "../utils/bp.types";

type Props = {
	search: string;
	contacts: MainContact[];
	filteredUsers: User[];
	fallbackValue: string;
	onSearch: (value: string) => void;
	onAddContact: (user: User) => void;
};

const MainContactManagerCard = ({
	search,
	contacts,
	filteredUsers,
	fallbackValue,
	onSearch,
	onAddContact,
}: Props) => {
	const items = [
		{
			id: "assign-main-contact",
			title: "Add / Assign Main Contact",
			content: (
				<div className="main-contact-manage">
					<div className="main-contact-search">
						<SearchInput
							placeholder="Search User"
							onChange={onSearch}
							value={search}
						/>
					</div>

					<div className="main-contact-table">
						<table>
							<thead>
								<tr>
									<th>Name</th>
									<th>Email</th>
									<th>Number</th>
									<th>Department</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{filteredUsers.length > 0 ? (
									filteredUsers.map((user) => {
										const alreadyAdded = contacts.some(
											(contact) => contact.id === user.id,
										);

										return (
											<tr key={user.id}>
												<td>{user.name}</td>
												<td>{user.email}</td>
												<td>{user.number}</td>
												<td>{user.department || fallbackValue}</td>
												<td>
													<button
														type="button"
														className="main-contact-action-btn"
														onClick={() => onAddContact(user)}
														disabled={alreadyAdded}
													>
														{alreadyAdded ? "Added" : "Add"}
													</button>
												</td>
											</tr>
										);
									})
								) : (
									<tr>
										<td colSpan={5} className="main-contact-empty">
											No users found
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			),
		},
	];

	return (
		<div className="main-contact-card">
			<div className="main-contact-card-header">
				<h4>Main Contact Management</h4>
			</div>
			<Accordion items={items} />
		</div>
	);
};

export default MainContactManagerCard;
