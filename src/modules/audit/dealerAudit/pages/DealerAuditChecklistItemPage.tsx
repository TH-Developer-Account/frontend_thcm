import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
	Check,
	ChevronLeft,
	ChevronRight,
	ClipboardList,
	ListChecks,
} from "lucide-react";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import { Badge } from "../../../../components/common/Badge";
import TextareaInput from "../../../../components/forms/TextareaInput";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import {
	LivePhotoUploadField,
	type LivePhotoValue,
} from "../../shared/checklist/LivePhotoUploadField";
import {
	flattenChecklist,
	getAuditProgress,
	mapChecklistFormToPayload,
	mapChecklistItemToForm,
} from "../dealer-audit.utils";
import type { ChecklistItemFormValues } from "../../shared/shared.audit.types";
import useDealerAudit from "../dealer-audit.store";
import AuditProgress from "../../shared/checklist/AuditProgress";
import ScoreSelector from "../../shared/checklist/ScoreSelector";

type DealerAuditChecklistItemPageProps = {
	imagesRequired?: boolean;
	minImages?: number;
	maxImages?: number;
};

const EMPTY_FORM: ChecklistItemFormValues = {
	score: null,
	remarks: "",
	evidence: [],
};

export default function DealerAuditChecklistItemPage({
	imagesRequired = true,
	minImages = 2,
	maxImages = 5,
}: DealerAuditChecklistItemPageProps) {
	const { auditId = "demo-audit", itemId = "" } = useParams();

	const checklistPath = DEALER_AUDIT_ROUTES.execution.checklist(auditId);

	const navigate = useNavigate();
	const { checklist, updateItem } = useDealerAudit();
	const items = useMemo(() => flattenChecklist(checklist), [checklist]);
	const index = items.findIndex((entry) => entry.id === itemId);
	const item = items[index];
	const previous = index > 0 ? items[index - 1] : undefined;
	const next =
		index >= 0 && index < items.length - 1 ? items[index + 1] : undefined;
	const progress = getAuditProgress(checklist);
	const mappedForm = useMemo(
		() => (item ? mapChecklistItemToForm(item) : EMPTY_FORM),
		[item],
	);
	const [formState, setFormState] = useState<{
		itemId: string;
		values: ChecklistItemFormValues;
	}>(() => ({ itemId: item?.id ?? "", values: mappedForm }));
	const [saving, setSaving] = useState(false);
	const touchStart = useRef<{ x: number; y: number } | null>(null);

	/*
	 * Derive a fresh form when the route changes to another item. State is only
	 * written in event handlers, avoiding a synchronous setState inside an effect.
	 */
	const form = formState.itemId === item?.id ? formState.values : mappedForm;

	const updateForm = (
		updater: (current: ChecklistItemFormValues) => ChecklistItemFormValues,
	) => {
		if (!item) return;

		setFormState((current) => {
			const currentValues =
				current.itemId === item.id ? current.values : mappedForm;

			return {
				itemId: item.id,
				values: updater(currentValues),
			};
		});
	};

	if (!item) {
		return (
			<PageSectionLayout className="dealer-audit-page dealer-audit-page-narrow">
				<Card title="Checklist item not found">
					<Button
						text="Back to checklist"
						variant="brand"
						onClick={() => navigate(checklistPath)}
					/>
				</Card>
			</PageSectionLayout>
		);
	}

	const hasRequiredImages =
		!imagesRequired || form.evidence.length >= minImages;
	const dirty =
		form.score !== item.score ||
		form.remarks !== item.remarks ||
		form.evidence !== item.evidence;

	const go = (target?: typeof item) => {
		if (!target) return;

		if (
			dirty &&
			!window.confirm("You have unsaved changes. Leave this item?")
		) {
			return;
		}

		navigate(DEALER_AUDIT_ROUTES.execution.item(auditId, target.id));
	};

	const save = async () => {
		if (form.score === null || !hasRequiredImages) return;

		setSaving(true);

		try {
			updateItem(item.id, mapChecklistFormToPayload(form));

			if (next) {
				navigate(DEALER_AUDIT_ROUTES.execution.item(auditId, next.id));
			}
		} finally {
			setSaving(false);
		}
	};

	const onTouchEnd = (event: React.TouchEvent) => {
		const start = touchStart.current;
		touchStart.current = null;
		if (!start) return;

		const end = event.changedTouches[0];
		const dx = end.clientX - start.x;
		const dy = end.clientY - start.y;
		if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.25) return;

		if (dx < 0) {
			go(next);
		} else {
			go(previous);
		}
	};

	const saveDisabled = form.score === null || !hasRequiredImages;

	return (
		<PageSectionLayout
			className="dealer-audit-page dealer-audit-page-narrow dealer-audit-item-page"
			onTouchStart={(event: React.TouchEvent) => {
				const touch = event.touches[0];
				touchStart.current = { x: touch.clientX, y: touch.clientY };
			}}
			onTouchEnd={onTouchEnd}
		>
			<div className="dealer-audit-stack dealer-audit-stack-pad-footer sm:pb-0">
				<header className="dealer-audit-header">
					<Button
						appearance="icon"
						variant="secondary"
						Icon={ChevronLeft}
						aria-label="Back to checklist"
						onClick={() => navigate(checklistPath)}
					/>
					<div className="dealer-audit-header-copy">
						<h1 className="dealer-audit-title dealer-audit-title-sm">
							Dealer Audit
						</h1>
						<p className="dealer-audit-subtitle">
							{checklist.dealerName}, {checklist.location}
						</p>
					</div>
					<div className="dealer-audit-item-nav">
						<Button
							appearance="icon"
							variant="transparent"
							Icon={ChevronLeft}
							aria-label="Previous checklist item"
							disabled={!previous}
							onClick={() => go(previous)}
						/>
						<span className="dealer-audit-item-nav-count">
							Item {index + 1} of {items.length}
						</span>
						<Button
							appearance="icon"
							variant="transparent"
							Icon={ChevronRight}
							aria-label="Next checklist item"
							disabled={!next}
							onClick={() => go(next)}
						/>
					</div>
				</header>

				<AuditProgress {...progress} compact />

				<Card
					padding="default"
					variant="outlined"
					className="dealer-audit-item-card"
				>
					<div className="dealer-audit-item-card-content">
						<div className="dealer-audit-item-card-heading">
							<div className="dealer-audit-item-card-meta">
								<Badge variant="success">{item.categoryName}</Badge>
								<span className="dealer-audit-item-code">ID: {item.code}</span>
							</div>
							<h2 className="dealer-audit-item-title">{item.title}</h2>
							<p className="dealer-audit-item-description">
								{item.description}
							</p>
						</div>

						<div className="dealer-audit-item-sections">
							<section className="dealer-audit-item-section">
								<ClipboardList
									size={19}
									className="dealer-audit-item-section-icon"
									aria-hidden="true"
								/>
								<div className="dealer-audit-item-section-content">
									<h3 className="dealer-audit-item-section-title">Parameter</h3>
									<p className="dealer-audit-item-section-text">
										{item.parameter}
									</p>
								</div>
							</section>
							<section className="dealer-audit-item-section">
								<ListChecks
									size={19}
									className="dealer-audit-item-section-icon"
									aria-hidden="true"
								/>
								<div className="dealer-audit-item-section-content">
									<h3 className="dealer-audit-item-section-title">Criteria</h3>
									<ul className="dealer-audit-item-criteria">
										{item.criteria.map((criterion) => (
											<li key={criterion}>{criterion}</li>
										))}
									</ul>
								</div>
							</section>
						</div>
					</div>
				</Card>

				{imagesRequired ? (
					<Card
						title="Photo Evidence"
						subtitle={`Capture at least ${minImages} live photos showing the current condition.`}
						accordion
						defaultExpanded
						actions={
							<span
								className={
									hasRequiredImages
										? "text-xs text-slate-500"
										: "text-xs font-medium text-red-600"
								}
							>
								{form.evidence.length}/{maxImages} photos
							</span>
						}
						padding="compact"
					>
						<LivePhotoUploadField
							required
							minFiles={minImages}
							maxFiles={maxImages}
							value={form.evidence as LivePhotoValue[]}
							disabled={saving}
							onChange={(evidence) =>
								updateForm((current) => ({ ...current, evidence }))
							}
						/>
					</Card>
				) : null}

				<Card
					title="Scoring"
					subtitle="Rate based on compliance with the criteria."
					accordion
					defaultExpanded
					actions={
						<span className="text-xs text-slate-500">
							{form.score ?? 0}/5 points
						</span>
					}
					padding="compact"
				>
					<ScoreSelector
						value={form.score}
						onChange={(score) =>
							updateForm((current) => ({ ...current, score }))
						}
						disabled={saving}
					/>
				</Card>

				<Card title="Remarks" accordion defaultExpanded padding="compact">
					<TextareaInput
						name="remarks"
						label=""
						value={form.remarks}
						maxLength={500}
						rows={4}
						placeholder="Add your observations, remarks or areas of improvement..."
						disabled={saving}
						onChange={(event) =>
							updateForm((current) => ({
								...current,
								remarks: event.target.value,
							}))
						}
					/>
					<div className="mt-1 text-right text-xs text-slate-500">
						{form.remarks.length}/500
					</div>
				</Card>
			</div>

			<div className="dealer-audit-sticky-footer sm:hidden">
				<div className="dealer-audit-sticky-footer-inner">
					<Button
						text="Cancel"
						variant="outline"
						disabled={saving}
						onClick={() => navigate(`/audit/dealer/${auditId}/checklist`)}
					/>
					<Button
						text={next ? "Save & Next" : "Save"}
						variant="brand"
						Icon={next ? ChevronRight : Check}
						iconPosition="right"
						loading={saving}
						disabled={saveDisabled}
						onClick={save}
					/>
				</div>
			</div>

			<div className="dealer-audit-inline-footer hidden sm:flex">
				<Button
					text="Cancel"
					variant="outline"
					disabled={saving}
					onClick={() => navigate(`/audit/dealer/${auditId}/checklist`)}
				/>
				<Button
					text={next ? "Save & Next" : "Save"}
					variant="brand"
					Icon={next ? ChevronRight : Check}
					iconPosition="right"
					loading={saving}
					disabled={saveDisabled}
					onClick={save}
				/>
			</div>
		</PageSectionLayout>
	);
}
