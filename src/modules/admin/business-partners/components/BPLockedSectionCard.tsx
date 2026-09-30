import { Lock } from "lucide-react";

import Card from "../../../../components/common/Card";

type BPLockedSectionCardProps = {
	title: string;
	description: string;
};

/**
 * Placeholder for a card whose API needs a business partner id. Shown on
 * the create page until card 1 has created the BP.
 */
const BPLockedSectionCard = ({ title, description }: BPLockedSectionCardProps) => (
	<Card padding="default" title={title}>
		<div className="bp-create-card-locked" role="note">
			<Lock size={16} aria-hidden="true" />
			<p>{description}</p>
		</div>
	</Card>
);

export default BPLockedSectionCard;
