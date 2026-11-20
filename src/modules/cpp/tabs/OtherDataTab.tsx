// tabs/OtherDataTab.tsx — remarks. Attachments have their own step.
// Plain content: the parent card in CppRequestCreatePage provides the surface.
import { Controller, useFormContext } from "react-hook-form";

import TextareaInput from "../../../components/forms/TextareaInput";
import type { CppFormValues } from "../types/cpp.types";

const OtherDataTab = () => {
	const { control } = useFormContext<CppFormValues>();

	return (
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
	);
};

export default OtherDataTab;
