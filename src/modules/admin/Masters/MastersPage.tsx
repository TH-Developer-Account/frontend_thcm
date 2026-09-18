import { useMemo, useState } from "react";

import { MasterLineItemTable } from "../../../components/ui/tables/LineItemTable/MasterLineItemTable";
import {
	useManageMasterData,
	useMasterData,
} from "../../../hooks/useMasterData";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import { MasterSidebar } from "./MasterSidebar";

import type { MasterItem, MasterName } from "./masterData.types";
import { DEFAULT_MASTER } from "./master.data.constant";
import {
	buildCreateMasterPayload,
	buildUpdateMasterPayload,
	getMasterCounts,
	getMasterItems,
} from "./master.data.mapper";

const MastersPage = () => {
	const [activeMaster, setActiveMaster] = useState<MasterName>(DEFAULT_MASTER);

	const { data, isLoading, isFetching } = useMasterData();

	const manageMaster = useManageMasterData();

	const items = useMemo(
		() => getMasterItems(data, activeMaster),
		[data, activeMaster],
	);

	const counts = useMemo(() => getMasterCounts(data), [data]);

	const handleAdd = async (item: MasterItem) => {
		const payload = buildCreateMasterPayload(activeMaster, item);

		await manageMaster.mutateAsync({
			payload,
			masterName: activeMaster,
		});
	};

	const handleUpdate = async (item: MasterItem) => {
		const payload = buildUpdateMasterPayload(activeMaster, item);

		await manageMaster.mutateAsync({
			payload,
			masterName: activeMaster,
		});
	};

	return (
		<PageSectionLayout>
			<div className="flex h-[calc(100vh-100px)] min-h-0 gap-4">
				<div className="shrink-0">
					<MasterSidebar
						activeMaster={activeMaster}
						onSelectMaster={setActiveMaster}
						counts={counts}
						isCompact={false}
					/>
				</div>

				<div className="min-w-0 flex-1">
					<MasterLineItemTable
						title={activeMaster}
						items={items}
						onAdd={handleAdd}
						onUpdate={handleUpdate}
						isSaving={manageMaster.isPending}
					/>
				</div>

				{(isLoading || isFetching) && (
					<span className="sr-only">Loading master data</span>
				)}
			</div>
		</PageSectionLayout>
	);
};

export default MastersPage;
