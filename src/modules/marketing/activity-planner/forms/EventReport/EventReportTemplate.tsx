import { Upload, Send, X } from "lucide-react";

import Button from "../../../../../components/common/Button";
import FormInput from "../../../../../components/FormElements/FormInput";
import SelectInput from "../../../../../components/FormElements/SelectInput";
import TextareaInput from "../../../../../components/FormElements/TextareaInput";

import { OUTCOME_OPTIONS, MAX_IMAGES } from "./constant";
import type {
	EventReportTemplateProps,
	OutcomeStatus,
} from "../../types/event.report.types";
import { ImageCard } from "./ImageCard";
import { useEventReportForm } from "./useEventReportForm";

const EventReportTemplate = ({
	epcId,
	onBack,
	eventCost,
	initialReport,
	onSuccess,
}: EventReportTemplateProps) => {
	const {
		form,
		images,
		error,
		fileInputRef,
		filledCount,
		isSubmitting,
		openFilePicker,
		handleFileChange,
		removeImage,
		handleFormChange,
		canSubmitReport,
		handleSubmit,
	} = useEventReportForm({
		epcId,
		eventCost,
		initialReport,
		onSuccess,
	});

	return (
		<div>
			<div>
				<div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
					<div>
						<h3 className="text-sm font-semibold text-gray-900">
							Photo Evidence
						</h3>
						<p className="mt-1 text-xs text-gray-500">
							Add up to 4 event photos with captions
						</p>
					</div>

					<div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
						{filledCount}/{MAX_IMAGES} Uploaded
					</div>
				</div>

				<div className="p-3">
					<input
						ref={fileInputRef}
						type="file"
						multiple
						accept="image/jpeg,image/png,image/webp"
						className="hidden"
						onChange={handleFileChange}
					/>

					<div className="grid grid-cols-4 gap-4">
						{Array.from({ length: MAX_IMAGES }).map((_, index) => {
							const image = images[index];

							return image ? (
								<ImageCard
									key={index}
									image={image}
									index={index}
									openFilePicker={openFilePicker}
									removeImage={removeImage}
								/>
							) : (
								<button
									key={index}
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										openFilePicker(index);
									}}
									className="group relative h-[180px] overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all duration-200 hover:border-orange-300 hover:bg-orange-50/40"
								>
									<div className="flex h-full flex-col items-center justify-center">
										<div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-105">
											<Upload className="h-5 w-5 text-gray-500" />
										</div>
										<span className="mt-3 text-sm font-medium text-gray-600">
											Add Photo
										</span>
									</div>
								</button>
							);
						})}
					</div>
				</div>
			</div>

			<div>
				<div className="border-b border-gray-100 px-5 py-4">
					<h3 className="text-sm font-semibold text-gray-900">Event Outcome</h3>
					<p className="mt-1 text-xs text-gray-500">
						Capture lead generation and overall event outcome
					</p>
				</div>

				<div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
					<FormInput
						type="number"
						placeholder="Enter leads count"
						label="Total Leads Generated"
						value={form.totalLeadsGenerated}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							handleFormChange("totalLeadsGenerated", e.target.value)
						}
					/>

					<SelectInput
						label="Event Outcome Status"
						options={OUTCOME_OPTIONS}
						value={OUTCOME_OPTIONS.find(
							(option) => option.value === form.outcomeStatus,
						)}
						onChange={(newValue) =>
							handleFormChange(
								"outcomeStatus",
								(newValue?.value ?? "") as OutcomeStatus,
							)
						}
					/>

					<FormInput
						label="Approved Event Cost"
						value={form.approvedEventCost}
						className="font-semibold"
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							handleFormChange("approvedEventCost", e.target.value)
						}
					/>

					<FormInput
						label="Expected Conversion"
						type="text"
						placeholder="Example: 15 hot prospects"
						value={form.expectedConversion}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							handleFormChange("expectedConversion", e.target.value)
						}
					/>

					<TextareaInput
						label="Remarks / Summary"
						name="remarks"
						rows={4}
						placeholder="Enter overall event outcome, customer response, dealer feedback, conversions, challenges, etc."
						value={form.remarks}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
							handleFormChange("remarks", e.target.value)
						}
					/>
				</div>
			</div>

			{error && (
				<div className="mx-5 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			)}

			<div className="mb-4 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-1 pt-4">
				<Button
					status="outline"
					onClick={onBack}
					disabled={isSubmitting}
					size="sm"
				>
					<X className="h-4 w-4" />
					Cancel
				</Button>

				<Button
					onClick={handleSubmit}
					status="outline"
					size="sm"
					disabled={!canSubmitReport}
				>
					<Send className="h-4 w-4" />
					{isSubmitting ? "Submitting..." : "Submit Report"}
				</Button>
			</div>
		</div>
	);
};

export default EventReportTemplate;
