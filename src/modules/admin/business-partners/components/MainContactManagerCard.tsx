import Button from "../../../../components/common/Button";
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
							placeholder="Search by name, email or number"
							aria-label="Search user to assign as main contact"
							onChange={onSearch}
							value={search}
						/>
					</div>

					<div className="main-contact-table" role="region" aria-label="Users">
						<table>
							<thead>
								<tr>
									<th scope="col">Name</th>
									<th scope="col">Email</th>
									<th scope="col">Number</th>
									<th scope="col">Department</th>
									<th scope="col">Action</th>
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
													<Button
														type="button"
														text={alreadyAdded ? "Added" : "Add"}
														appearance="standard"
														variant={alreadyAdded ? "secondary" : "brand"}
														size="sm"
														onClick={() => onAddContact(user)}
														disabled={alreadyAdded}
														aria-label={
															alreadyAdded
																? `${user.name} is already added as a main contact`
																: `Add ${user.name} as a main contact`
														}
													/>
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
		<section
			className="main-contact-card"
			aria-labelledby="main-contact-management"
		>
			<div className="main-contact-card-header">
				<h4 id="main-contact-management">Main Contact Management</h4>
			</div>

			<Accordion items={items} />
		</section>
	);
};

export default MainContactManagerCard;
