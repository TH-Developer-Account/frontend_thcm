import Button from "../../../../components/common/Button";
import { Edit, Trash } from "lucide-react";
import { useMasterData } from "../../../../hooks/useMasterData";

type BudgetNames = {
	value: string;
	label: string;
	budgetAmount?: string;
	description?: string;
};

const BudgetMasterList = () => {
	const { data } = useMasterData();
	const budget = data?.budgetMasters ?? [];
	console.log("budget", budget);
	return (
		<div className="bg-white mt-2 rounded-t-2xl border border-gray-200 border-b-0 text-gray-600">
			<div className="overflow-y-auto scrollbar-sleek">
				<table className="w-full text-sm">
					<thead className="bg-gray-100">
						<tr>
							<th className="px-6 py-4 text-left">Sn No.</th>
							<th className="px-6 py-4 text-left">Budget Name</th>
							<th className="px-6 py-4 text-right">Actions</th>
						</tr>
					</thead>

					<tbody>
						{budget.map((budget: BudgetNames, i: number) => {
							console.log("Buget Master info", budget);
							return (
								<tr
									key={budget?.value ?? i}
									className="border-t border-gray-200 hover:bg-gray-50"
								>
									<td className="px-6 py-4">{i + 1}</td>
									<td className="px-6 py-4">{budget?.description}</td>

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
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default BudgetMasterList;
