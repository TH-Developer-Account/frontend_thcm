import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../../../components/common/Button";
import type { SimpleTableColumn } from "../../../../components/ui/tables/SimpleViewTable";
import SimpleViewTable from "../../../../components/ui/tables/SimpleViewTable";
import { businessPartnerPaths } from "../hooks/useBusinessPartnerForm";
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

type BPBranchesProps = {
	businessPartnerId: string;
	branches: BPBranchViewModel[];
	/** Defaults to true; pass false to hide the "Add Branch" action. */
	canCreateBranch?: boolean;
};

const BPBranches = ({
	businessPartnerId,
	branches,
	canCreateBranch = true,
}: BPBranchesProps) => {
	const navigate = useNavigate();

	const handleAddBranch = () => {
		navigate(
			`${businessPartnerPaths.create()}?parentId=${encodeURIComponent(businessPartnerId)}`,
		);
	};

	return (
		<div className="bp-people">
			{canCreateBranch && (
				<div className="bp-branches-add">
					<Button
						type="button"
						text="Add Branch"
						Icon={Plus}
						iconPosition="left"
						appearance="standard"
						variant="brand"
						size="sm"
						onClick={handleAddBranch}
					/>
				</div>
			)}

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
};

export default BPBranches;
