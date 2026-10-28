// handouts/NewHandoutPage.tsx
// "New handout request": details card + the CRF souvenir catalog (same CRF
// shop API, same tiles / cart summary) + submit.

import { useState } from "react";
import { Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormInput from "../../../components/forms/FormInput";
import { SearchInput } from "../../../components/forms/SearchInput";
import TextareaInput from "../../../components/forms/TextareaInput";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import {
	CRF_CATEGORIES,
	CrfCatalog,
	crfSearchPlaceholder,
} from "../crf";

import { HANDOUT_LIMITS, HANDOUTS_BASE_PATH } from "./handouts.constants";
import { todayInputValue } from "./handouts.schema";
import { useHandoutForm } from "./useHandoutForm";
import "./handouts.css";

// Handouts are souvenirs only — no printed material or artwork tabs.
const SOUVENIR_ONLY = CRF_CATEGORIES.filter(
	(category) => category.value === "SOUVENIR",
);

export default function NewHandoutPage() {
	const navigate = useNavigate();
	const form = useHandoutForm();
	const [search, setSearch] = useState("");

	const { values, errors, setField } = form;

	return (
		<PageSectionLayout>
			<div className="handout-page">
				<PageHeader
					headerText="New handout request"
					subtitleText="Request souvenirs for premises use. One approver, then hand delivery by the delivery team."
					navigation={{
						variant: "breadcrumbs",
						ariaLabel: "New handout page location",
						breadcrumbs: [
							{ label: "Home Screen", href: "/" },
							{ label: "EPC Listing", href: "/marketing/activity-planner/listing" },
							{ label: "Handouts", href: HANDOUTS_BASE_PATH },
							{ label: "New request" },
						],
						separator: "›",
					}}
				/>

				<Card
					padding="compact"
					title="Request details"
					footer={
						<p className="handout-note">
							Requested by, designation and department are taken from your
							profile.
						</p>
					}
				>
					<div className="handout-form-grid">
						<div className="is-wide">
							<FormInput
								name="purpose"
								label="Purpose"
								required
								value={values.purpose}
								maxLength={HANDOUT_LIMITS.PURPOSE}
								placeholder="e.g. Visiting customer delegation"
								onChange={(event) => setField("purpose", event.target.value)}
								error={errors.purpose}
							/>
						</div>

						<FormInput
							name="requiredBy"
							type="date"
							label="Required by"
							required
							min={todayInputValue()}
							value={values.requiredBy}
							onChange={(event) => setField("requiredBy", event.target.value)}
							error={errors.requiredBy}
						/>

						<FormInput
							name="contactPhone"
							type="tel"
							inputMode="numeric"
							label="Contact number"
							required
							maxLength={10}
							value={values.contactPhone}
							placeholder="10-digit mobile number"
							onChange={(event) =>
								setField(
									"contactPhone",
									event.target.value.replace(/\D/g, "").slice(0, 10),
								)
							}
							error={errors.contactPhone}
						/>

						<div className="is-wide">
							<FormInput
								name="deliverTo"
								label="Deliver to"
								required
								value={values.deliverTo}
								maxLength={HANDOUT_LIMITS.DELIVER_TO}
								placeholder="Block, floor, room / reception"
								onChange={(event) => setField("deliverTo", event.target.value)}
								error={errors.deliverTo}
							/>
						</div>

						<div className="is-wide">
							<TextareaInput
								name="remarks"
								label="Remarks"
								rows={3}
								maxLength={HANDOUT_LIMITS.REMARKS}
								value={values.remarks}
								onChange={(event) => setField("remarks", event.target.value)}
								error={errors.remarks}
							/>
						</div>
					</div>
				</Card>

				<Card
					padding="compact"
					title="Souvenirs"
					actions={
						<SearchInput
							value={search}
							onChange={setSearch}
							placeholder={crfSearchPlaceholder("SOUVENIR")}
						/>
					}
					footer={
						<div className="handout-actions">
							<Button
								type="button"
								text="Cancel"
								appearance="standard"
								variant="outline"
								size="sm"
								disabled={form.submitting}
								onClick={() => navigate(HANDOUTS_BASE_PATH)}
							/>
							<Button
								type="button"
								text={form.submitting ? "Submitting..." : "Submit for approval"}
								Icon={Send}
								iconPosition="left"
								appearance="standard"
								variant="brand"
								size="sm"
								disabled={form.submitting}
								onClick={() => void form.submit()}
							/>
						</div>
					}
				>
					<CrfCatalog
						options={[]}
						categories={SOUVENIR_ONLY}
						defaultCategory="SOUVENIR"
						items={form.items}
						onChange={form.setItems}
						errors={form.itemErrors}
						search={search}
						onSearchChange={setSearch}
						hideToolbar
					/>
				</Card>
			</div>
		</PageSectionLayout>
	);
}
