import React, { useState } from "react";
import { EPFProvider } from "../ListngScreen/context/EPCprovider";
import FormInput from "../../components/FormElements/FormInput";

const EpcForm = () => {
	const [state, setState] = useState({
		epf_no: "",
		po_no: "",
		event_name: "",
	});
	const handleChange = () => {};
	const handleBlur = () => {};
	return (
		<EPFProvider>
			<div className="bg-white shadow-[0px_3px_12px_0px_rgba(0,0,0,0.1)] rounded-lg overflow-x-auto  text-left">
				<form className="bg-white shadow-lg rounded-xl p-6 pt-4">
					<div className="flex gap-2 col-2 items-center w-full">
						<FormInput
							name="epf_no"
							label="EPF No."
							placeholder=""
							value={state.epf_no}
							onChange={handleChange}
							onBlur={handleBlur}
							required
							className=""
						/>
						<FormInput
							name="epf_no"
							label="EPF No."
							placeholder=""
							value={state.epf_no}
							onChange={handleChange}
							onBlur={handleBlur}
							required
						/>
					</div>
				</form>
			</div>
		</EPFProvider>
	);
};

export default EpcForm;
