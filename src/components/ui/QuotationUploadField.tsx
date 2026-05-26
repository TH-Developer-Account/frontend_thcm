import { Upload, RotateCcw, Eye } from "lucide-react";
import { useRef } from "react";
import Button from "../common/Button";

type Props = {
	value?: string;
	fileName?: string;
	disabled?: boolean;

	onUpload: (file: File) => Promise<void>;
	onPreview?: () => void;
};

const ALLOWED_FILE_TYPES = ["application/pdf", "image/png", "image/jpeg"];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function QuotationUploadField({
	value,
	fileName,
	disabled,
	onUpload,
	onPreview,
}: Props) {
	const inputRef = useRef<HTMLInputElement | null>(null);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			const file = e.target.files?.[0];

			if (!file) return;

			if (!ALLOWED_FILE_TYPES.includes(file.type)) {
				alert("Only PDF, PNG and JPG files are allowed.");
				return;
			}

			if (file.size > MAX_FILE_SIZE) {
				alert("File size must be less than 5MB.");
				return;
			}

			await onUpload(file);

			console.log("UPLOAD SUCCESS");
		} catch (error) {
			console.error("UPLOAD FAILED", error);
		} finally {
			if (inputRef.current) {
				inputRef.current.value = "";
			}
		}
	};

	return (
		<div className="flex items-center gap-2 justify-center">
			<input
				ref={inputRef}
				type="file"
				className="hidden"
				accept=".pdf,.png,.jpg,.jpeg"
				onChange={handleFileChange}
				disabled={disabled}
			/>

			<Button
				type="button"
				size="sm"
				status="outline"
				className="h-6 w-8 rounded-full px-1"
				Icon={value ? RotateCcw : Upload}
				onClick={() => inputRef.current?.click()}
			/>

			{value && (
				<>
					<Button
						type="button"
						size="sm"
						status="outline"
						className="h-6 w-8 rounded-full px-1"
						Icon={Eye}
						onClick={onPreview}
					/>
				</>
			)}
		</div>
	);
}
