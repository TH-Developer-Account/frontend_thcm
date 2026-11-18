// tabs/AttachmentsTab.tsx — wizard step 5: supporting documents.
// One upload per item of the "Attachments Required" list in the CPP format.
// Files are handed to TCS with the approved request, together with the Excel.
import { Controller, useFormContext } from "react-hook-form";

import Card from "../../../components/common/Card";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import type { CppFormValues } from "../types/cpp.types";
import { CPP_ATTACHMENTS } from "../utils/cpp.utils";

const AttachmentsTab = () => {
	const { control } = useFormContext<CppFormValues>();

	return (
		<Card size="small">
			<div className="grid gap-4 lg:grid-cols-2">
				{CPP_ATTACHMENTS.map((item) => (
					<Controller
						key={item.key}
						name={`attachments.${item.key}`}
						control={control}
						render={({ field, fieldState }) => (
							<FileUploadField
								value={field.value ?? null}
								onChange={(file) => field.onChange(file)}
								label={item.label}
								description="PDF, Excel, Word or image"
								error={fieldState.error?.message}
								heightClassName="h-[100px]"
							/>
						)}
					/>
				))}
			</div>
		</Card>
	);
};

export default AttachmentsTab;
