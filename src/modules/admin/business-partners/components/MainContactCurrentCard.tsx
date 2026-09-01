import Card from "../../../../components/common/Card";
import type { BPContactViewModel } from "../hooks/useBusinessPartners";

type Props = {
	contacts: BPContactViewModel[];
	fallbackValue: string;
};

const MainContactCurrentCard = ({ contacts, fallbackValue }: Props) => {
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
								contact.isMainContact && (
									<span className="main-contact-default-badge">Default</span>
								)
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
										<strong>{contact.phoneNumber || fallbackValue}</strong>
									</p>

									<p className="main-contact-list-meta">
										<span>Role</span>
										<strong>{contact.role}</strong>
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
