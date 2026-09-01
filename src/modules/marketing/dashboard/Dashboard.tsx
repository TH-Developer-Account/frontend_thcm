import {
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
} from "recharts";

type EventRow = {
	id: string;
	type: "EPC" | "EPF" | "CRF";
	status: "Pending" | "Approved" | "Rejected";
	budget: number;
	participants: number;
};

type Props = {
	data: EventRow[];
};

const STATUS_COLORS = ["#22c55e", "#facc15", "#ef4444"];
const TYPE_COLOR = "#6366f1"; // single modern indigo tone

export const Dashboard = ({ data }: Props) => {
	const totalBudget = data.reduce((sum, row) => sum + row.budget, 0);
	const totalParticipants = data.reduce(
		(sum, row) => sum + row.participants,
		0,
	);
	const totalEvents = data.length;

	const statusCounts = ["Approved", "Pending", "Rejected"].map((status) => ({
		name: status,
		value: data.filter((d) => d.status === status).length,
	}));

	const budgetByType = ["EPC", "EPF", "CRF"].map((type) => ({
		name: type,
		budget: data
			.filter((d) => d.type === type)
			.reduce((sum, row) => sum + row.budget, 0),
	}));

	return (
		<div className="p-8 bg-gray-50 min-h-screen space-y-8">
			{/* KPI Section */}
			<div className="grid md:grid-cols-3 gap-6">
				<div className="bg-white rounded-2xl p-6 shadow-sm border">
					<p className="text-sm text-gray-500">Total Events</p>
					<p className="text-3xl font-semibold mt-2">{totalEvents}</p>
				</div>

				<div className="bg-white rounded-2xl p-6 shadow-sm border">
					<p className="text-sm text-gray-500">Total Budget</p>
					<p className="text-3xl font-semibold mt-2">
						₹{totalBudget.toLocaleString()}
					</p>
				</div>

				<div className="bg-white rounded-2xl p-6 shadow-sm border">
					<p className="text-sm text-gray-500">Participants</p>
					<p className="text-3xl font-semibold mt-2">{totalParticipants}</p>
				</div>
			</div>

			{/* Charts Section */}
			<div className="grid md:grid-cols-2 gap-8">
				{/* Budget Chart */}
				<div className="bg-white rounded-2xl p-6 shadow-sm border">
					<h3 className="text-lg font-medium mb-6">Budget by Type</h3>

					<ResponsiveContainer width="100%" height={280}>
						<BarChart data={budgetByType}>
							<CartesianGrid strokeDasharray="3 3" vertical={false} />
							<XAxis dataKey="name" />
							<YAxis />
							<Tooltip
								contentStyle={{
									borderRadius: "12px",
									border: "none",
								}}
							/>
							<Bar dataKey="budget" fill={TYPE_COLOR} radius={[10, 10, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>

				{/* Status Chart (Donut Style) */}
				<div className="bg-white rounded-2xl p-6 shadow-sm border">
					<h3 className="text-lg font-medium mb-6">Status Distribution</h3>

					<ResponsiveContainer width="100%" height={280}>
						<PieChart>
							<Pie
								data={statusCounts}
								dataKey="value"
								nameKey="name"
								innerRadius={70}
								outerRadius={100}
								paddingAngle={4}
							>
								{statusCounts.map((_, index) => (
									<Cell
										key={index}
										fill={STATUS_COLORS[index % STATUS_COLORS.length]}
									/>
								))}
							</Pie>
							<Tooltip />
						</PieChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
};
