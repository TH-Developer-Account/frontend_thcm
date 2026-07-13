import React from "react";
import { Upload, X } from "lucide-react";
import type { ReportImage } from "../../types/event.report.types";

export const ImageCard = ({
	image,
	index,
	openFilePicker,
	removeImage,
}: {
	image: ReportImage;
	index: number;
	openFilePicker: (index: number) => void;
	removeImage: (index: number) => void;
}) => {
	return (
		<React.Fragment>
			<div
				key={index}
				className="group relative h-[180px] overflow-hidden rounded-2xl bg-gray-100"
			>
				{image.url ? (
					<img
						src={image.url}
						alt={image.caption || "Event report image"}
						className="h-full w-full object-cover"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
						Image unavailable
					</div>
				)}

				{/* Overlay */}
				<div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

				{/* Replace button — clicking opens picker targeting this slot */}
				<button
					type="button"
					onClick={() => openFilePicker(index)}
					className="absolute left-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition hover:bg-white"
					title="Replace photo"
				>
					<Upload className="h-4 w-4 text-gray-700" />
				</button>

				{/* Remove button */}
				<button
					type="button"
					onClick={() => removeImage(index)}
					className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition hover:bg-white"
					title="Remove photo"
				>
					<X className="h-4 w-4 text-gray-700" />
				</button>

				{/* Position badge */}
				<div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
					Photo {index + 1}
				</div>
			</div>
		</React.Fragment>
	);
};
