import React from "react";
import { Upload, Send, X, Eye, ArrowLeft } from "lucide-react";
import { useParams } from "react-router-dom";

import Button from "../../../../../components/common/Button";
import FormInput from "../../../../../components/FormElements/FormInput";
import SelectInput from "../../../../../components/FormElements/SelectInput";
import TextareaInput from "../../../../../components/FormElements/TextareaInput";
import NavigateButton from "../../../../../components/common/NavigateButton";

type ReportImage = {
	url: string;
	caption: string;
	file?: File;
};

type EventReportTemplateProps = {
	onBack: () => void;
	onPreview: () => void;
	eventCost?: number | string;
};

const MAX_IMAGES = 4;

const EventReportTemplate = ({
	onBack,
	onPreview,
	eventCost,
}: EventReportTemplateProps) => {
	const { epcId } = useParams();

	const [images, setImages] = React.useState<ReportImage[]>([]);

	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);

		if (!files.length) return;

		const remainingSlots = MAX_IMAGES - images.length;

		if (remainingSlots <= 0) return;

		const allowedFiles = files.slice(0, remainingSlots);

		const previewImages: ReportImage[] = allowedFiles.map((file) => ({
			url: URL.createObjectURL(file),
			caption: "",
			file,
		}));

		setImages((prev) => [...prev, ...previewImages]);

		// reset input
		e.target.value = "";
	};

	const updateCaption = (index: number, value: string) => {
		setImages((prev) =>
			prev.map((img, i) =>
				i === index
					? {
							...img,
							caption: value,
						}
					: img,
			),
		);
	};

	const removeImage = (index: number) => {
		setImages((prev) => {
			const updated = [...prev];

			// cleanup blob url
			URL.revokeObjectURL(updated[index].url);

			updated.splice(index, 1);

			return updated;
		});
	};

	// const handleSaveDraft = async () => {
	// 	const payload = {
	// 		epcId,
	// 		images,
	// 		status: "DRAFT",
	// 	};

	// 	console.log(payload);
	// };

	const handleSubmit = async () => {
		const payload = {
			epcId,
			images,
			status: "SUBMITTED",
		};

		console.log(payload);
	};

	return (
		<div className="">
			{/* Header */}
			<div className="">
				<div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
					<div className="flex items-start justify-start flex-row gap-3">
						<NavigateButton onClick={onBack} Icon={ArrowLeft} />
						<div className="flex items-start justify-start flex-col">
							<h3 className="text-sm font-semibold text-gray-900">
								Photo Evidence
							</h3>

							<p className="mt-1 text-xs text-gray-500">
								Add up to 4 event photos with captions
							</p>
						</div>
					</div>

					<div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
						{images.length}/{MAX_IMAGES} Uploaded
					</div>
				</div>

				<div className="p-3">
					<input
						ref={fileInputRef}
						type="file"
						multiple
						accept="image/*"
						className="hidden"
						onChange={handleFileChange}
					/>

					<div className="grid grid-cols-4 gap-4">
						{Array.from({ length: MAX_IMAGES }).map((_, index) => {
							const image = images[index];

							const isLarge = index === 0 || index === 1;

							const cardHeight = isLarge ? "h-[180px]" : "h-[180px]";

							// EMPTY SLOT
							if (!image) {
								return (
									<button
										key={index}
										type="button"
										onClick={() => fileInputRef.current?.click()}
										className={`group relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all duration-200 hover:border-orange-300 hover:bg-orange-50/40 ${cardHeight}`}
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
							}

							// IMAGE CARD
							return (
								<div
									key={index}
									className={`group relative overflow-hidden rounded-2xl bg-gray-100 ${cardHeight}`}
								>
									<img
										src={image.url}
										alt={`Event ${index + 1}`}
										className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
									/>

									{/* Overlay */}
									<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

									{/* Remove Button */}
									<button
										type="button"
										onClick={() => removeImage(index)}
										className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition hover:bg-white"
									>
										<X className="h-4 w-4 text-gray-700" />
									</button>

									{/* Caption */}
									<div className="absolute bottom-0 left-0 right-0 p-3">
										<input
											type="text"
											value={image.caption}
											onChange={(e) => updateCaption(index, e.target.value)}
											placeholder="Add caption"
											className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-sm text-gray-800 outline-none backdrop-blur-sm placeholder:text-gray-500 focus:border-orange-300"
										/>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
			{/* Event Outcome Capture */}
			<div className="">
				<div className="border-b border-gray-100 px-5 py-4">
					<h3 className="text-sm font-semibold text-gray-900">Event Outcome</h3>

					<p className="mt-1 text-xs text-gray-500">
						Capture lead generation and overall event outcome
					</p>
				</div>

				<div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
					{/* Leads Count */}
					<FormInput
						type="number"
						placeholder="Enter leads count"
						label="Total Leads Generated"
					/>
					{/* Event Success */}
					<SelectInput
						label="Event Outcome Status"
						options={[
							{
								value: "",
								label: "Select outcome",
							},
							{
								value: "SUCCESSFUL",
								label: "Successful",
							},
							{
								value: "PARTIAL",
								label: "Partially Successful",
							},
							{
								value: "UNSUCCESSFUL",
								label: "Unsuccessful",
							},
						]}
					/>
					{/* Event Cost */}
					<FormInput
						label="Approved Event Cost"
						value={eventCost || "₹ 2,50,000"}
						className="font-semibold"
					/>

					{/* ROI / Conversion */}
					<FormInput
						label="Expected Conversion"
						type="text"
						placeholder="Example: 15 hot prospects"
					/>

					{/* Remarks */}
					<TextareaInput
						label="	Remarks / Summary"
						name="remarks"
						rows={4}
						placeholder="Enter overall event outcome, customer response, dealer feedback, conversions, challenges, etc."
					/>
				</div>
			</div>
			{/* Footer */}
			<div className="flex items-center justify-end gap-3 border-t mb-4 border-gray-200 bg-white px-1 pt-4">
				<Button status="outline" onClick={onBack}>
					<X className="h-4 w-4" />
					Cancel
				</Button>
				{/* 
				<Button status="outline" onClick={handleSaveDraft}>
					<Save className="h-4 w-4" />
					Save Draft
				</Button> */}

				<Button status="outline" onClick={onPreview}>
					<Eye className="h-4 w-4" />
					Preview
				</Button>

				<Button onClick={handleSubmit} disabled={images.length === 0}>
					<Send className="h-4 w-4" />
					Submit Report
				</Button>
			</div>
		</div>
	);
};

export default EventReportTemplate;
