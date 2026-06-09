import { MAX_IMAGES } from "./constant";
import type {
	EventReportDetail,
	FormState,
	OutcomeStatus,
	ReportImage,
} from "../../types/event.report.types";

export function mapReportToImages(
	report?: EventReportDetail | null,
): (ReportImage | undefined)[] {
	const slots: (ReportImage | undefined)[] = Array(MAX_IMAGES).fill(undefined);

	report?.images?.forEach((img, index) => {
		const slotIndex =
			typeof img.position === "number" ? img.position - 1 : index;

		if (slotIndex >= 0 && slotIndex < MAX_IMAGES) {
			slots[slotIndex] = {
				id: img.id,
				url: img.url,
				position: img.position,
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
			.map((image, index) => ({
				url: image.url,
				caption: image.caption || `Event Photo ${index + 1}`,
			})) ?? []
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
