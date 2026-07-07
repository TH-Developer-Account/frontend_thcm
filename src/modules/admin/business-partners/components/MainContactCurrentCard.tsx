import { Trash } from "lucide-react";

import Button from "../../../../components/common/Button";

import type { MainContact } from "../utils/bp.types";

type Props = {
	contacts: MainContact[];
	defaultContact: MainContact | null;
	fallbackValue: string;
	onSetDefault: (id: string) => void;
	onRemoveContact: (id: string) => void;
};

const MainContactCurrentCard = ({
	contacts,
	defaultContact,
	fallbackValue,
	onSetDefault,
	onRemoveContact,
}: Props) => {
	return (
		<div className="main-contact-card">
			<div className="main-contact-card-header">
				<h4>Current Main Contacts</h4>
			</div>

			{defaultContact ? (
				<div className="detail-section">
					<div className="detail-grid">
						<div className="detail-row">
							<p className="detail-label">Default Contact</p>
							<p className="detail-value">{defaultContact.name}</p>
						</div>

						<div className="detail-row">
							<p className="detail-label">Email</p>
							<p className="detail-value">{defaultContact.email}</p>
						</div>

						<div className="detail-row">
							<p className="detail-label">Number</p>
							<p className="detail-value">{defaultContact.number}</p>
						</div>

						<div className="detail-row">
							<p className="detail-label">Department</p>
							<p className="detail-value">
								{defaultContact.department || fallbackValue}
							</p>
						</div>
					</div>
				</div>
			) : (
				<p className="detail-value">No default contact selected.</p>
			)}

			{contacts.length > 0 && (
				<div className="main-contact-list">
					{contacts.map((contact) => (
						<div key={contact.id} className="main-contact-list-item">
							<div className="main-contact-list-info">
								<p className="main-contact-list-name">
									{contact.name}
									{contact.isDefault && (
										<span className="main-contact-default-badge">Default</span>
									)}
								</p>

								<p className="main-contact-list-meta">{contact.email}</p>
								<p className="main-contact-list-meta">{contact.number}</p>
								<p className="main-contact-list-meta">
									{contact.department || fallbackValue}
								</p>
							</div>

							<div className="main-contact-list-actions">
								{!contact.isDefault && (
									<Button
										type="button"
										text="Set as Default"
										appearance="standard"
										variant="secondary"
										size="sm"
										onClick={() => onSetDefault(contact.id)}
									/>
								)}

								<Button
									type="button"
									text="Remove"
									Icon={Trash}
									iconPosition="left"
									iconSize={14}
									appearance="standard"
									variant="danger"
									size="sm"
									onClick={() => onRemoveContact(contact.id)}
								/>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default MainContactCurrentCard;
