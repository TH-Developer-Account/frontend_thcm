import { Trash } from "lucide-react";

import Button from "../../../../components/common/Button";

import type { MainContact } from "../utils/bp.types";
import Card from "../../../../components/common/Card";

type Props = {
	contacts: MainContact[];
	fallbackValue: string;
	onSetDefault: (id: string) => void;
	onRemoveContact: (id: string) => void;
};

const MainContactCurrentCard = ({
	contacts,
	fallbackValue,
	onSetDefault,
	onRemoveContact,
}: Props) => {
	return (
		<section
			className="main-contact-card"
			aria-labelledby="current-main-contacts"
		>
			<div className="main-contact-card-header">
				<h4 id="current-main-contacts">Current Main Contacts</h4>
			</div>

			{contacts.length > 0 ? (
				<div className="main-contact-list">
					{contacts.map((contact) => (
						<Card
							title={contact.name}
							actions={
								contact.isDefault && (
									<span className="main-contact-default-badge">Default</span>
								)
							}
							footer={
								<>
									{!contact.isDefault && (
										<Button
											type="button"
											text="Set Default"
											appearance="standard"
											variant="brand"
											size="sm"
											onClick={() => onSetDefault(contact.id)}
										/>
									)}

									<Button
										type="button"
										text="Remove"
										Icon={Trash}
										appearance="standard"
										variant="outline"
										size="sm"
										onClick={() => onRemoveContact(contact.id)}
									/>
								</>
							}
						>
							<div className="main-contact-list-info">
								<div className="main-contact-list-name-row"></div>

								<div className="main-contact-list-meta-grid">
									<p className="main-contact-list-meta">
										<span>Email</span>
										<strong>{contact.email || fallbackValue}</strong>
									</p>

									<p className="main-contact-list-meta">
										<span>Number</span>
										<strong>{contact.number || fallbackValue}</strong>
									</p>

									<p className="main-contact-list-meta">
										<span>Department</span>
										<strong>{contact.department || fallbackValue}</strong>
									</p>
								</div>
							</div>
						</Card>
					))}
				</div>
			) : (
				<p className="main-contact-empty-state">No main contacts added.</p>
			)}
		</section>
	);
};

export default MainContactCurrentCard;
