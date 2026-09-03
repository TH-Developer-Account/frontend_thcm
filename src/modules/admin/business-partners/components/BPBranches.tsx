import type { SimpleTableColumn } from "../../../../components/ui/tables/SimpleViewTable";
import SimpleViewTable from "../../../../components/ui/tables/SimpleViewTable";
import type { BPBranchViewModel } from "../utils/bp.types";

const columns: SimpleTableColumn<BPBranchViewModel>[] = [
	{
		key: "name",
		header: "Branch Name",
		widthUnits: 4,
		minWidth: 220,
		render: (branch) => <span className="font-medium">{branch.name}</span>,
	},
	{
		key: "id",
		header: "Branch ID",
		widthUnits: 3,
		minWidth: 220,
		render: (branch) => <span className="tabular-nums">{branch.id}</span>,
	},
	{
		key: "status",
		header: "Status",
		widthUnits: 1,
		minWidth: 110,
		render: (branch) => (
			<span
				className={`bp-people-status bp-people-status--${branch.status.toLowerCase()}`}
			>
				{branch.status}
			</span>
		),
	},
];

const BPBranches = ({ branches }: { branches: BPBranchViewModel[] }) => (
	<div className="bp-people">
		<div className="bp-people-header">
			<div>
				<h3 className="bp-people-title">Branches</h3>
				<p className="bp-people-description">
					Offices linked to this business partner.
				</p>
			</div>
		</div>
		<SimpleViewTable
			data={branches}
			columns={columns}
			getRowId={(branch) => branch.id}
			maxHeight="360px"
			ariaLabel="Business partner branches"
			emptyTitle="No branches found"
			emptyDescription="No branches are linked to this business partner."
		/>
	</div>
);

export default BPBranches;
