import { Plus } from "lucide-react";
import Button from "../../../../components/common/Button";
import type { SimpleTableColumn } from "../../../../components/ui/tables/SimpleViewTable";
import SimpleViewTable from "../../../../components/ui/tables/SimpleViewTable";
import type { BPBranchViewModel } from "../utils/bp.types";

const columns: SimpleTableColumn<BPBranchViewModel>[] = [
	{
		key: "name",
		header: "Branch Name",
		render: (branch) => <span className="font-medium">{branch.name}</span>,
	},
	{
		key: "id",
		header: "Branch ID",
		render: (branch) => <span className="tabular-nums">{branch.id}</span>,
	},
	{
		key: "status",
		header: "Status",
		render: (branch) => (
			<span
				className={`bp-people-status bp-people-status--${branch.status.toLowerCase()}`}
			>
				{branch.status}
			</span>
		),
	},
];

type BPBranchesProps = {
	branches: BPBranchViewModel[];
	onAddBranch: () => void;
};

const BPBranches = ({ branches, onAddBranch }: BPBranchesProps) => (
	<div className="bp-people">
		<SimpleViewTable
			data={branches}
			columns={columns}
			getRowId={(branch) => branch.id}
			maxHeight="360px"
			ariaLabel="Business partner branches"
			emptyTitle="No branches found"
			emptyDescription="No branches are linked to this business partner."
			emptyContent={
				<Button
					type="button"
					text="Add Branch"
					Icon={Plus}
					iconPosition="left"
					appearance="standard"
					variant="outline"
					size="sm"
					onClick={onAddBranch}
				/>
			}
		/>
	</div>
);

export default BPBranches;
