// modules/audit/dealerAudit/cycle/components/ResendReportDialog.tsx
//
// "Email this report again": one box for recipients, plain validation, the
// server error stays visible inside the dialog so nothing typed is lost.

import { useEffect, useState } from "react";

import Button from "../../../../../components/common/Button";
import { Modal } from "../../../../../components/common/Modal";
import TextareaInput from "../../../../../components/forms/TextareaInput";
import { getAuditActionErrorMessage } from "../../../shared/audit-error.utils";
import { dealerCycleContent as content } from "../dealer-cycle.content";
import { parseRecipientList } from "../dealer-cycle.logic";
import { useResendReport } from "../hooks/useDealerCycle";

const text = content.reports;

interface ResendReportDialogProps {
	open: boolean;
	auditId: string | null;
	onClose: () => void;
}

export default function ResendReportDialog({
	open,
	auditId,
	onClose,
}: ResendReportDialogProps) {
	const resend = useResendReport();
	const [raw, setRaw] = useState("");
	const [validationError, setValidationError] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			setRaw("");
			setValidationError(null);
			resend.reset();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const handleSend = async (): Promise<void> => {
		if (!auditId) return;
		const { emails, invalid } = parseRecipientList(raw);
		if (emails.length === 0 && invalid.length === 0) {
			setValidationError(text.resendRecipientsRequired);
			return;
		}
		if (invalid.length > 0) {
			setValidationError(`${text.resendRecipientsInvalid} (${invalid.join(", ")})`);
			return;
		}
		setValidationError(null);
		try {
			await resend.mutateAsync({ auditId, recipients: emails });
			onClose();
		} catch {
			/* shown from resend.error */
		}
	};

	const serverError = resend.error
		? getAuditActionErrorMessage(resend.error, "report")
		: null;

	return (
		<Modal
			open={open}
			title={text.resendTitle}
			size="md"
			closeOnOverlayClick={false}
			onClose={() => {
				if (!resend.isPending) onClose();
			}}
			footer_actions={
				<>
					<Button
						type="button"
						text={content.common.cancel}
						appearance="standard"
						variant="outline"
						disabled={resend.isPending}
						onClick={onClose}
					/>
					<Button
						type="button"
						text={text.resend}
						appearance="standard"
						variant="brand"
						loading={resend.isPending}
						onClick={() => void handleSend()}
					/>
				</>
			}
		>
			<TextareaInput
				label={text.resendRecipients}
				rows={3}
				value={raw}
				error={validationError ?? undefined}
				disabled={resend.isPending}
				onChange={(event) => setRaw(event.target.value)}
			/>
			{serverError ? (
				<p className="form-error-text mt-2" role="alert">
					{serverError}
				</p>
			) : null}
		</Modal>
	);
}
