import Button from "../../../../components/common/Button";
import { Edit, Trash } from "lucide-react";
import { useMasterData } from "../../../../hooks/useMasterData";
import { MasterLineItemTable } from "../../../../components/ui/MasterLineItemTable";
import { useState } from "react";

type Branch = {
	value: string;
	label: string;
};

const BranchesList = () => {
	const { data } = useMasterData();
	const branches_data = data?.branches ?? [];

	const [branches, setBranches] = useState(branches_data);

	// const handleAddBranch = (item: { id: string; label: string }) => {
	// 	setBranches([...branches, item]);
	// };
	return (
		<div className=" border-b-0 text-gray-600">
			<MasterLineItemTable
				title="Branches"
				nameLabel="Branch Name"
				items={branches}
				onChange={setBranches}
			/>
			<div className="overflow-y-auto scrollbar-sleek">
				<table className="w-full text-sm">
					<thead className="bg-gray-100">
						<tr>
							<th className="px-6 py-4 text-left">Branch Code</th>
							<th className="px-6 py-4 text-left">Branch Name</th>
							<th className="px-6 py-4 text-right">Actions</th>
						</tr>
					</thead>

					<tbody>
						{branches.map((branch: Branch, i: number) => (
							<tr
								key={branch?.value ?? i}
								className="border-t border-gray-200 hover:bg-gray-50"
							>
								<td className="px-6 py-4">{i + 1}</td>
								<td className="px-6 py-4">{branch?.label}</td>

								<td className="px-6 py-4">
									<div className="flex justify-end gap-2">
										<Button
											size="sm"
											Icon={Edit}
											variant="primary"
											isTooltip="Edit"
										/>
										<Button
											size="sm"
											Icon={Trash}
											variant="danger"
											isTooltip="Delete"
										/>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default BranchesList;
