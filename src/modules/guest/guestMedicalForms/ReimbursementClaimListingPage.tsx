import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { Badge } from "../../../components/common/Badge";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import { useReimbursementClaimListQuery } from "./useReimbursementClaimQueries";
import type {
	ReimbursementClaimListItem,
	ReimbursementListingTab,
} from "./reimbursementClaim.types";

const TABS: Array<{ value: ReimbursementListingTab; label: string }> = [
	{ value: "createdByMe", label: "Created by me" },
	{ value: "pendingOnMe", label: "Pending on me" },
	{ value: "approvedByMe", label: "Approved by me" },
];

const ReimbursementClaimListingPage = () => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const [search, setSearch] = useState(searchParams.get("search") ?? "");
	const tab = (searchParams.get("tab") ??
		"createdByMe") as ReimbursementListingTab;
	const pageIndex = Math.max(Number(searchParams.get("page") ?? 1) - 1, 0);
	const pageSize = Number(searchParams.get("limit") ?? 25);

	const params = useMemo(
		() => ({
			tab,
			search: searchParams.get("search") ?? "",
			pageIndex,
			pageSize,
		}),
		[pageIndex, pageSize, searchParams, tab],
	);
	const claimsQuery = useReimbursementClaimListQuery(params);

	const updateParams = (updates: Record<string, string>) => {
		const next = new URLSearchParams(searchParams);
		Object.entries(updates).forEach(([key, value]) => next.set(key, value));
		setSearchParams(next);
	};

	const openClaim = (claim: ReimbursementClaimListItem) => {
		const editable = ["DRAFT", "CLARIFICATION_REQUESTED"].includes(
			claim.status,
		);
		navigate(`/medical-claim/form/${claim.id}/${editable ? "edit" : "view"}`);
	};

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Medical Reimbursement Forms"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Medical reimbursement forms",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{ label: "Medical Reimbursement Forms" },
					],
					separator: "›",
				}}
			/>

			<Card>
				<div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
					<div className="flex gap-2" role="tablist">
						{TABS.map((item) => (
							<Button
								key={item.value}
								variant={tab === item.value ? "brand" : "outline"}
								onClick={() => updateParams({ tab: item.value, page: "1" })}
							>
								{item.label}
							</Button>
						))}
					</div>
					<Button onClick={() => navigate("/medical-claim/form/create")}>
						New claim
					</Button>
				</div>

				<form
					className="my-4 flex gap-2"
					onSubmit={(event) => {
						event.preventDefault();
						updateParams({ search: search.trim(), page: "1" });
					}}
				>
					<input
						className="w-full rounded-md border px-3 py-2"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Search claim number, employee or ticket number"
					/>
					<Button type="submit">Search</Button>
				</form>

				{claimsQuery.isLoading ? (
					<div role="status">Loading medical claims...</div>
				) : claimsQuery.isError ? (
					<div role="alert">Unable to load medical claims.</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm">
							<thead>
								<tr className="border-b">
									<th>Claim no.</th>
									<th>Employee</th>
									<th>Ticket no.</th>
									<th>Claim for</th>
									<th>Amount</th>
									<th>Status</th>
									<th>Created</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{claimsQuery.data?.items.map((claim) => (
									<tr key={claim.id} className="border-b">
										<td>{claim.claimNumber}</td>
										<td>{claim.employeeName}</td>
										<td>{claim.ticketNumber}</td>
										<td>{claim.claimFor}</td>
										<td>₹{claim.totalClaimAmount.toLocaleString("en-IN")}</td>
										<td>
											<Badge>{claim.status.replaceAll("_", " ")}</Badge>
										</td>
										<td>
											{new Date(claim.createdAt).toLocaleDateString("en-IN")}
										</td>
										<td>
											<Button
												variant="outline"
												onClick={() => openClaim(claim)}
											>
												Open
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						{claimsQuery.data?.items.length === 0 && (
							<p className="py-8 text-center">No medical claims found.</p>
						)}
					</div>
				)}

				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant="outline"
						disabled={pageIndex === 0}
						onClick={() => updateParams({ page: String(pageIndex) })}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						disabled={
							!claimsQuery.data || pageIndex + 1 >= claimsQuery.data.totalPages
						}
						onClick={() => updateParams({ page: String(pageIndex + 2) })}
					>
						Next
					</Button>
				</div>
			</Card>
		</PageSectionLayout>
	);
};

export default ReimbursementClaimListingPage;
