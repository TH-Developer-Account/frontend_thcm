import React from "react";
import type { SingleValue } from "react-select";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ServerAxios } from "../../../../../services/ServerAxios";
import { useToast } from "../../../../../context/Auth/AuthContext";
import PageRowSectionLayout from "../../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../../components/ui/PageHeader";
import Button from "../../../../../components/common/Button";
import FormInput from "../../../../../components/FormElements/FormInput";
import SelectInput from "../../../../../components/FormElements/SelectInput";
import TextareaInput from "../../../../../components/FormElements/TextareaInput";
import type { LeadsStatus } from "../types/leads.types";

type Option = {
	value: string;
	label: string;
	[key: string]: any;
};

export interface LeadFormValues {
	id?: string;

	lead_no: string;

	lead_first_name: string;
	lead_last_name: string;
	lead_contact_no: string;

	epc_id: string;
	event_proposal_id: string;

	proposal_number: string;
	event_name: string;
	location: string;

	status: LeadsStatus;
	remarks: string;
}

const initialValues: LeadFormValues = {
	lead_no: "",

	lead_first_name: "",
	lead_last_name: "",
	lead_contact_no: "",

	epc_id: "",
	event_proposal_id: "",

	proposal_number: "",
	event_name: "",
	location: "",

	status: "HOT",
	remarks: "",
};

const leadStatusOptions: Option[] = [
	{ value: "HOT", label: "Hot" },
	{ value: "COLD", label: "Cold" },
	{ value: "SURESHOT", label: "SureShot" },
	{ value: "LOST", label: "Lost" },
	{ value: "DROPPED", label: "Dropped" },
];

type LeadFormProps = {
	leadId?: string;
	epcOptions?: Option[];
};

const LeadForm = ({ leadId, epcOptions = [] }: LeadFormProps) => {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const [values, setValues] = React.useState<LeadFormValues>(initialValues);
	const [loading, setLoading] = React.useState(false);

	const isEditMode = Boolean(leadId);

	const handleChange = <K extends keyof LeadFormValues>(
		key: K,
		value: LeadFormValues[K],
	) => {
		setValues((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const handleEpcChange = (option: SingleValue<Option>) => {
		if (!option) {
			setValues((prev) => ({
				...prev,
				epc_id: "",
				event_proposal_id: "",
				proposal_number: "",
				event_name: "",
				location: "",
			}));
			return;
		}

		setValues((prev) => ({
			...prev,
			epc_id: option.value,
			event_proposal_id: option.value,

			proposal_number: option.proposal_number || "",
			event_name: option.event_name || option.label || "",
			location: option.location || "",
		}));
	};

	const handleReset = () => {
		setValues(initialValues);
	};

	const buildPayload = () => {
		return {
			lead_first_name: values.lead_first_name,
			lead_last_name: values.lead_last_name,
			lead_contact_no: values.lead_contact_no,

			epc_id: values.epc_id,
			event_proposal_id: values.event_proposal_id,

			status: values.status,
			remarks: values.remarks,
		};
	};

	const handleSave = async () => {
		try {
			setLoading(true);

			const payload = buildPayload();

			if (isEditMode) {
				const {
					data: { message },
				} = await ServerAxios.put(`/leads/${leadId}`, payload);

				showToast({
					type: "success",
					title: "Success",
					description: message || "Lead updated successfully",
				});
			} else {
				const {
					data: { message },
				} = await ServerAxios.post("/leads", payload);

				showToast({
					type: "success",
					title: "Success",
					description: message || "Lead created successfully",
				});
			}

			navigate("/marketing/leads");
		} catch (error) {
			console.error("Failed to save lead", error);

			showToast({
				type: "error",
				title: "Error",
				description: "Failed to save lead",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<React.Fragment>
			<PageRowSectionLayout
				header_children={
					<div className="flex flex-col sm:flex-row sm:justify-between justify-center items-end sm:items-center">
						<PageHeader
							headerText={isEditMode ? "Edit Lead" : "Create Lead"}
							subtitleText="Capture customer or event lead details here"
							badgeProps={{
								text: "Back",
								direction: "back",
							}}
						/>
						<div className="mx-2 my-4 sm:mx-4 flex flex-row gap-2 items-end">
							<Button
								text="Reset"
								onClick={handleReset}
								status="brand"
								size="md"
							/>

							<Button
								text={isEditMode ? "Update Lead" : "Create Lead"}
								onClick={handleSave}
								status="brand"
								fullWidth
								disabled={loading}
								size="md"
							/>
						</div>
					</div>
				}
			>
				<div className="mt-2 px-4 py-4 text-left text-xs lg:text-sm">
					<form>
						<div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
							<FormInput
								name="event_name"
								label="Event Name"
								value={values.event_name}
								disabled
								className="w-full p-2 text-black"
								helperText="Auto populated from selected EPC"
							/>

							<FormInput
								name="location"
								label="Event Location"
								value={values.location}
								disabled
								className="w-full p-2 text-black"
								helperText="Auto populated from selected EPC"
							/>
							<FormInput
								name="lead_no"
								label="Event Date"
								value={values.lead_no}
								disabled
								className="w-full p-2 text-black"
								helperText="Auto populated from selected EPC"
							/>

							{/* <SelectInput
								name="epc_id"
								label="Select EPC"
								value={
									epcOptions.find((opt) => opt.value === values.epc_id) || null
								}
								options={epcOptions}
								onChange={handleEpcChange}
								required
								helperText="Select EPC to auto populate event details"
								className="w-full"
							/> */}

							{/* <FormInput
								name="proposal_number"
								label="EPC No"
								value={values.proposal_number}
								disabled
								className="w-full p-2 text-black"
								helperText="Auto populated from selected EPC"
							/> */}
							<SelectInput
								name="status"
								label="Lead Status"
								value={
									leadStatusOptions.find(
										(opt) => opt.value === values.status,
									) || null
								}
								options={leadStatusOptions}
								onChange={(option: SingleValue<Option>) =>
									handleChange(
										"status",
										(option?.value as LeadsStatus) || "NEW",
									)
								}
								required
								helperText="Current lead status"
								className="w-full"
							/>

							<FormInput
								name="lead_first_name"
								label="Lead First Name"
								placeholder="Enter first name"
								value={values.lead_first_name}
								onChange={(e) =>
									handleChange("lead_first_name", e.target.value)
								}
								className="w-full p-2"
								required
								helperText="Customer / contact first name"
							/>

							<FormInput
								name="lead_last_name"
								label="Lead Last Name"
								placeholder="Enter last name"
								value={values.lead_last_name}
								onChange={(e) => handleChange("lead_last_name", e.target.value)}
								className="w-full p-2"
								helperText="Customer / contact last name"
							/>

							<FormInput
								name="lead_contact_no"
								label="Contact No"
								placeholder="Enter contact number"
								value={values.lead_contact_no}
								onChange={(e) =>
									handleChange("lead_contact_no", e.target.value)
								}
								className="w-full p-2"
								required
								helperText="Customer / lead contact number"
							/>
						</div>

						<div className="mb-4 grid grid-cols-1 gap-4">
							<TextareaInput
								name="remarks"
								label="Remarks"
								value={values.remarks}
								onChange={(e) => handleChange("remarks", e.target.value)}
								rows={4}
								className="w-full p-2 h-full"
							/>
						</div>
					</form>
				</div>
			</PageRowSectionLayout>
		</React.Fragment>
	);
};

export default LeadForm;
