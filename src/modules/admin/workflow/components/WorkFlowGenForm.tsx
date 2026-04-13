import type { SingleValue } from "react-select";
import FormInput from "../../../../components/FormElements/FormInput";
import TextareaInput from "../../../../components/FormElements/TextareaInput";
import SelectInput from "../../../../components/FormElements/SelectInput";
import Radio from "../../../../components/FormElements/Radio";
import type { Option } from "../../../../components/FormElements/input.types";
import type { WorkflowBasics } from "../types/workflow.types";

type StepValues = {
	zone?: string;
	app?: string;
	status: string;
};

type Props = {
	basics: WorkflowBasics;
	values: StepValues;
	regionOptions: Option[];
	appOptions: Option[];
	onBasicChange: <K extends keyof WorkflowBasics>(
		key: K,
		value: WorkflowBasics[K],
	) => void;
	onFieldChange: (name: keyof StepValues, value: string) => void;
	onNext: () => void;
};

const WorkFlowGenForm = ({
	basics,
	values,
	regionOptions,
	appOptions,
	onBasicChange,
	onFieldChange,
	onNext,
}: Props) => {
	return (
		<>
			<div className="workflow-create-field-row workflow-create-field-row-2">
				<FormInput
					label="Workflow name"
					value={basics.name}
					onChange={(e) => onBasicChange("name", e.target.value)}
					placeholder="e.g. Standard EPC Approval"
					helperText="Used to identify this workflow across modules"
					required
				/>

				<SelectInput
					name="app"
					label="App"
					value={
						appOptions.find((opt: Option) => opt.label === values?.app) || null
					}
					options={appOptions}
					onChange={(v: SingleValue<Option>) =>
						onFieldChange("app", v?.label || "")
					}
					helperText="For which App this workflow is being created"
				/>
			</div>

			<div className="workflow-create-field-row workflow-create-field-row-2">
				<SelectInput
					name="zone"
					label="Zone"
					value={regionOptions.find((opt) => opt.value === values.zone) || null}
					options={regionOptions}
					onChange={(v: SingleValue<Option>) =>
						onFieldChange("zone", v?.value || "")
					}
					helperText="Select the Zone"
				/>

				<Radio
					name="status"
					groupLabel="Status"
					label1="Active"
					label2="Inactive"
					value1="active"
					value2="inactive"
					selectedValue={values.status}
					onChange={(value) => onFieldChange("status", value)}
				/>
			</div>

			<div className="workflow-create-field-row workflow-create-field-row-2">
				<FormInput
					label="Minimum budget"
					type="number"
					value={basics.minBudget}
					onChange={(e) => onBasicChange("minBudget", e.target.value as any)}
					placeholder="0"
					required
				/>

				<FormInput
					label="Maximum budget"
					type="number"
					value={basics.maxBudget}
					onChange={(e) => onBasicChange("maxBudget", e.target.value as any)}
					placeholder="1000000"
					required
				/>
			</div>

			<div className="workflow-create-field-row">
				<TextareaInput
					name="description"
					label="Description"
					className="workflow-create-textarea"
					rows={2}
					draggable="false"
					value={basics.description}
					onChange={(e) => onBasicChange("description", e.target.value)}
				/>
			</div>

			<div className="mt-4 flex justify-end">
				<button
					type="button"
					className="workflow-create-primary-btn"
					onClick={onNext}
				>
					Next
				</button>
			</div>
		</>
	);
};

export default WorkFlowGenForm;
