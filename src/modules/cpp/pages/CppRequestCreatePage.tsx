// pages/CppRequestCreatePage.tsx — "Create new CPP request".
// Top section : header + Request details card (common data)
// Bottom      : tabs (one file per tab) → justification → sticky action bar
import { useEffect, type ComponentType } from "react";
import {
	Controller,
	FormProvider,
	useFormContext,
	useWatch,
} from "react-hook-form";

// import { Badge } from "../../../components/common/Badge";
import Card from "../../../components/common/Card";
import Checkbox from "../../../components/forms/Checkbox";
import Radio from "../../../components/forms/Radio";
import TextareaInput from "../../../components/forms/TextareaInput";
import ApprovalActionsBar from "../../../components/ui/ApprovalActionsBar";
import { FilterTabs } from "../../../components/ui/FilterTabs/FilterTabs";
import type { FilterTabItem } from "../../../components/ui/FilterTabs/FilterTabs.types";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import {
	RhfInput,
	RhfSelect,
	toOptions,
	useFieldError,
} from "../components/CppFields";
import {
	CPP_LISTING_PATH,
	getTabsWithErrors,
	useCppRequestForm,
} from "../hooks/useCppRequestForm";
import AmortisationTab from "../tabs/AmortisationTab";
import FinancialImpactTab from "../tabs/FinancialImpactTab";
import MasterDataTab from "../tabs/MasterDataTab";
import MaterialCostTrackerTab from "../tabs/MaterialCostTrackerTab";
import OtherDataTab from "../tabs/OtherDataTab";
import PurchasingDetailsTab from "../tabs/PurchasingDetailsTab";
import WorkflowTab from "../tabs/WorkflowTab";
import type { CppFormValues, CppTabKey } from "../types/cpp.types";
import {
	CPP_EFFECTS,
	CPP_REASONS,
	CPP_TABS,
	MATERIAL_COST_TRACKER_ENABLED,
	MIN_JUSTIFICATION,
	NEW_PART_REASON,
} from "../utils/cpp.utils";

const TAB_BODY: Record<CppTabKey, ComponentType> = {
	purchasing: PurchasingDetailsTab,
	other: OtherDataTab,
	master: MasterDataTab,
	financial: FinancialImpactTab,
	workflow: WorkflowTab,
	tracker: MaterialCostTrackerTab,
	amortisation: AmortisationTab,
};

const RequestDetailsCard = () => {
	const { control, setValue } = useFormContext<CppFormValues>();
	const reason = useWatch({ control, name: "reason" });
	const typeError = useFieldError("materialType");
	const isNewPart = reason === NEW_PART_REASON;

	// Effect (Q/C/D) applies to existing materials only.
	useEffect(() => {
		if (isNewPart) setValue("effects", []);
	}, [isNewPart, setValue]);

	return (
		<Card title="Request details" size="small">
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Controller
					name="materialType"
					control={control}
					render={({ field }) => (
						<Radio
							name="materialType"
							groupLabel="Material type"
							required
							options={[
								{ label: "Direct", value: "Direct" },
								{ label: "Indirect", value: "Indirect" },
							]}
							selectedValue={field.value}
							onChange={field.onChange}
							error={typeError}
						/>
					)}
				/>
				<div className="">
					<span className="form-label">
						Commodity price adjustment – effect on
					</span>

					<Controller
						name="effects"
						control={control}
						render={({ field }) => (
							<div className="mt-2 flex flex-row flex-wrap items-center gap-x-8 gap-y-2">
								{CPP_EFFECTS.map((effect) => (
									<div key={effect} className="w-auto shrink-0">
										<Checkbox
											label={effect}
											disabled={isNewPart}
											checked={field.value.includes(effect)}
											onChange={(checked) =>
												field.onChange(
													checked
														? [...field.value, effect]
														: field.value.filter((item) => item !== effect),
												)
											}
										/>
									</div>
								))}
							</div>
						)}
					/>

					{isNewPart ? (
						<p className="form-helper-text">
							Effect applies to existing materials only.
						</p>
					) : null}
				</div>
				<RhfSelect
					name="reason"
					label="Reason for price update"
					required
					options={toOptions(CPP_REASONS)}
					className="lg:col-span-2"
				/>
				<RhfInput
					name="initiationDate"
					label="CPP initiation date"
					type="date"
					disabled
				/>
				{/* <ReadOnlyField
					label="Approval ref"
					value="Generated on save"
					helperText="System generated"
					isTooltip={false}
				/> */}
			</div>
		</Card>
	);
};

const JustificationCard = () => {
	const { control } = useFormContext<CppFormValues>();

	return (
		<Card title="Justification" size="small">
			<Controller
				name="justification"
				control={control}
				render={({ field, fieldState }) => (
					<TextareaInput
						{...field}
						label="Justification for this price change"
						required
						rows={5}
						maxLength={2000}
						placeholder={`Explain the reason, negotiation outcome and why the recommended supplier was chosen (min. ${MIN_JUSTIFICATION} characters)`}
						error={fieldState.error?.message}
						helperText={`${field.value.trim().length} / ${MIN_JUSTIFICATION} min`}
						isTooltip={false}
					/>
				)}
			/>
		</Card>
	);
};

const CppRequestCreatePage = () => {
	const { form, activeTab, setActiveTab, busy, saveDraft, submit, cancel } =
		useCppRequestForm();
	const errorTabs = getTabsWithErrors(form.formState.errors);

	const items: FilterTabItem<CppTabKey>[] = CPP_TABS.map((tab) => ({
		value: tab.value,
		tooltipLabel: tab.label,
		label: (
			<>
				{tab.label}
				{errorTabs.includes(tab.value) ? (
					<span
						className="ml-1 text-[var(--color-error)]"
						aria-label="has errors"
					>
						●
					</span>
				) : tab.value === "tracker" && !MATERIAL_COST_TRACKER_ENABLED ? (
					<span className="ml-1 text-xs opacity-60">(Off)</span>
				) : null}
			</>
		),
	}));

	const ActiveTab = TAB_BODY[activeTab];

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Create new CPP request"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Create CPP request page location",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{ label: "CPP requests", href: CPP_LISTING_PATH },
						{ label: "New request" },
					],
					separator: "›",
				}}
				// headerChildren={
				// 	<div className="flex items-center gap-2">
				// 		<Badge>Draft</Badge>
				// 		<Badge>{materialType || "Type not set"}</Badge>
				// 	</div>
				// }
			/>

			<FormProvider {...form}>
				{/* div, not <form>: Enter / tab buttons must never trigger submit. */}
				<div className="flex flex-col gap-4">
					<RequestDetailsCard />

					<FilterTabs
						id="cpp-request-tabs"
						ariaLabel="CPP request sections"
						items={items}
						value={activeTab}
						onChange={setActiveTab}
						variant="underline"
						className="border-b-none"
					/>

					<div role="tabpanel">
						<ActiveTab />
					</div>

					<JustificationCard />

					<div className="sticky bottom-0 z-20 bg-white">
						<ApprovalActionsBar
							variant="proposer"
							showBack={false}
							loading={busy}
							canCancel
							onCancel={cancel}
							canSaveDraft
							onSaveDraft={saveDraft}
							canSubmit
							onSubmit={() => submit()}
							submitLabel="Submit for approval"
						/>
					</div>
				</div>
			</FormProvider>
		</PageSectionLayout>
	);
};

export default CppRequestCreatePage;
