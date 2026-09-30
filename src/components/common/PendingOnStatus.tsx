import { useState, type MouseEvent } from "react";

import { Badge } from "./Badge";
import Popover from "./Popover";
import {
	formatPendingOn,
	getPendingApproverNames,
	type PendingOn,
} from "../../utils/statusAlert.helper";

type PendingOnStatusProps = {
	pendingOn: PendingOn | null | undefined;
	status: string | null | undefined;
	/** Approver names shown inside the badge before collapsing to "+N". */
	maxVisible?: number;
};

const stopRowClick = (event: MouseEvent) => event.stopPropagation();

const PendingOnStatus = ({
	pendingOn,
	status,
	maxVisible = 1,
}: PendingOnStatusProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const approverNames = getPendingApproverNames(pendingOn, status);

	// Not pending on approvers, or few enough to show in full
	if (approverNames.length <= maxVisible) {
		return <Badge status={formatPendingOn(pendingOn, status)} />;
	}

	const visibleNames = approverNames.slice(0, maxVisible);
	const remainingCount = approverNames.length - visibleNames.length;

	return (
		<div className="pending-on-status" onClick={stopRowClick}>
			<Badge status={`Pending on ${visibleNames.join(", ")}...`} />

			<Popover
				open={isOpen}
				onOpenChange={setIsOpen}
				placement="bottom-start"
				triggerClassName="pending-on-status-trigger"
				trigger={
					<button
						type="button"
						className="pending-on-status-more"
						aria-expanded={isOpen}
						aria-label={
							isOpen
								? "Hide pending approvers"
								: `View all ${approverNames.length} pending approvers`
						}
					>
						{isOpen ? `-${remainingCount}` : `+${remainingCount}`}
					</button>
				}
			>
				<div className="pending-on-popover">
					<p className="pending-on-popover-title">
						Pending on {approverNames.length} approvers
					</p>

					<ul className="pending-on-popover-list scrollbar-sleek">
						{approverNames.map((name, index) => (
							<li key={`${name}-${index}`} className="pending-on-popover-item">
								{name}
							</li>
						))}
					</ul>
				</div>
			</Popover>
		</div>
	);
};

export default PendingOnStatus;
