import { Pencil, Trash } from "lucide-react";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";

import type { AddressItem } from "./BPAddress";

type Props = {
	address: AddressItem | null;
	showActions?: boolean;
	onSetDefault?: () => void;
	onEdit?: () => void;
	onRemove?: () => void;
};

const fallbackValue = "--";

const BPAddressListCard = ({
	address,
	showActions = false,
	onSetDefault,
	onEdit,
	onRemove,
}: Props) => {
	const title =
		address?.label?.trim() || address?.addressType?.trim() || "Address";

	return (
		<div className="bp-address-list-card">
			<Card
				title={title}
				actions={
					address?.isDefault ? (
						<span className="bp-address-default-badge">Default</span>
					) : undefined
				}
				footer={
					showActions &&
					address && (
						<div className="bp-address-card-footer-actions">
							{!address.isDefault && (
								<Button
									type="button"
									text="Set Default"
									appearance="standard"
									variant="outline"
									size="sm"
									onClick={onSetDefault}
								/>
							)}
							<Button
								type="button"
								appearance="standard"
								variant="outline"
								Icon={Pencil}
								size="sm"
								onClick={onEdit}
							/>

							<Button
								type="button"
								appearance="icon"
								variant="outline"
								Icon={Trash}
								size="sm"
								disabled={address.isDefault}
								isTooltip="Default address cannot be deleted"
								aria-label={`Remove ${address.label || "address"}`}
								onClick={onRemove}
							/>
						</div>
					)
				}
			>
				{address ? (
					<div className="bp-address-list-container">
						<div className="bp-address-info-list">
							<div className="bp-address-info-item">
								<p className="bp-address-info-label">Type</p>
								<p className="bp-address-info-value">
									{address.addressType || fallbackValue}
								</p>
							</div>

							<div className="bp-address-info-item">
								<p className="bp-address-info-label">Address</p>
								<p className="bp-address-info-value bp-address-value-clamp">
									{address.address || fallbackValue}
								</p>
							</div>
						</div>
					</div>
				) : (
					<p className="bp-address-empty">No address added yet.</p>
				)}
			</Card>
		</div>
	);
};

export default BPAddressListCard;
