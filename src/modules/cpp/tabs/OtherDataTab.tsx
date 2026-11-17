// tabs/OtherDataTab.tsx — remarks (one card). Attachments have their own step.
import { Controller, useFormContext } from "react-hook-form";

import Card from "../../../components/common/Card";
import TextareaInput from "../../../components/forms/TextareaInput";
import type { CppFormValues } from "../types/cpp.types";

const OtherDataTab = () => {
	const { control } = useFormContext<CppFormValues>();

	return (
		<Card size="small">
			<Controller
				name="other.remarks"
				control={control}
				render={({ field }) => (
					<TextareaInput
						{...field}
						label="Additional remarks"
						rows={8}
						maxLength={1000}
					/>
				)}
			/>
		</Card>
	);
};

export default OtherDataTab;
