import Card from "../../../../components/common/Card";
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
					<button
						type="button"
						className="main-contact-secondary-btn"
						onClick={onEdit}
					>
						<Pencil size={15} />
					</button>
				</div>
			)}
		</Card>
	);
};

export default BPAddressListCard;
