// modules/audit/dealerAudit/pages/CreateDealerAuditPage.tsx
//
// Admin / audit manager: pick a published checklist, a period (quarter or
// year), a reviewer and the dealers. One audit is created per dealer. The
// backend rejects duplicates (same dealer, facility, type and period).

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { Alert } from "../../../../components/common/Alert";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import FormInput from "../../../../components/forms/FormInput";
import MultiSelectInput from "../../../../components/forms/MultiSelectInput";
import SelectInput from "../../../../components/forms/SelectInput";
import PageNavigation from "../../../../components/ui/PageNavigation/PageNavigation";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { dealerAuditContent as content } from "../dealer-audit.content";
import { toDateInputValue } from "../../shared/execution/audit-execution.format";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { createDealerAuditSchema } from "../dealer-audit.schemas";
import {
	formatPeriodLabel,
	getPeriodOf,
	getSelectableYears,
} from "../dealer-audit.sla";
import type {
	CreateDealerAuditFormValues,
	DealerAuditPeriodType,
	DealerAuditQuarter,
} from "../dealer-audit.types";
import { useCreateDealerAudits } from "../hooks/useDealerAuditMutations";
import { useDealerOptions, useReviewerOptions } from "../hooks/useDealerAudits";
import { useDealerChecklistTemplates } from "../hooks/useDealerChecklistTemplates";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";

const text = content.ui.create;

const QUARTERS: readonly DealerAuditQuarter[] = [1, 2, 3, 4];
const PERIOD_TYPES: readonly DealerAuditPeriodType[] = ["QUARTERLY", "YEARLY"];

// Module-level so the query key stays stable between renders.
const PUBLISHED_TEMPLATE_PARAMS = {
	page: 1,
	pageSize: 100,
	search: "",
	statuses: ["PUBLISHED"],
	facilityTypes: [],
	auditCategories: [],
	sortBy: "name",
	sortOrder: "asc",
} as const;

