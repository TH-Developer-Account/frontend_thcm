// components/activityFormView/ResubmitFooterAction.tsx
import { Send } from "lucide-react";
import Button from "../../../../../components/common/Button";

type ResubmitFooterActionProps = {
	isPending: boolean;
	isSubmitting: boolean;
	canSubmit: boolean;
	onSubmit?: () => void | Promise<void>;
	tooltip?: string;
};

const ResubmitFooterAction = ({
	isPending,
	isSubmitting,
	canSubmit,
	onSubmit,
	tooltip = "This will submit all changes back to the approval workflow.",
}: ResubmitFooterActionProps) => {
	if (!isPending) return null;

	return (
		<div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-4 py-4">
			<div className="flex gap-2">
				<Button
					type="button"
					text={isSubmitting ? "Submitting..." : "Save & Final Submit"}
					Icon={Send}
					iconPosition="right"
					onClick={onSubmit}
					status="brand"
					disabled={!canSubmit || isSubmitting}
					size="sm"
					className="text-xs cursor-pointer"
					isTooltip={tooltip}
				/>
			</div>
		</div>
	);
};

export default ResubmitFooterAction;
