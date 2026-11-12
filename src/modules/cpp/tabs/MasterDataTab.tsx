// tabs/MasterDataTab.tsx — extra info for the master data controller.
import { Controller, useFormContext } from "react-hook-form";

import Card from "../../../components/common/Card";
import TextareaInput from "../../../components/forms/TextareaInput";
import {
	RhfChips,
	RhfInput,
	RhfSelect,
	toOptions,
} from "../components/CppFields";
import type { CppFormValues } from "../types/cpp.types";
import {
	CPP_PLANTS,
	INCO_TERMS,
	MATERIAL_GROUPS,
	MATERIAL_TYPES,
	PRICE_TYPES,
	TAX_CODES,
	YES_NO,
} from "../utils/cpp.utils";

const MasterDataTab = () => {
	const { control } = useFormContext<CppFormValues>();

	return (
		<Card
			title="Extra info for master data"
			subtitle="Sample fields — to be confirmed with the master data team"
			size="small"
		>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<RhfSelect
					name="masterData.materialGroup"
					label="Material group"
					options={toOptions(MATERIAL_GROUPS)}
				/>
				<RhfSelect
					name="masterData.materialType"
					label="Material type"
					options={toOptions(MATERIAL_TYPES)}
				/>
				<RhfInput
					name="masterData.purchasingGroup"
					label="Purchasing group"
					placeholder="e.g. D07"
				/>
				<RhfSelect
					name="masterData.priceType"
					label="Price type"
					options={toOptions(PRICE_TYPES)}
				/>
				<RhfSelect
					name="masterData.incoTerms"
					label="Inco terms"
					options={toOptions(INCO_TERMS)}
				/>
				<RhfSelect
					name="masterData.taxCode"
					label="Tax code"
					options={toOptions(TAX_CODES)}
				/>
				<RhfInput
					name="masterData.storeLocation"
					label="Store location"
					placeholder="e.g. D012"
				/>
				<RhfInput
					name="masterData.validFrom"
					label="Info record valid from"
					type="date"
				/>
				<RhfSelect
					name="masterData.updateSourceList"
					label="Update source list"
					options={toOptions(YES_NO)}
				/>
				<RhfChips
					name="masterData.plants"
					label="Plants"
					options={CPP_PLANTS}
				/>

				<div className="sm:col-span-2 lg:col-span-3">
					<Controller
						name="masterData.note"
						control={control}
						render={({ field }) => (
							<TextareaInput
								{...field}
								label="Note for master data team"
								rows={3}
							/>
						)}
					/>
				</div>
			</div>
		</Card>
	);
};

export default MasterDataTab;
