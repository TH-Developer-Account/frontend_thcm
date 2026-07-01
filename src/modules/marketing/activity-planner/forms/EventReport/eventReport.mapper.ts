import { MAX_IMAGES } from "./constant";
import type {
	EventReportDetail,
	FormState,
	OutcomeStatus,
	ReportImage,
} from "../../types/event.report.types";

export const getReportImageUrl = (image?: ReportImage | null) => {
	return image?.url || image?.fileUrl || "";
};

export function mapReportToImages(
	report?: EventReportDetail | null,
): (ReportImage | undefined)[] {
	const slots: (ReportImage | undefined)[] = Array.from(
		{ length: MAX_IMAGES },
		() => undefined,
	);

	report?.images?.forEach((img, index) => {
		const imageUrl = getReportImageUrl(img);

		if (!imageUrl) return;

		const slotIndex =
			typeof img.position === "number" && img.position > 0
				? img.position - 1
				: index;

		if (slotIndex >= 0 && slotIndex < MAX_IMAGES) {
			slots[slotIndex] = {
				id: img.id,
				url: imageUrl,
				fileUrl: img.fileUrl ?? imageUrl,
				s3Key: img.s3Key,
				reportId: img.reportId,
				position: img.position ?? slotIndex + 1,
				caption: img.caption,
			};
		}
	});

	return slots;
}

export function mapReportToForm(
	report?: EventReportDetail | null,
	eventCost?: string | number,
): FormState {
	return {
		totalLeadsGenerated: String(report?.totalLeadsGenerated ?? ""),
		outcomeStatus: (report?.outcomeStatus as OutcomeStatus) ?? "",
		approvedEventCost: String(report?.approvedEventCost ?? eventCost ?? ""),
		expectedConversion: report?.expectedConversion ?? "",
		remarks: report?.remarks ?? "",
		formType: report?.id ? "EDIT" : "CREATE",
	};
}

export function mapReportToPreviewImages(report?: EventReportDetail | null) {
	return (
		report?.images
			?.slice()
			.sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
			.map((image, index) => {
				const imageUrl = getReportImageUrl(image);

				if (!imageUrl) return null;

				return {
					url: imageUrl,
					caption: image.caption || `Event Photo ${index + 1}`,
					position: image.position ?? index + 1,
				};
			})
			.filter(
				(
					image,
				): image is {
					url: string;
					caption: string;
					position: number;
				} => Boolean(image?.url),
			) ?? []
	);
}

export function buildEventReportFormData(
	images: (ReportImage | undefined)[],
	form: FormState,
): FormData {
	const data = new FormData();

	images.forEach((image, index) => {
		if (image?.file) {
			data.append(`image_${index + 1}`, image.file);
		}
	});

	data.append("outcomeStatus", form.outcomeStatus);
	data.append("totalLeadsGenerated", form.totalLeadsGenerated);
	data.append("approvedEventCost", form.approvedEventCost);

	if (form.expectedConversion.trim()) {
		data.append("expectedConversion", form.expectedConversion.trim());
	}

	if (form.remarks.trim()) {
		data.append("remarks", form.remarks.trim());
	}

	return data;
}
