import { useState } from "react";
import { Plus } from "lucide-react";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import { businessPartnerContent } from "../../../../content/businessPartner.content";

import type {
	BPAddressPermissions,
	BPAddressViewModel,
} from "../utils/bp.types";

import BPAddress from "./BPAddress";
import BPAddressCreateForm from "./BPAddressCreateForm";

const copy = businessPartnerContent.address;

const noop = () => undefined;

type BPAddressCardProps = {
	businessPartnerId: string;
	addresses: BPAddressViewModel[];
	permissions: BPAddressPermissions;
};

/**
 * Card 3 on the create/update page.
 *
 * Existing addresses render through the same BPAddress list the Address tab
 * uses (edit / set default / remove unchanged). New addresses go through
 * BPAddressCreateForm (RHF + Zod) and POST /business-partner/:id/addresses.
 */
const BPAddressCard = ({
	businessPartnerId,
	addresses,
	permissions,
}: BPAddressCardProps) => {
	const hasAddresses = addresses.length > 0;

	// Open straight away for a BP with no addresses yet.
	const [isFormOpen, setIsFormOpen] = useState(
		!hasAddresses && permissions.canCreateAddress,
	);

	const showAddAction = permissions.canCreateAddress && !isFormOpen;

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
						onClick={() => setIsFormOpen(true)}
					/>
				) : undefined
			}
		>
			<div className="bp-create-address-card">
				{hasAddresses && (
					<BPAddress
						businessPartnerId={businessPartnerId}
						addresses={addresses}
						permissions={permissions}
						// Adding happens in BPAddressCreateForm below, not BPAddress's
						// own create form.
						isAdding={false}
						onCancelAdd={noop}
						onAdded={noop}
					/>
				)}

				{isFormOpen && (
					<BPAddressCreateForm
						businessPartnerId={businessPartnerId}
						hasExistingAddresses={hasAddresses}
						onSaved={() => setIsFormOpen(false)}
						onCancel={() => setIsFormOpen(false)}
					/>
				)}

				{!hasAddresses && !isFormOpen && (
					<p className="bp-create-card-empty">{copy.empty}</p>
				)}
			</div>
		</Card>
	);
};

export default BPAddressCard;
