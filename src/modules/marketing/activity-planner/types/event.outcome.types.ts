import type { FileUploadValue } from "../../../../components/ui/FileUpload/fileUpload.types";
import type { WorkflowStage } from "./workflow.types";

export type EventDeviationPayload =
	| {
			status: string;
			reason: string;
	  }
	| FormData;

export type EventOutcomePayload = {
	status: string;
	reason: string;
};

export type EventOutcomeProps = {
	eventStatus?: string | null;
	epcID?: string | null;

	workspaceId?: string;
	appId?: string;

	onSuccess?: () => void | Promise<void>;
	onDeviationPreviewSuccess?: (stages: WorkflowStage[]) => void;
};

export type DeviationInfo = {
	reason: string;
	deviatedAmount: string;
	file: FileUploadValue | null;
};
