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
	// defaultContact,
	// fallbackValue,
	onSetDefault,
	onRemoveContact,
}: Props) => {
	return (
		<div className="main-contact-card ">
			<div className="main-contact-card-header">
				<h4>Current Main Contacts</h4>
			</div>

			{/* {defaultContact ? (
				<div className="bp-general-info">
					<div className="general-box">
						<div className="info-row">
							<p className="info-label">Default Contact :</p>
							<p className="info-value">{defaultContact.name}</p>
						</div>
						<div className="info-row">
							<p className="info-label">Email :</p>
							<p className="info-value">{defaultContact.email}</p>
						</div>
						<div className="info-row">
							<p className="info-label">Number :</p>
							<p className="info-value">{defaultContact.number}</p>
						</div>
						<div className="info-row">
							<p className="info-label">Department :</p>
							<p className="info-value">
								{defaultContact.department || fallbackValue}
							</p>
						</div>
					</div>
				</div>
			) : (
				<p className="info-value">No default contact selected.</p>
			)} */}

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
							</div>

							<div className="main-contact-list-actions">
								{!contact.isDefault && (
									<button
										type="button"
										className="main-contact-secondary-btn"
										onClick={() => onSetDefault(contact.id)}
									>
										Set as Default
									</button>
								)}

								<button
									type="button"
									className="main-contact-danger-btn"
									onClick={() => onRemoveContact(contact.id)}
								>
									Remove
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default MainContactCurrentCard;
