import type { ReactNode } from "react";

import {
	ReimbursementClaimFormContext,
	useReimbursementClaimForm,
	type UseReimbursementClaimFormArgs,
} from "../hooks/useReimbursementClaimForm";

export type { StatusBanner } from "./ClaimFormAlerts";

export type ReimbursementClaimFormProps = UseReimbursementClaimFormArgs & {
	/** The view: each page composes the Claim* sections it needs. */
	children: ReactNode;
};

/**
 * Layout-free claim form. It owns the form state / actions (the controller
 * hook) and shares them with the Claim* section components through context.
 * It renders NO layout of its own: no header, tabs, side column or footer.
 *
 * Each page decides how the sections are laid out:
 *   - Public (token link) .. ReimbursmentClaimPublicPage.tsx  (stacked)
 *   - Guest portal ......... GuestReimbursementPage.tsx       (stacked)
 *   - Internal (THCM) ...... ReimbursementPage.tsx            (tabs + side)
 *
 * Sections: ClaimFormAlerts, ClaimEmployeeCard, ClaimHeadsCard,
 * ClaimActions, ClaimEligibilityLedger (public + guest), EligibilitySidePanel
 * (internal).
 */
export const ReimbursementClaimForm = ({
	children,
	...formArgs
}: ReimbursementClaimFormProps) => {
	const controller = useReimbursementClaimForm(formArgs);

	return (
		<ReimbursementClaimFormContext.Provider value={controller}>
			{children}
		</ReimbursementClaimFormContext.Provider>
	);
};

export default ReimbursementClaimForm;
