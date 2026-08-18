// import React from "react";

// const MainContactUserTable = () => {
// 	return (
// 		<div className="main-contact-manage">
// 			<div className="main-contact-search">
// 				<SearchInput
// 					placeholder="Search User"
// 					onChange={onSearch}
// 					value={search}
// 				/>
// 			</div>

// 			<div className="main-contact-table">
// 				<table>
// 					<thead>
// 						<tr>
// 							<th>Name</th>
// 							<th>Email</th>
// 							<th>Number</th>
// 							<th>Department</th>
// 							<th>Action</th>
// 						</tr>
// 					</thead>
// 					<tbody>
// 						{filteredUsers.length > 0 ? (
// 							filteredUsers.map((user) => {
// 								const alreadyAdded = contacts.some(
// 									(contact) => contact.id === user.id,
// 								);

// 								return (
// 									<tr key={user.id}>
// 										<td>{user.name}</td>
// 										<td>{user.email}</td>
// 										<td>{user.number}</td>
// 										<td>{user.department || fallbackValue}</td>
// 										<td>
// 											<button
// 												type="button"
// 												className="main-contact-action-btn"
// 												onClick={() => onAddContact(user)}
// 												disabled={alreadyAdded}
// 											>
// 												{alreadyAdded ? "Added" : "Add"}
// 											</button>
// 										</td>
// 									</tr>
// 								);
// 							})
// 						) : (
// 							<tr>
// 								<td colSpan={5} className="main-contact-empty">
// 									No users found
// 								</td>
// 							</tr>
// 						)}
// 					</tbody>
// 				</table>
// 			</div>
// 		</div>
// 	);
// };

// export default MainContactUserTable;
