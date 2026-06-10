// components/common/ReasonActionModal.tsx

import React from "react";
import Button from "../../../../../components/common/Button";
import TextareaInput from "../../../../../components/FormElements/TextareaInput";
import { Modal } from "../../../../../components/common/Modal";

export type ReasonActionMode = "clarify-workflow" | "clarify-report";

type ReasonActionModalProps = {
	open: boolean;
	mode: ReasonActionMode | null;
	loading?: boolean;
	onClose: () => void;
	onConfirm: (reason: string) => void | Promise<void>;
};

const MODAL_COPY: Record<
	ReasonActionMode,
	{
		title: string;
		description: string;
		placeholder: string;
		confirmText: string;
		loadingText: string;
	}
> = {
	"clarify-workflow": {
		title: "Send for Clarification",
		description:
			"This will send the EPC back to the proposer. The proposer can update EPC, CRF, or EPF and resubmit the workflow.",
		placeholder: "Example: Please update the budget breakup before approval.",
		confirmText: "Send Clarification",
		loadingText: "Sending...",
	},
	"clarify-report": {
		title: "Clarify Report",
		description:
			"This will send only the event report back to the proposer for correction. It will not restart the EPC approval workflow.",
		placeholder:
			"Example: Please correct the event photos and leads generated.",
		confirmText: "Clarify Report",
		loadingText: "Sending...",
	},
};

export const ReasonActionModal = ({
	open,
	mode,
	loading = false,
	onClose,
	onConfirm,
}: ReasonActionModalProps) => {
	const [reason, setReason] = React.useState("");

	React.useEffect(() => {
		if (!open) {
			setReason("");
		}
	}, [open]);

	if (!mode) return null;

	const copy = MODAL_COPY[mode];

	const handleClose = () => {
		if (loading) return;
		setReason("");
		onClose();
	};

	const handleConfirm = async () => {
		const trimmedReason = reason.trim();
		if (!trimmedReason) return;

		await onConfirm(trimmedReason);
	};

	return (
		<Modal open={open} onClose={handleClose}>
			<div className="w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
				<div className="mb-4">
					<h3 className="text-sm font-semibold text-zinc-900">{copy.title}</h3>

					<p className="mt-1 text-xs text-zinc-500">{copy.description}</p>
				</div>

				<TextareaInput
					name="reason"
					value={reason}
					onChange={(e) => setReason(e.target.value)}
					placeholder={copy.placeholder}
					rows={4}
					autoFocus
					disabled={loading}
					className="min-h-[90px] overflow-y-auto bg-white px-2 py-1.5"
				/>

				<div className="mt-4 flex justify-end gap-3">
					<Button
						type="button"
						text="Cancel"
						status="outline"
						disabled={loading}
						onClick={handleClose}
					/>

					<Button
						type="button"
						text={loading ? copy.loadingText : copy.confirmText}
						status="brand"
						disabled={!reason.trim() || loading}
						onClick={handleConfirm}
					/>
				</div>
			</div>
		</Modal>
	);
};
