import { useEffect, useRef, useState } from "react";
import { MasterSidebar } from "./MasterSidebar";
import {
	MasterLineItemTable,
	type MasterItem,
} from "../../../../components/ui/MasterLineItemTable";
import { MasterDetailPanel } from "./MasterDetailPanel";
import { useMasterData } from "../../../../hooks/useMasterData";
import PageSectionLayout from "../../../../layout/PageSectionLayout";

// Map each sidebar master key → your data source key
const MASTER_KEYS: Record<string, string> = {
	Branches: "branches",
	Departments: "departments",
	Regions: "regions",
	"Event Names": "eventNames",
	Budget: "budgetMasters",
	Vertical: "vertical",
};

const MastersPage = () => {
	const { data } = useMasterData();

	const [activeMaster, setActiveMaster] = useState("Branches");
	const [selectedItem, setSelectedItem] = useState<MasterItem | null>(null);
	const [localData, setLocalData] = useState<Record<string, MasterItem[]>>({});
	const containerRef = useRef<HTMLDivElement>(null);
	const [isCompact, setIsCompact] = useState(false);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const observer = new ResizeObserver(([entry]) => {
			const width = entry.contentRect.width;

			// compact sidebar until XL layout
			setIsCompact(width < 1000);
		});

		observer.observe(el);

		return () => observer.disconnect();
	}, []);

	const mapNormalMasterItem = (item: any): MasterItem => ({
		id: item.value ?? item.id ?? crypto.randomUUID(),
		label: item.label ?? item.name ?? "",
		code: item.code ?? "",
		description: item.description ?? "",
	});

	const mapBudgetMasterItem = (item: any): MasterItem => ({
		id: item.value ?? item.id ?? crypto.randomUUID(),
		label: item.label ?? "",
		description: item.description ?? "",
		budgetAmount: Number(item.budgetAmount ?? 0),
	});

	const getItems = (masterName: string): MasterItem[] => {
		const key = MASTER_KEYS[masterName] ?? masterName.toLowerCase();
		const apiData = data?.[key] ?? [];

		const apiItems =
			masterName === "Budget"
				? apiData.map(mapBudgetMasterItem)
				: apiData.map(mapNormalMasterItem);

		return localData[masterName] ?? apiItems;
	};
	const setItems = (masterName: string, items: MasterItem[]) => {
		setLocalData((prev) => ({ ...prev, [masterName]: items }));
		// If selected item was deleted, deselect
		if (selectedItem && !items.find((i) => i.id === selectedItem.id)) {
			setSelectedItem(null);
		}
	};

	const handleSave = (updated: MasterItem) => {
		const items = getItems(activeMaster);

		setItems(
			activeMaster,
			items.map((i) => (i.id === updated.id ? updated : i)),
		);
		setSelectedItem(updated);
	};

	const handleMasterChange = (master: string) => {
		setActiveMaster(master);
		setSelectedItem(null);
	};

	const items = getItems(activeMaster);

	// Build counts for sidebar badges
	const counts = Object.fromEntries(
		Object.keys(MASTER_KEYS).map((k) => [k, getItems(k).length]),
	);
	return (
		<PageSectionLayout>
			<div
				ref={containerRef}
				className={`flex gap-4 h-[calc(100vh-100px)] transition-all duration-400 ${
					isCompact ? "flex-col" : "flex-row"
				}`}
			>
				{/* Sidebar */}
				<div className=" shrink-0">
					<MasterSidebar
						activeMaster={activeMaster}
						onSelectMaster={handleMasterChange}
						counts={counts}
						isCompact={isCompact}
					/>
				</div>

				{/* Table */}
				<div className="flex-1 min-w-0">
					<MasterLineItemTable
						title={activeMaster}
						nameLabel={`${activeMaster.replace(/s$/, "")}`}
						items={items}
						selectedId={selectedItem?.id}
						onChange={(updated) => setItems(activeMaster, updated)}
						onSelect={setSelectedItem}
					/>
				</div>

				{/* Detail */}
				<div className="flex-1 min-w-0">
					<MasterDetailPanel
						masterName={activeMaster}
						item={selectedItem}
						onSave={handleSave}
						onClose={() => setSelectedItem(null)}
						key={selectedItem?.id}
					/>
				</div>
			</div>
		</PageSectionLayout>
	);
};

export default MastersPage;
