// modules/audit/dealerAudit/pages/CreateDealerAuditPage.tsx
//
// Admin / audit manager: pick a published checklist, a period (quarter or
// year), a reviewer and the dealers. One audit is created per dealer. The
// backend rejects duplicates (same dealer, facility, type and period).
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { Alert } from "../../../../components/common/Alert";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import DatePickerInput from "../../../../components/common/DatePickerInput";
import UserAsyncSelect, {
	type UserOption,
} from "../../../../components/forms/AsyncSelect";
import SelectInput from "../../../../components/forms/SelectInput";
import PageNavigation from "../../../../components/ui/PageNavigation/PageNavigation";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { dealerAuditContent as content } from "../dealer-audit.content";
import {
	fromDateInputValue,
	toDateInputValue,
} from "../../shared/execution/audit-execution.format";
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
import { useDealerChecklistTemplates } from "../hooks/useDealerChecklistTemplates";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import BusinessPartnerAsyncSelect, {
	type BusinessPartnerOption,
} from "../../../admin/users/BusinessPartnerAsyncSelect";

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
	sortBy: "name",
	sortOrder: "asc",
} as const;

export default function CreateDealerAuditPage() {
	const navigate = useNavigate();
	const templates = useDealerChecklistTemplates({
		...PUBLISHED_TEMPLATE_PARAMS,
		statuses: [...PUBLISHED_TEMPLATE_PARAMS.statuses],
		facilityTypes: [],
	});
	const {
		mutateAsync: createAudits,
		isPending,
		error,
		reset,
	} = useCreateDealerAudits();
	const [reviewer, setReviewer] = useState<UserOption | null>(null);
	const [selectedDealers, setSelectedDealers] = useState<
		BusinessPartnerOption[]
	>([]);
	const schema = useMemo(() => createDealerAuditSchema(), []);
	const currentPeriod = useMemo(() => getPeriodOf(new Date(), "QUARTERLY"), []);

	const {
		control,
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
	const dueDate = useWatch({ control, name: "dueDate" });
	// The form keeps yyyy-mm-dd; the date picker works with a Date.
	const dueDateValue = useMemo(() => fromDateInputValue(dueDate), [dueDate]);

	const templateOptions = useMemo(
		() =>
			templates.rows.map((row) => ({
				value: row.id,
				label: `${row.name} · v${row.version}`,
			})),
		[templates.rows],
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

	const hasMasterError = templates.isError;

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
					<h1 className="text-xl font-semibold text-fg">{text.title}</h1>
					<p className="text-sm text-fg-secondary">{text.subtitle}</p>
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
							},
						}}
					/>
				) : null}

				<Card
					variant="default"
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
					<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
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
						<Controller
							control={control}
							name="dueDate"
							render={({ field }) => (
								<DatePickerInput
									mode="single"
									label={text.dueDate}
									required
									disablePast
									disabled={isPending}
									value={dueDateValue}
									onChange={(date) =>
										field.onChange(
											date instanceof Date ? toDateInputValue(date) : "",
										)
									}
									error={errors.dueDate?.message}
								/>
							)}
						/>
					</div>
					<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Controller
							control={control}
							name="reviewerId"
							render={({ field }) => (
								<UserAsyncSelect
									name="reviewerId"
									label={text.reviewer}
									required
									userType="THCM"
									value={reviewer}
									onChange={(user) => {
										setReviewer(user);
										field.onChange(user?.value ?? "");
									}}
									isDisabled={isPending}
									placeholder={text.reviewerPlaceholder}
									error={errors.reviewerId?.message}
								/>
							)}
						/>

						<Controller
							control={control}
							name="dealerIds"
							render={({ field }) => (
								<div className="space-y-2">
									<BusinessPartnerAsyncSelect
										name="dealerIds"
										label={text.dealers}
										required
										isMulti
										isActive
										bpType="DEALER"
										value={selectedDealers}
										onChange={(next) => {
											setSelectedDealers(next);
											field.onChange(next.map((option) => option.value));
										}}
										isDisabled={isPending}
										placeholder={text.dealersPlaceholder}
										error={errors.dealerIds?.message}
									/>
									<div className="flex items-center justify-between gap-2">
										<span className="text-xs font-medium tabular-nums text-fg-secondary">
											{content.ui.create.dealersSelected.replace(
												"{count}",
												String(field.value.length),
											)}
										</span>
										<Button
											type="button"
											text={text.clearDealers}
											appearance="standard"
											variant="outline"
											size="sm"
											disabled={isPending || field.value.length === 0}
											onClick={() => {
												setSelectedDealers([]);
												field.onChange([]);
											}}
										/>
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
