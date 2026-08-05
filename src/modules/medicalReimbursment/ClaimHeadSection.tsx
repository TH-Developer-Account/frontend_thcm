import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Paperclip } from "lucide-react";

import type {
	ClaimHeadKey,
	ReimbursementClaimFormMode,
} from "./reimbursementClaim.types";
import type { FileUploadValue } from "../../components/ui/FileUpload/fileUpload.types";
import { FileUploadField } from "../../components/ui/FileUpload/FileUploadField";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 2,
});

interface ClaimHeadSectionProps {
	head: ClaimHeadKey;
	letter: string;
	title: string;
	/** One-line explanation of what belongs under this head, e.g. "Doctor consultation and dispensary visit charges." */
	description?: string;
	Icon: LucideIcon;
	total?: number;
	mode: ReimbursementClaimFormMode;
	attachments: FileUploadValue[];
	onAttachmentsChange: (head: ClaimHeadKey, values: FileUploadValue[]) => void;
	attachmentsLabel: string;
	attachmentsHelperText?: string;
	attachmentsError?: string;
	maxFiles?: number;
	children: ReactNode;
}

const ClaimHeadSection = ({
	head,
	letter,
	title,
	description,
	Icon,
	total,
	mode,
	attachments,
	onAttachmentsChange,
	attachmentsLabel,
	attachmentsHelperText,
	attachmentsError,
	maxFiles = 5,
	children,
}: ClaimHeadSectionProps) => {
	const isReadOnly = mode === "view";
	const hasClaimedAmount = total !== undefined && total > 0;

	return (
		<fieldset
			className={`overflow-hidden rounded-xl border bg-white transition-all ${
				isReadOnly
					? "border-border"
					: "border-border hover:border-brand/30 hover:shadow-md"
			}`}
		>
			<legend className="sr-only">{title}</legend>

			{/* Header */}
			<div className="flex flex-col gap-4 border-b bg-page px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
				<div className="flex items-start gap-4">
					<div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10">
						<Icon size={20} className="text-brand" aria-hidden="true" />
						{hasClaimedAmount ? (
							<CheckCircle2
								size={16}
								className="absolute -bottom-1 -right-1 rounded-full bg-white text-brand"
								aria-label="Amount entered for this category"
							/>
						) : null}
					</div>

					<div>
						<div className="flex items-center gap-2">
							<span className="rounded-md bg-brand px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
								{letter}
							</span>

							<h3 className="text-base font-semibold text-iron-dark">
								{title}
							</h3>
						</div>

						<p className="mt-1 text-sm leading-relaxed text-muted">
							{description ??
								"Enter the claim details and upload supporting documents."}
						</p>
					</div>
				</div>

				{total !== undefined && (
					<div className="self-start rounded-lg border border-brand/20 bg-brand/5 px-4 py-2 text-right sm:self-auto">
						<p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
							Claimed
						</p>

						<p className="mt-1 text-lg font-bold text-brand">
							{currencyFormatter.format(total)}
						</p>
					</div>
				)}
			</div>

			{/* Fields */}
			<div className="px-5 py-5">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{children}
				</div>
			</div>

			{/* Upload */}
			<div className="border-t bg-page/50 px-5 py-5">
				<div className="mb-4 flex items-start gap-3">
					<div className="mt-0.5 rounded-lg bg-brand/10 p-2">
						<Paperclip size={16} className="text-brand" />
					</div>

					<div>
						<h4 className="text-sm font-semibold text-iron-dark">
							Supporting Documents
						</h4>

						<p className="mt-1 text-xs leading-5 text-muted">
							{attachmentsHelperText ??
								"Attach clear photos or scans of the bills, prescriptions or receipts for this category."}
						</p>
					</div>
				</div>

				<FileUploadField
					kind="document"
					multiple
					maxFiles={maxFiles}
					label={attachmentsLabel}
					description=""
					value={attachments}
					readonly={isReadOnly}
					error={attachmentsError}
					onChange={(nextValues) => onAttachmentsChange(head, nextValues)}
				/>
			</div>
		</fieldset>
	);
};

export default ClaimHeadSection;
