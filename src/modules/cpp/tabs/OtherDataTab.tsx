// tabs/OtherDataTab.tsx — remarks + attachment checklist.
import { Controller, useFormContext } from "react-hook-form";

import { Badge } from "../../../components/common/Badge";
import Card from "../../../components/common/Card";
import Checkbox from "../../../components/forms/Checkbox";
import TextareaInput from "../../../components/forms/TextareaInput";
import type { CppFormValues } from "../types/cpp.types";
import { CPP_ATTACHMENTS } from "../utils/cpp.utils";

const OtherDataTab = () => {
	const { control } = useFormContext<CppFormValues>();

	return (
		<div className="grid gap-4 lg:grid-cols-2">
			<Card title="Remarks" size="small">
				<Controller
					name="other.remarks"
					control={control}
					render={({ field }) => (
						<TextareaInput
							{...field}
							label="Additional remarks"
							rows={7}
							maxLength={1000}
						/>
					)}
				/>
			</Card>

			<Card title="Attachments" subtitle="Mandatory check list" size="small">
				<div className="flex flex-col gap-2">
					{CPP_ATTACHMENTS.map((item) => (
						<Controller
							key={item.key}
							name={`other.attachments.${item.key}`}
							control={control}
							render={({ field }) => (
								<div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
									<Checkbox
										label={item.label}
										checked={Boolean(field.value)}
										onChange={field.onChange}
									/>
									{field.value ? <Badge>Attached</Badge> : null}
								</div>
							)}
						/>
					))}
				</div>
			</Card>
		</div>
	);
};

export default OtherDataTab;
