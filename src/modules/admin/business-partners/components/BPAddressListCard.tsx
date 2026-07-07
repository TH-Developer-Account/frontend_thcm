import { Pencil, Trash } from "lucide-react";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";

import type { AddressItem } from "./BPAddress";

type Props = {
	title: string;
	address: AddressItem | null;
	showActions?: boolean;
	onSetDefault?: () => void;
	onEdit?: () => void;
	onRemove?: () => void;
};

const fallbackValue = "--";

const BPAddressListCard = ({
	title,
	address,
	showActions = false,
	onSetDefault,
	onEdit,
	onRemove,
}: Props) => {
	return (
		<Card>
			<div className="bp-address-card-header">
				<h5>{title}</h5>

				<div className="bp-address-card-header-right">
					{address?.isDefault && (
						<span className="bp-address-default-badge">Default</span>
					)}

					{showActions && address && (
						<div className="bp-address-header-actions">
							{!address.isDefault && (
								<Button
									type="button"
									text="Set Default"
									appearance="standard"
									variant="secondary"
									size="sm"
									onClick={onSetDefault}
								/>
							)}

							<Button
								type="button"
								appearance="icon"
								variant="danger"
								Icon={Trash}
								iconSize={15}
								aria-label={`Remove ${address.label || "address"}`}
								onClick={onRemove}
							/>
						</div>
					)}
				</div>
			</div>

			{address ? (
				<div className="bp-address-list-container">
					<div className="bp-address-info-list">
						<div className="bp-address-info-item">
							<p className="bp-address-info-label">Label</p>
							<p className="bp-address-info-value">
								{address.label || fallbackValue}
							</p>
						</div>

						<div className="bp-address-info-item">
							<p className="bp-address-info-label">Address</p>
							<p className="bp-address-info-value">
								{address.address || fallbackValue}
							</p>
						</div>
					</div>
				</div>
			) : (
				<p className="bp-address-empty">No address added yet.</p>
			)}

			{showActions && address && (
				<div className="bp-address-footer-actions">
					<Button
						type="button"
						appearance="icon"
						variant="secondary"
						Icon={Pencil}
						iconSize={15}
						aria-label={`Edit ${address.label || "address"}`}
						onClick={onEdit}
					/>
				</div>
			)}
		</Card>
	);
};

export default BPAddressListCard;
