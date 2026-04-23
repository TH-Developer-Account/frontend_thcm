import type { ColumnDef } from "@tanstack/react-table";
import type { EPCRow } from "../../../../../utils/types";
import { Badge } from "../../../../../components/common/Badge";
import { status } from "../../../constant";
import Button from "../../../../../components/common/Button";
import { Edit, Plus } from "lucide-react";
import { NavLink } from "react-router-dom";

type epcColumnActions = {
	onEPFCreate: () => void;
	onCRFCreate: () => void;
};

export const getEPCColumns = ({
	onEPFCreate,
	onCRFCreate,
}: epcColumnActions): ColumnDef<EPCRow>[] => [
	{
		accessorKey: "proposal_number",
		header: "EPC No",
		cell: ({ row }) => {
			const epcId = row.original.id;
			console.log("row", row.original);
			return (
				<div>
					<NavLink
						to={`/marketing/epf/${epcId}`}
						className="text-blue-600 underline"
					>
						<div className="font-medium">{row.original.proposal_number}</div>
					</NavLink>
				</div>
			);
		},
	},
	{
		accessorKey: "event_name",
		header: "Event Name",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.event_name}</div>
			</div>
		),
	},
	{
		accessorKey: "created_by",
		header: "Created By",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{`${row.original.first_name} ${row.original.last_name}`}</div>
			</div>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => (
			<Badge
				status={
					status[(row.original.status as keyof typeof status) || "Pending"]
				}
			/>
		),
	},
	{
		accessorKey: "location",
		header: "Location",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.location}</div>
			</div>
		),
	},

	{
		accessorKey: "crf",
		header: "CRF",
		cell: ({ row }) => {
			const epcId = row.original.id;
			const crf = row.original?.crf_id || null;
			return (
				<div>
					<div className="font-medium">
						<Button
							className="rounded-full p-1.5"
							Icon={crf ? Edit : Plus}
							status="brand"
							iconColor="#fff"
							onClick={() => {
								localStorage.setItem("epcId", epcId);
								onCRFCreate();
							}}
						/>
					</div>
				</div>
			);
		},
	},

	{
		accessorKey: "epf",
		header: "EPF",
		cell: ({ row }) => {
			const epf = row.original?.epf_id || null;
			return (
				<div>
					<div className="font-medium">
						{row.original.epf_id ? (
							<Button
								className="rounded-full p-1.5"
								Icon={epf ? Edit : Plus}
								status="brand"
								onClick={() => {
									localStorage.setItem(
										"epcInfo",
										JSON.stringify({
											epcId: row.original.id,
											crfId: row.original.crf_id,
											epfId: row.original.epf_id,
										}),
									);
									onEPFCreate();
								}}
							/>
						) : (
							<Button
								className="rounded-full p-1.5"
								Icon={epf ? Edit : Plus}
								status="brand"
								onClick={() => {
									localStorage.setItem(
										"epcInfo",
										JSON.stringify({
											epcId: row.original.id,
											crfId: row.original.crf_id,
											epfId: row.original.epf_id,
										}),
									);
									onEPFCreate();
								}}
							/>
						)}
					</div>
				</div>
			);
		},
	},
];
