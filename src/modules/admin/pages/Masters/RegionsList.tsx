import Button from "../../../../components/common/Button";
import { Edit, Trash } from "lucide-react";
import { useMasterData } from "../../../../hooks/useMasterData";

type Region = {
	value: string;
	label: string;
};

const RegionsList = () => {
	const { data } = useMasterData();
	const regions = data?.regions ?? [];

	return (
		<div className="bg-white mt-2 rounded-t-2xl border border-gray-200 border-b-0 text-gray-600">
			<div className="overflow-y-auto scrollbar-sleek">
				<table className="w-full text-sm">
					<thead className="bg-gray-100">
						<tr>
							<th className="px-6 py-4 text-left">Sn No.</th>
							<th className="px-6 py-4 text-left">Event Name</th>
							<th className="px-6 py-4 text-right">Actions</th>
						</tr>
					</thead>

					<tbody>
						{regions.map((region: Region, i: number) => (
							<tr
								key={region?.value ?? i}
								className="border-t border-gray-200 hover:bg-gray-50"
							>
								<td className="px-6 py-4">{i + 1}</td>
								<td className="px-6 py-4">{region?.label}</td>

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

export default RegionsList;
