import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Button from "../../../components/common/Button";
import { Modal } from "../../../components/common/Modal";
import FormInput from "../../../components/forms/FormInput";
import { vendorContent } from "../../../content/vendor.content";
import {
	vendorCodeModalSchema,
	type VendorCodeModalValues,
} from "../schemas/vendorCode.schema";

type VendorCodeRequiredModalProps = {
	open: boolean;
	loading?: boolean;
	onClose: () => void;
	onConfirm: (code: string) => void | Promise<void>;
};

const content = vendorContent.vendorCodeModal;

export const VendorCodeRequiredModal = ({
	open,
	loading = false,
	onClose,
	onConfirm,
}: VendorCodeRequiredModalProps) => {
	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<VendorCodeModalValues>({
		resolver: zodResolver(vendorCodeModalSchema),
		// Validate on every keystroke, per explicit request — errors should
		// appear as the user types, not only once they blur the field.
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: { code: "" },
	});

	useEffect(() => {
		if (!open) {
			reset({ code: "" });
		}
	}, [open, reset]);

	const codeValue = useWatch({ control, name: "code" });

	const handleClose = () => {
		if (loading) return;

		reset({ code: "" });
		onClose();
	};

	const onValid = async ({ code }: VendorCodeModalValues) => {
		if (loading) return;

		await onConfirm(code.trim());
	};

	const onSubmit = handleSubmit(onValid);

	return (
		<Modal open={open} title={content.title} size="md" onClose={handleClose}>
			<form
				className="modal-form"
				noValidate
				onSubmit={(event) => {
					void onSubmit(event);
				}}
			>
				<p className="modal-description">{content.description}</p>

				<FormInput
					mode="edit"
					label={content.field.label}
					error={errors.code?.message}
					autoFocus
					disabled={loading}
					{...register("code")}
				/>

				<footer className="modal-footer">
					<div className="modal-footer-actions">
						<Button
							type="button"
							text={vendorContent.buttons.cancel}
							appearance="standard"
							variant="outline"
							size="sm"
							disabled={loading}
							onClick={handleClose}
						/>

						<Button
							type="submit"
							text={
								loading
									? vendorContent.buttons.approving
									: vendorContent.buttons.saveAndApprove
							}
							appearance="standard"
							variant="brand"
							size="sm"
							disabled={!codeValue?.trim() || loading}
						/>
					</div>
				</footer>
			</form>
		</Modal>
	);
};
