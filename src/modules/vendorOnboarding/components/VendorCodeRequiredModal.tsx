import React from "react";

import Button from "../../../components/common/Button";
import { Modal } from "../../../components/common/Modal";
import FormInput from "../../../components/forms/FormInput";

type VendorCodeRequiredModalProps = {
	open: boolean;
	loading?: boolean;
	onClose: () => void;
	onConfirm: (code: string) => void | Promise<void>;
};

export const VendorCodeRequiredModal = ({
	open,
	loading = false,
	onClose,
	onConfirm,
}: VendorCodeRequiredModalProps) => {
	const [code, setCode] = React.useState("");
	const [error, setError] = React.useState("");

	React.useEffect(() => {
		if (!open) {
			setCode("");
			setError("");
		}
	}, [open]);

	const trimmedCode = code.trim();

	const handleClose = React.useCallback(() => {
		if (loading) return;

		setCode("");
		setError("");
		onClose();
	}, [loading, onClose]);

	const handleConfirm = React.useCallback(async () => {
		if (loading) return;

		if (!trimmedCode) {
			setError("Vendor Code is required.");
			return;
		}

		await onConfirm(trimmedCode);
	}, [loading, onConfirm, trimmedCode]);

	return (
		<Modal
			open={open}
			title="Vendor Code required"
			size="md"
			onClose={handleClose}
		>
			<div className="modal-form">
				<p className="modal-description">
					As the final approver, the Vendor Code must be set before this request
					can be approved and closed.
				</p>

				<FormInput
					mode="edit"
					name="vendorCodeModalInput"
					label="Vendor Code"
					value={code}
					error={error}
					autoFocus
					disabled={loading}
					onChange={(event) => {
						setCode(event.target.value);
						if (error) setError("");
					}}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							void handleConfirm();
						}
					}}
				/>

				<footer className="modal-footer">
					<div className="modal-footer-actions">
						<Button
							type="button"
							text="Cancel"
							appearance="standard"
							variant="outline"
							size="sm"
							disabled={loading}
							onClick={handleClose}
						/>

						<Button
							type="button"
							text={loading ? "Approving..." : "Save & Approve"}
							appearance="standard"
							variant="brand"
							size="sm"
							disabled={!trimmedCode || loading}
							onClick={() => void handleConfirm()}
						/>
					</div>
				</footer>
			</div>
		</Modal>
	);
};
