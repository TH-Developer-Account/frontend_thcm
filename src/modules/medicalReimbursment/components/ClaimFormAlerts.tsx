import { Alert } from "../../../components/common/Alert";
import type { AlertVariant } from "../../../components/common/common.types";
import { useReimbursementClaimFormContext } from "../hooks/useReimbursementClaimForm";

export type StatusBanner = {
	variant: AlertVariant;
	title: string;
	description: string;
};

type ClaimFormAlertsProps = {
	/** Page-level status banner (e.g. the guest portal's "claim is under review"). */
	statusBanner?: StatusBanner | null;
};

/** Status banner + "changes requested by the approver" banner. */
export const ClaimFormAlerts = ({ statusBanner }: ClaimFormAlertsProps) => {
	const { correctionReason } = useReimbursementClaimFormContext();

	if (!statusBanner && !correctionReason) return null;

	return (
		<div className="flex flex-col gap-2">
			{statusBanner ? (
				<Alert
					key={`${statusBanner.title}-${statusBanner.description ?? ""}`}
					type="banner"
					variant={statusBanner.variant}
					title={statusBanner.title}
					description={statusBanner.description}
					dismissible
				/>
			) : null}
			{correctionReason ? (
				<Alert
					type="banner"
					variant="warning"
					title="Changes requested by the approver"
					description={correctionReason}
				/>
			) : null}
		</div>
	);
};

export default ClaimFormAlerts;
