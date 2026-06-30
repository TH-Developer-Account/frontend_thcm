import React, { useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SingleValue } from "react-select";

type Option = { label: string; value: string };
import SelectInput from "../forms/SelectInput";
import Button from "./Button";
import type { PaginationProps } from "./common.types";

const PAGE_SIZE_OPTIONS: Option[] = [
	{ label: "15", value: "15" },
	{ label: "25", value: "25" },
	{ label: "50", value: "50" },
	{ label: "100", value: "100" },
];

type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

const getPaginationItems = (
	currentPage: number,
	totalPages: number,
): PaginationItem[] => {
	if (totalPages <= 5) {
		return Array.from({ length: totalPages }, (_, index) => index + 1);
	}

	const pages: PaginationItem[] = [1];

	const start = Math.max(2, currentPage - 1);
	const end = Math.min(totalPages - 1, currentPage + 1);

	if (start > 2) {
		pages.push("ellipsis-start");
	}

	for (let page = start; page <= end; page += 1) {
		pages.push(page);
	}

	if (end < totalPages - 1) {
		pages.push("ellipsis-end");
	}

	pages.push(totalPages);

	return pages;
};

const Pagination: React.FC<PaginationProps> = ({
	pageIndex,
	pageSize,
	totalPages,
	onPageChange,
	onPageSizeChange,
	variant = "default",
	scrollTargetId,
}) => {
	const safeTotalPages = Math.max(1, totalPages);
	const safePageIndex = Math.min(Math.max(pageIndex, 0), safeTotalPages - 1);

	const currentPage = safePageIndex + 1;
	const isCompact = variant === "compact";

	useEffect(() => {
		if (!scrollTargetId) return;

		const element = document.getElementById(scrollTargetId);

		element?.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	}, [safePageIndex, scrollTargetId]);

	const pages = useMemo(
		() => getPaginationItems(currentPage, safeTotalPages),
		[currentPage, safeTotalPages],
	);

	const selectedPageSize =
		PAGE_SIZE_OPTIONS.find((option) => Number(option.value) === pageSize) ??
		PAGE_SIZE_OPTIONS[0];

	const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
		if (event.key === "Home") {
			event.preventDefault();
			onPageChange(0);
			return;
		}

		if (event.key === "End") {
			event.preventDefault();
			onPageChange(safeTotalPages - 1);
		}
	};

	const handlePageSizeChange = (option: SingleValue<Option>) => {
		if (!option) return;

		onPageSizeChange(Number(option.value));
	};

	return (
		<nav
			className={[
				"pagination",
				isCompact ? "pagination-compact" : "pagination-default",
			].join(" ")}
			aria-label="Table pagination"
			onKeyDown={handleKeyDown}
		>
			{!isCompact ? (
				<p className="pagination-summary" aria-live="polite">
					Page <strong>{currentPage}</strong> of{" "}
					<strong>{safeTotalPages}</strong>
				</p>
			) : null}

			<div className="pagination-pages">
				<Button
					type="button"
					appearance="icon"
					variant="secondary"
					size="sm"
					Icon={ChevronLeft}
					aria-label="Previous page"
					disabled={safePageIndex === 0}
					onClick={() => onPageChange(safePageIndex - 1)}
				/>

				<div className="pagination-page-numbers">
					{pages.map((page) =>
						typeof page === "string" ? (
							<span
								key={page}
								className="pagination-ellipsis"
								aria-hidden="true"
							>
								…
							</span>
						) : (
							<Button
								key={page}
								type="button"
								appearance="filter"
								variant="secondary"
								size="sm"
								active={page === currentPage}
								text={String(page)}
								aria-label={`Go to page ${page}`}
								aria-current={page === currentPage ? "page" : undefined}
								onClick={() => onPageChange(page - 1)}
							/>
						),
					)}
				</div>

				<Button
					type="button"
					appearance="icon"
					variant="secondary"
					size="sm"
					Icon={ChevronRight}
					aria-label="Next page"
					disabled={safePageIndex + 1 >= safeTotalPages}
					onClick={() => onPageChange(safePageIndex + 1)}
				/>
			</div>

			{!isCompact ? (
				<div className="pagination-page-size">
					<span className="pagination-page-size-label">Rows per page</span>

					<SelectInput
						name="pageSize"
						options={PAGE_SIZE_OPTIONS}
						value={selectedPageSize}
						onChange={handlePageSizeChange}
						isSearchable={false}
						aria-label="Rows per page"
						className="pagination-page-size-select"
					/>
				</div>
			) : null}
		</nav>
	);
};

export default Pagination;