export default function CreateDealerAuditPage() {
	const navigate = useNavigate();
	const templates = useDealerChecklistTemplates({
		...PUBLISHED_TEMPLATE_PARAMS,
		statuses: [...PUBLISHED_TEMPLATE_PARAMS.statuses],
		facilityTypes: [],
		auditCategories: [],
	});
	const dealers = useDealerOptions();
	const reviewers = useReviewerOptions();
	const {
		mutateAsync: createAudits,
		isPending,
		error,
		reset,
	} = useCreateDealerAudits();

	const schema = useMemo(() => createDealerAuditSchema(), []);
	const currentPeriod = useMemo(() => getPeriodOf(new Date(), "QUARTERLY"), []);

	const {
		control,
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<CreateDealerAuditFormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			templateId: "",
			dealerIds: [],
			reviewerId: "",
			periodType: "QUARTERLY",
			year: currentPeriod.year,
			quarter: currentPeriod.quarter,
			dueDate: "",
		},
	});

	const periodType = useWatch({ control, name: "periodType" });

	const templateOptions = useMemo(
		() =>
			templates.rows.map((row) => ({
				value: row.id,
				label: `${row.name} · v${row.version}`,
			})),
		[templates.rows],
	);
	const reviewerOptions = useMemo(
		() =>
			(reviewers.data ?? []).map((reviewer) => ({
				value: reviewer.id,
				label: reviewer.designation
					? `${reviewer.name} — ${reviewer.designation}`
					: reviewer.name,
			})),
		[reviewers.data],
	);
	const dealerOptions = useMemo(
		() =>
			(dealers.data ?? []).map((dealer) => ({
				value: dealer.id,
				label: [dealer.name, dealer.code, dealer.location]
					.filter(Boolean)
					.join(" · "),
			})),
		[dealers.data],
	);
	const periodTypeOptions = PERIOD_TYPES.map((value) => ({
		value,
		label: text.periodTypes[value],
	}));
	const yearOptions = useMemo(
		() =>
			getSelectableYears().map((year) => ({
				value: String(year),
				label: formatPeriodLabel({ type: "YEARLY", year, quarter: null }),
			})),
		[],
	);
	const quarterOptions = QUARTERS.map((quarter) => ({
		value: String(quarter),
		label: content.ui.list.quarters[quarter],
	}));

	const onSubmit = handleSubmit(async (values) => {
		reset();
		try {
			await createAudits(values);
			navigate(DEALER_AUDIT_ROUTES.audits.list);
		} catch {
			// Shown through `error` below; the form keeps what was entered.
		}
	});

	const hasMasterError =
		templates.isError || dealers.isError || reviewers.isError;

	return (
		<PageSectionLayout className="audit-page audit-page-narrow">
			<header className="flex items-start gap-3">
				<PageNavigation
					variant="button"
					direction="back"
					ariaLabel={text.back}
					to={DEALER_AUDIT_ROUTES.audits.list}
				/>
				<div>
					<h1 className="text-lg font-semibold text-(--color-text-primary)">
						{text.title}
					</h1>
					<p className="text-sm text-(--color-text-secondary)">
						{text.subtitle}
					</p>
				</div>
			</header>

			<form
				noValidate
				onSubmit={(event) => void onSubmit(event)}
				className="audit-stack"
			>
				{hasMasterError ? (
					<Alert
						variant="error"
						type="banner"
						title={text.mastersFailedTitle}
						description={text.mastersFailedDescription}
						primaryAction={{
							label: text.retry,
							onClick: () => {
								void templates.refetch();
								void dealers.refetch();
								void reviewers.refetch();
							},
						}}
					/>
				) : null}

				<Card
					variant="default"
					// title={text.checklistSection}
					padding="default"
					footer={
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								text={text.cancel}
								appearance="standard"
								variant="outline"
								disabled={isPending}
								onClick={() => navigate(DEALER_AUDIT_ROUTES.audits.list)}
							/>
							<Button
								type="submit"
								text={isPending ? text.creating : text.create}
								appearance="standard"
								variant="brand"
								loading={isPending}
								disabled={isPending}
							/>
						</div>
					}
				>
					<Controller
						control={control}
						name="templateId"
						render={({ field }) => (
							<SelectInput
								label={text.template}
								required
								options={templateOptions}
								value={
									templateOptions.find(
										(option) => option.value === field.value,
									) ?? null
								}
								onChange={(option) => field.onChange(option?.value ?? "")}
								isDisabled={isPending || templates.isLoading}
								placeholder={
									templates.isLoading ? text.loading : text.templatePlaceholder
								}
								helperText={text.templateHelp}
								error={errors.templateId?.message}
							/>
						)}
					/>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mt-2">
						<Controller
							control={control}
							name="periodType"
							render={({ field }) => (
								<SelectInput
									label={text.periodType}
									required
									options={periodTypeOptions}
									value={
										periodTypeOptions.find(
											(option) => option.value === field.value,
										) ?? null
									}
									onChange={(option) => {
										const next = PERIOD_TYPES.find(
											(type) => type === option?.value,
										);
										if (!next) return;
										field.onChange(next);
										setValue(
											"quarter",
											next === "YEARLY" ? null : currentPeriod.quarter,
										);
									}}
									isDisabled={isPending}
								/>
							)}
						/>
						<Controller
							control={control}
							name="year"
							render={({ field }) => (
								<SelectInput
									label={text.year}
									required
									options={yearOptions}
									value={
										yearOptions.find(
											(option) => option.value === String(field.value),
										) ?? null
									}
									onChange={(option) =>
										field.onChange(option ? Number(option.value) : field.value)
									}
									isDisabled={isPending}
								/>
							)}
						/>
						{periodType === "QUARTERLY" ? (
							<Controller
								control={control}
								name="quarter"
								render={({ field }) => (
									<SelectInput
										label={text.quarter}
										required
										options={quarterOptions}
										value={
											quarterOptions.find(
												(option) => option.value === String(field.value),
											) ?? null
										}
										onChange={(option) =>
											field.onChange(
												QUARTERS.find(
													(quarter) => String(quarter) === option?.value,
												) ?? null,
											)
										}
										isDisabled={isPending}
										error={errors.quarter?.message}
									/>
								)}
							/>
						) : null}
						<FormInput
							type="date"
							label={text.dueDate}
							required
							min={toDateInputValue(new Date())}
							disabled={isPending}
							error={errors.dueDate?.message}
							{...register("dueDate")}
						/>
					</div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-2">
						<Controller
							control={control}
							name="reviewerId"
							render={({ field }) => (
								<SelectInput
									label={text.reviewer}
									required
									options={reviewerOptions}
									value={
										reviewerOptions.find(
											(option) => option.value === field.value,
										) ?? null
									}
									onChange={(option) => field.onChange(option?.value ?? "")}
									isDisabled={isPending || reviewers.isLoading}
									placeholder={
										reviewers.isLoading
											? text.loading
											: text.reviewerPlaceholder
									}
									error={errors.reviewerId?.message}
								/>
							)}
						/>

						<Controller
							control={control}
							name="dealerIds"
							render={({ field }) => (
								<div className="space-y-2">
									<MultiSelectInput
										label={text.dealers}
										required
										options={dealerOptions}
										value={dealerOptions.filter((option) =>
											field.value.includes(option.value),
										)}
										onValueChange={({ value }) =>
											field.onChange(value.map((option) => option.value))
										}
										isDisabled={isPending || dealers.isLoading}
										placeholder={
											dealers.isLoading ? text.loading : text.dealersPlaceholder
										}
										error={errors.dealerIds?.message}
									/>
									<div className="flex items-center justify-between gap-2">
										<span className="text-xs text-(--color-text-secondary)">
											{content.ui.create.dealersSelected.replace(
												"{count}",
												String(field.value.length),
											)}
										</span>
										<div className="flex gap-2">
											<Button
												type="button"
												text={text.selectAllDealers}
												appearance="standard"
												variant="outline"
												size="sm"
												disabled={isPending || dealerOptions.length === 0}
												onClick={() =>
													field.onChange(
														dealerOptions.map((option) => option.value),
													)
												}
											/>
											<Button
												type="button"
												text={text.clearDealers}
												appearance="standard"
												variant="outline"
												size="sm"
												disabled={isPending || field.value.length === 0}
												onClick={() => field.onChange([])}
											/>
										</div>
									</div>
								</div>
							)}
						/>
					</div>
				</Card>

				{error ? (
					<p className="form-error-text" role="alert">
						{getAuditActionErrorMessage(error, "audits")}
					</p>
				) : null}
			</form>
		</PageSectionLayout>
	);
}
