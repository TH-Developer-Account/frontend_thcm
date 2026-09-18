// modules/audit/shared/ChecklistItemView.tsx
import Card from "../../../../components/common/Card";
import { Badge } from "../../../../components/common/Badge";
import ScoreSelector from "./ScoreSelector";
import { useChecklistExecution } from "../templates/audit-template-execution.context";
import type { ChecklistParameter } from "../shared.audit.types";
import { LivePhotoUploadField } from "./LivePhotoUploadField";

export default function ChecklistItemView({
	parameter,
}: {
	parameter: ChecklistParameter;
}) {
	const { capabilities, permissions, saveParameter, saveStatusByItemId } =
		useChecklistExecution();

	const saveStatus = saveStatusByItemId[parameter.id] ?? "idle";

	return (
		<Card variant="outlined" padding="default">
			<h2 className="text-base font-semibold text-slate-900">
				{parameter.title}
			</h2>
			<p className="mt-1 text-sm text-slate-500">{parameter.criteria}</p>

			{/* Dealer Audit only — Factory Audit has no self-assessment step */}
			{capabilities.hasSelfAssessment ? (
				<section className="mt-4">
					<Badge variant="neutral" text="Self-assessment" />
					<ScoreSelector
						value={parameter.selfScore ?? null}
						disabled={!permissions.canEditSelfAssessment}
						onChange={(score) =>
							saveParameter(parameter.id, { selfScore: score })
						}
					/>
				</section>
			) : null}

			{capabilities.hasReviewerScore && permissions.canReview ? (
				<section className="mt-4">
					<Badge variant="warning" text="Reviewer score" />
					<ScoreSelector
						value={parameter.reviewerScore ?? null}
						onChange={(score) =>
							saveParameter(parameter.id, { reviewerScore: score })
						}
					/>
				</section>
			) : null}

			{parameter.evidenceRequired ? (
				<LivePhotoUploadField
					required
					minFiles={parameter.minEvidenceCount ?? 1}
					maxFiles={parameter.maxEvidenceCount ?? 3}
					value={parameter.evidence ?? []}
					onChange={(evidence) => saveParameter(parameter.id, { evidence })}
				/>
			) : null}

			<span className="mt-2 block text-xs text-slate-400">{saveStatus}</span>
		</Card>
	);
}
