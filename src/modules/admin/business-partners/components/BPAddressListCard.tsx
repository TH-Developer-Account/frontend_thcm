import React from "react";
import type { AddressItem } from "./BPAddress";
import { Pencil, Trash } from "lucide-react";

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
		<div className="bp-address-card">
			<div className="bp-address-card-header">
				<h5>{title}</h5>

				<div className="bp-address-card-header-right">
					{address?.isDefault && (
						<span className="bp-address-default-badge">Default</span>
					)}

					{showActions && address && (
						<div className="bp-address-header-actions">
							{!address.isDefault && (
								<button
									type="button"
									className="main-contact-secondary-btn"
									onClick={onSetDefault}
								>
									Set Default
								</button>
							)}

							<button
								type="button"
								className="main-contact-danger-btn"
								onClick={onRemove}
							>
								<Trash size={15} />
							</button>
						</div>
					)}
				</div>
			</div>

			{address ? (
				<div className="bp-address-list-container">
					<div className="general-box">
						<div className="info-row">
							<p className="info-label">Label :</p>
							<p className="info-value">{address.label || fallbackValue}</p>
						</div>
						<div className="info-row">
							<p className="info-label">Address :</p>
							<p className="info-value">{address.address}</p>
						</div>
					</div>
				</div>
			) : (
				<p className="info-value">No address added yet.</p>
			)}

			{showActions && address && (
				<div className="bp-address-footer-actions">
					<button
						type="button"
						className="main-contact-secondary-btn"
						onClick={onEdit}
					>
						<Pencil size={15} />
					</button>
				</div>
			)}
		</div>
	);
};

export default BPAddressListCard;
