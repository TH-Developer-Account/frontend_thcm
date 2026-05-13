import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../../../components/ui/PageHeader";
import Loader from "../../../../components/ui/Loader";
import { useEpcListQuery } from "../queries/useEpcListQuery";

const toNumber = (value: string | null, fallback: number) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const EpcListingPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();

	const page = toNumber(searchParams.get("page"), 1);
	const limit = toNumber(searchParams.get("limit"), 10);
	const search = searchParams.get("search") || "";
	const status = searchParams.get("status") || "";

	const { data, isLoading, isFetching } = useEpcListQuery({
		page,
		limit,
		search,
		status,
	});

	const handleSearchChange = (value: string) => {
		const next = new URLSearchParams(searchParams);

		if (value) next.set("search", value);
		else next.delete("search");

		next.set("page", "1");
		setSearchParams(next);
	};

	if (isLoading) return <Loader />;

	return (
		<div className="page-stack-layout">
			<PageHeader
				headerText="Activity Planner"
				badgeProps={{
					text: "Create New EPC",
					direction: "forward",
					to: "/marketing/activity-planner/create",
				}}
			/>

			<div className="content-box p-4">
				<div className="mb-4 flex items-center justify-between gap-3">
					<input
						value={search}
						onChange={(event) => handleSearchChange(event.target.value)}
						placeholder="Search proposal, event, branch..."
						className="w-full max-w-sm rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
					/>

					{isFetching && (
						<span className="text-xs text-gray-500">Refreshing...</span>
					)}
				</div>

				{/* Replace this with your existing TanStack DataTable */}
				<pre className="text-xs bg-slate-50 border border-slate-200 rounded-md p-3 overflow-auto">
					{JSON.stringify(data, null, 2)}
				</pre>
			</div>
		</div>
	);
};

export default EpcListingPage;
