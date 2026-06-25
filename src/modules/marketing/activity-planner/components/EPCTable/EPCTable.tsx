import React from "react";
import { useNavigate } from "react-router-dom";
import type { SortingState } from "@tanstack/react-table";

import DataTable from "../../../../../components/ui/DataTable";
import type { EpcListItem } from "../../types/epc.types";

import { getEPCColumns } from "./columns";
import { useAuth } from "../../../../../context/Auth/useAuth";

type EPCTableProps = {
	data: EpcListItem[];
	loading?: boolean;

	sorting: SortingState;
	onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>;

	pageIndex: number;
	pageSize: number;
	pageCount: number;

	onPageChange: (pageIndex: number) => void;
	onPageSizeChange: (pageSize: number) => void;
};

const EPCTable = ({
	data,
	loading = false,
	sorting,
	onSortingChange,
	pageIndex,
	pageSize,
	pageCount,
	onPageChange,
	onPageSizeChange,
}: EPCTableProps) => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const columns = React.useMemo(
		() =>
			getEPCColumns({
				onLeadCreate: () => {
					navigate("/marketing/leads/create");
				},
				currentUserId: user?.id,
			}),
		[navigate, user?.id],
	);

	return (
		<DataTable<EpcListItem>
			data={data}
			columns={columns}
			loading={loading}
			sorting={sorting}
			onSortingChange={onSortingChange}
			manualSorting
			manualPagination
			pageIndex={pageIndex}
			pageSize={pageSize}
			pageCount={pageCount}
			onPageChange={onPageChange}
			onPageSizeChange={onPageSizeChange}
			scrollTargetId="tableScroll"
			emptyTitle="No EPC records found"
			emptyDescription="Try adjusting filters or search"
			className="h-[70vh]"
		/>
	);
};

export default EPCTable;
