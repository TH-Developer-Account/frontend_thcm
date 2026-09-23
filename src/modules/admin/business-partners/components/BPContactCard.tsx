import { useState } from "react";
import { Plus } from "lucide-react";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import { businessPartnerContent } from "../../../../content/businessPartner.content";

import type {
	BPContactViewModel,
	BPPeoplePermissions,
} from "../utils/bp.types";

import BPContact from "./BPContact";

const copy = businessPartnerContent.contact;

type BPContactCardProps = {
	businessPartnerId: string;
	contacts: BPContactViewModel[];
	permissions: BPPeoplePermissions;
};

/**
 * Card 2 on the create/update page. Renders the exact same BPContact
 * component the Contact tab uses, so search-existing-user / add-manually,
 * set-default and remove all behave identically and hit the same
 * /contacts endpoints. Only the card chrome and the "Add Contact" trigger
 * live here (mirroring how BPTabs wires it).
 */
const BPContactCard = ({
	businessPartnerId,
	contacts,
	permissions,
}: BPContactCardProps) => {
	const [isAdding, setIsAdding] = useState(false);

	const showAddAction =
		permissions.canAddPeople && contacts.length > 0 && !isAdding;

	return (
		<Card
			padding="default"
			title={copy.title}
			actions={
				showAddAction ? (
					<Button
						type="button"
						text={copy.add}
						Icon={Plus}
						iconPosition="left"
						appearance="standard"
						variant="outline"
						size="sm"
						onClick={() => setIsAdding(true)}
					/>
				) : undefined
			}
		>
			<BPContact
				businessPartnerId={businessPartnerId}
				contacts={contacts}
				permissions={permissions}
				isAdding={isAdding}
				onAddContact={() => setIsAdding(true)}
				onCancelAdd={() => setIsAdding(false)}
				onAdded={() => setIsAdding(false)}
			/>
		</Card>
	);
};

export default BPContactCard;
