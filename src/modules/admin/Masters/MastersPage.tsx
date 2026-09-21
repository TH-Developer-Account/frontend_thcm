import { useEffect, useMemo, useState } from "react";

import { MasterLineItemTable } from "./MasterLineItemTable";
import { MasterDetailPanel } from "./MasterDetailPanel";
import { MasterSidebar } from "./MasterSidebar";

import {
	useManageMasterData,
	useMasterData,
} from "../../../hooks/useMasterData";

import PageSectionLayout from "../../../layout/PageSectionLayout";

import type { MasterItem, MasterName } from "./masterData.types";

import { DEFAULT_MASTER } from "./master.data.constant";

import {
	buildCreateMasterPayload,
	buildUpdateMasterPayload,
	getMasterCounts,
	getMasterItems,
} from "./master.data.mapper";

type ToastState = {
	type: "success" | "error";
	message: string;
} | null;

const getErrorMessage = (error: unknown): string => {
	if (typeof error === "object" && error !== null && "response" in error) {
		const response = (
			error as {
				response?: {
					data?: {
						message?: string;
						error?: string;
					};
				};
			}
		).response;

		return response?.data?.error || response?.data?.message || "Request failed";
	}

	return error instanceof Error ? error.message : "Request failed";
};

const MastersPage = () => {
	const [activeMaster, setActiveMaster] = useState<MasterName>(DEFAULT_MASTER);

	const [selectedItem, setSelectedItem] = useState<MasterItem | null>(null);

	const [toast, setToast] = useState<ToastState>(null);

	const { data, isLoading, isFetching } = useMasterData();

	const manageMaster = useManageMasterData();

	const items = useMemo(
		() => getMasterItems(data, activeMaster),
		[data, activeMaster],
	);

	const counts = useMemo(() => getMasterCounts(data), [data]);

	/*
	 * Close the detail panel when switching
	 * between master categories.
	 */
	useEffect(() => {
		setSelectedItem(null);
	}, [activeMaster]);

	/*
	 * Keep the selected record synchronized
	 * after query invalidation/refetch.
	 */
	useEffect(() => {
		if (!selectedItem) return;

		const refreshedItem = items.find((item) => item.id === selectedItem.id);

		if (refreshedItem) {
			setSelectedItem(refreshedItem);
		}
	}, [items, selectedItem?.id]);

	useEffect(() => {
		if (!toast) return;

		const timer = window.setTimeout(() => setToast(null), 3500);

		return () => window.clearTimeout(timer);
	}, [toast]);

	const handleAdd = async (item: MasterItem) => {
		try {
			const response = await manageMaster.mutateAsync({
				payload: buildCreateMasterPayload(activeMaster, item),
				masterName: activeMaster,
			});

			setToast({
				type: "success",
				message: response?.message || `${activeMaster} created successfully`,
			});
		} catch (error) {
			setToast({
				type: "error",
				message: getErrorMessage(error),
			});

			throw error;
		}
	};

	const handleUpdate = async (item: MasterItem) => {
		try {
			const response = await manageMaster.mutateAsync({
				payload: buildUpdateMasterPayload(activeMaster, item),
				masterName: activeMaster,
			});

			setSelectedItem(item);

			setToast({
				type: "success",
				message: response?.message || `${activeMaster} updated successfully`,
			});
		} catch (error) {
			setToast({
				type: "error",
				message: getErrorMessage(error),
			});

			throw error;
		}
	};

	return (
		<PageSectionLayout>
			<div className="relative flex h-[calc(100vh-100px)] min-h-0 gap-3">
				<div className="w-55 shrink-0">
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
						selectedId={selectedItem?.id}
						onSelect={setSelectedItem}
						onAdd={handleAdd}
						onUpdate={handleUpdate}
						isSaving={manageMaster.isPending}
					/>
				</div>

				{selectedItem && (
					<div className="w-120 shrink-0">
						<MasterDetailPanel
							masterName={activeMaster}
							item={selectedItem}
							onSave={handleUpdate}
							onClose={() => setSelectedItem(null)}
							isSaving={manageMaster.isPending}
						/>
					</div>
				)}

				{toast && (
					<div
						role={toast.type === "error" ? "alert" : "status"}
						className={`master-toast master-toast-${toast.type}`}
					>
						{toast.message}
					</div>
				)}

				{(isLoading || isFetching) && (
					<span className="sr-only">Loading master data</span>
				)}
			</div>
		</PageSectionLayout>
	);
};

export default MastersPage;
