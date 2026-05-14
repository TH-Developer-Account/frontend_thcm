import React from "react";
import { Plus, RefreshCcw, Save, Trash2, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import Button from "../../../../../components/common/Button";
import PageRowSectionLayout from "../../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../../components/ui/PageHeader";
import { ServerAxios } from "../../../../../services/ServerAxios";
import Section from "../../ActivityPlannerView/components/Section";
import FormInput from "../../../../../components/FormElements/FormInput";

type LeadInfo = {
	epcId: string;
	leadId?: string | null;
	proposalNumber?: string;
	eventName?: string;
	location?: string;
	status?: string;
};

type LeadCustomerItem = {
	id: string;
	leadName: string;
	leadPhoneNumber: string;
	leadEmail: string;
	notes?: string;
};

const createEmptyCustomer = (): LeadCustomerItem => ({
	id: crypto.randomUUID(),
	leadName: "",
	leadPhoneNumber: "",
	leadEmail: "",
	notes: "",
});

const getStoredLeadInfo = (): LeadInfo | null => {
	try {
		const stored = localStorage.getItem("epcId");
		return stored ? JSON.parse(stored) : null;
	} catch {
		return null;
	}
};

export default function LeadCreatePage() {
	const navigate = useNavigate();
	const location = useLocation();

	const routeLeadInfo = location.state?.leadInfo as LeadInfo | undefined;

	const [leadInfo] = React.useState<LeadInfo | null>(
		routeLeadInfo || getStoredLeadInfo(),
	);

	const [items, setItems] = React.useState<LeadCustomerItem[]>([
		createEmptyCustomer(),
	]);

	const [saving, setSaving] = React.useState(false);
	const [errors, setErrors] = React.useState<Record<string, string>>({});

	const isEditMode = Boolean(leadInfo?.leadId);

	const handleAddRow = () => {
		setItems((prev) => [...prev, createEmptyCustomer()]);
	};

	const handleRemoveRow = (id: string) => {
		setItems((prev) => {
			if (prev.length === 1) return prev;
			return prev.filter((item) => item.id !== id);
		});
	};

	const handleChange = (
		id: string,
		field: keyof Omit<LeadCustomerItem, "id">,
		value: string,
	) => {
		setItems((prev) =>
			prev.map((item) =>
				item.id === id
					? {
							...item,
							[field]: value,
						}
					: item,
			),
		);
	};

	const handleReset = () => {
		setItems([createEmptyCustomer()]);
		setErrors({});
	};

	const validate = () => {
		const nextErrors: Record<string, string> = {};

		if (!leadInfo?.epcId) {
			nextErrors.form = "EPC reference is missing.";
		}

		items.forEach((item, index) => {
			if (!item.leadName.trim()) {
				nextErrors[`leadName-${item.id}`] =
					`Lead name is required in row ${index + 1}.`;
			}
			if (!item.leadEmail.trim()) {
				nextErrors[`leadName-${item.id}`] =
					`Lead name is required in row ${index + 1}.`;
			}
			if (!item.leadPhoneNumber.trim()) {
				nextErrors[`phoneNumber-${item.id}`] =
					`Phone number is required in row ${index + 1}.`;
			}

			if (
				item.leadPhoneNumber.trim() &&
				!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(item.leadPhoneNumber.trim())
			) {
				nextErrors[`phoneNumber-${item.id}`] =
					`Enter a valid phone number in row ${index + 1}.`;
			}
		});

		setErrors(nextErrors);

		return Object.keys(nextErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (!validate()) return;

		try {
			setSaving(true);

			const payload = {
				epcId: leadInfo?.epcId,
				customers: items.map((item) => ({
					leadName: item.leadName.trim(),
					leadPhoneNumber: item.leadPhoneNumber.trim(),
					leadEmail: item.leadEmail.trim(),
					notes: item.notes,
				})),
			};

			console.log("payload", payload);
			if (isEditMode && leadInfo?.leadId) {
				await ServerAxios.put(`/leads/${leadInfo.leadId}`, payload);
			} else {
				await ServerAxios.post(`/leads`, payload);
			}

			localStorage.removeItem("epcId");
			navigate("/marketing/leads");
		} catch (err) {
			console.log({ err });
		} finally {
			setSaving(false);
		}
	};

	if (!leadInfo?.epcId) {
		return (
			<PageRowSectionLayout
				header_children={
					<PageHeader
						headerText="Create Lead"
						badgeProps={{
							text: "Back",
							direction: "back",
						}}
					/>
				}
			>
				<div className="content-box p-5 text-sm text-red-600">
					EPC reference missing. Please go back to EPC listing and click Create
					Lead again.
				</div>
			</PageRowSectionLayout>
		);
	}

	return (
		<PageRowSectionLayout
			header_children={
				<div className="flex items-center justify-between gap-4">
					<PageHeader
						headerText={isEditMode ? "Edit Lead" : "Create Lead"}
						badgeProps={{
							text: "Back",
							direction: "back",
						}}
					/>

					<div className="flex items-center gap-2">
						<Button
							type="button"
							text="Cancel"
							Icon={X}
							status="outline"
							size="sm"
							onClick={() => navigate(-1)}
						/>

						<Button
							type="button"
							text="Reset"
							Icon={RefreshCcw}
							status="outline"
							size="sm"
							onClick={handleReset}
						/>

						<Button
							type="button"
							text={saving ? "Saving..." : isEditMode ? "Update" : "Submit"}
							Icon={Save}
							status="brand"
							size="sm"
							disabled={saving}
							onClick={handleSubmit}
						/>
					</div>
				</div>
			}
		>
			<div className="content-box w-full max-w-full">
				<div className="px-6 py-4">
					<Section title="Selected EPC Reference">
						<div className="grid grid-cols-2 gap-4 mt-2 border-b border-zinc-100 px-3 pb-4 text-xs md:grid-cols-5">
							<div>
								<span className="uppercase-label-text">EPC No</span>
								<p className="mt-1 font-semibold text-zinc-900">
									{leadInfo.proposalNumber || "--"}
								</p>
							</div>

							<div>
								<span className="uppercase-label-text">Event Name</span>
								<p className="mt-1 font-semibold text-zinc-900">
									{leadInfo.eventName || "--"}
								</p>
							</div>

							<div>
								<span className="uppercase-label-text">Location</span>
								<p className="mt-1 font-semibold text-zinc-900">
									{leadInfo.location || "--"}
								</p>
							</div>

							<div>
								<span className="uppercase-label-text">Status</span>
								<p className="mt-1 font-semibold text-zinc-900">
									{leadInfo.status || "--"}
								</p>
							</div>
						</div>

						<div className="px-3 pt-4">
							<div className="mb-3 flex items-center justify-between">
								<div>
									<h3 className="text-sm font-semibold text-zinc-900">
										Lead Items
									</h3>
									<p className="mt-0.5 text-xs text-zinc-500">
										Add all lead details for this selected EPC, then submit
										once.
									</p>
								</div>

								<Button
									type="button"
									text="Add Customer"
									Icon={Plus}
									status="outline"
									size="sm"
									onClick={handleAddRow}
								/>
							</div>

							{errors.form && (
								<p className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
									{errors.form}
								</p>
							)}

							<div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
								<table className="w-full border-collapse text-left text-xs">
									<thead className="bg-zinc-50 text-[11px] uppercase tracking-[0.06em] text-zinc-500">
										<tr>
											<th className="w-14 px-3 py-2 font-semibold">S.No</th>
											<th className="px-3 py-2 font-semibold">Lead Name</th>
											<th className="px-3 py-2 font-semibold">Lead Email</th>
											<th className="px-3 py-2 font-semibold">Phone Number</th>
											<th className="px-3 py-2 font-semibold">Notes</th>
											<th className="w-16 px-3 py-2 text-center font-semibold">
												Action
											</th>
										</tr>
									</thead>

									<tbody className="divide-y divide-zinc-100">
										{items.map((item, index) => (
											<tr key={item.id} className="align-top">
												<td className="px-3 py-3 text-zinc-500">{index + 1}</td>

												<td className="px-3 py-3">
													<FormInput
														value={item.leadName}
														onChange={(event) =>
															handleChange(
																item.id,
																"leadName",
																event.target.value,
															)
														}
														placeholder="Enter lead name"
														required
														error={errors[`customerName-${item.id}`]}
													/>
												</td>
												<td className="px-3 py-3">
													<FormInput
														value={item.leadEmail}
														type="email"
														onChange={(event) =>
															handleChange(
																item.id,
																"leadEmail",
																event.target.value,
															)
														}
														placeholder="Enter email"
														error={errors[`leadEmail-${item.id}`]}
													/>
												</td>
												<td className="px-3 py-3">
													<FormInput
														type="mobile"
														value={item.leadPhoneNumber}
														onChange={(event) =>
															handleChange(
																item.id,
																"leadPhoneNumber",
																event.target.value,
															)
														}
														placeholder="Enter phone number"
														error={errors[`leadPhoneNumber-${item.id}`]}
													/>
												</td>
												<td className="px-3 py-3">
													<FormInput
														value={item.notes}
														onChange={(event) =>
															handleChange(item.id, "notes", event.target.value)
														}
														placeholder="Enter remarks"
													/>
												</td>
												<td className="px-3 py-3 text-center">
													<button
														type="button"
														onClick={() => handleRemoveRow(item.id)}
														disabled={items.length === 1}
														className="
															inline-flex h-8 w-8 items-center justify-center rounded-md
															border border-red-200 bg-red-50 text-red-600 transition
															hover:bg-red-100 disabled:cursor-not-allowed
															disabled:border-zinc-100 disabled:bg-zinc-50 disabled:text-zinc-300
														"
														aria-label="Remove customer"
													>
														<Trash2 size={14} />
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</Section>
				</div>
			</div>
		</PageRowSectionLayout>
	);
}
