import React, { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SingleValue } from "react-select";

import type { Option } from "../../modules/marketing/types";
import SelectInput from "../FormElements/SelectInput";
import Button from "./Button";
import type { PaginationProps } from "./common.types";

const PAGE_SIZE_OPTIONS: Option[] = [
	{ label: "15", value: "15" },
	{ label: "25", value: "25" },
	{ label: "50", value: "50" },
	{ label: "100", value: "100" },
];

const Pagination: React.FC<PaginationProps> = ({
	pageIndex,
	pageSize,
	totalPages,
	onPageChange,
	onPageSizeChange,
	variant = "default",
	scrollTargetId,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const currentPage = pageIndex + 1;
	const safeTotalPages = Math.max(1, totalPages);

	useEffect(() => {
		if (!scrollTargetId) return;

		const element = document.getElementById(scrollTargetId);
		element?.scrollTo({ top: 0, behavior: "smooth" });
	}, [pageIndex, scrollTargetId]);

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Home") {
			event.preventDefault();
			onPageChange(0);
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

	const generatePages = (): (number | "ellipsis-start" | "ellipsis-end")[] => {
		if (safeTotalPages <= 5) {
			return Array.from({ length: safeTotalPages }, (_, index) => index + 1);
		}

		const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [1];
		const start = Math.max(2, currentPage - 1);
		const end = Math.min(safeTotalPages - 1, currentPage + 1);

		if (start > 2) pages.push("ellipsis-start");
		for (let page = start; page <= end; page += 1) pages.push(page);
		if (end < safeTotalPages - 1) pages.push("ellipsis-end");
		pages.push(safeTotalPages);

		return pages;
	};

	const compact = variant === "compact";
	const pages = generatePages();

	return (
		<nav
			ref={containerRef}
			tabIndex={0}
			onKeyDown={handleKeyDown}
			className={`pagination ${compact ? "pagination-compact" : "pagination-default"}`}
			aria-label="Table pagination"
		>
			{!compact ? (
				<div className="pagination-summary" aria-live="polite">
					<span>Page</span>
					<strong>{currentPage}</strong>
					<span>of {safeTotalPages}</span>
				</div>
			) : null}

			<div className="pagination-pages">
				<Button
					type="button"
					appearance="icon"
					variant="secondary"
					size="sm"
					Icon={ChevronLeft}
					aria-label="Previous page"
					disabled={pageIndex === 0}
					onClick={() => onPageChange(pageIndex - 1)}
				/>

				{pages.map((page) =>
					typeof page === "string" ? (
						<span key={page} className="pagination-ellipsis" aria-hidden="true">
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
							text={page}
							aria-label={`Go to page ${page}`}
							aria-current={page === currentPage ? "page" : undefined}
							onClick={() => onPageChange(page - 1)}
						/>
					),
				)}

				<Button
					type="button"
					appearance="icon"
					variant="secondary"
					size="sm"
					Icon={ChevronRight}
					aria-label="Next page"
					disabled={pageIndex + 1 >= safeTotalPages}
					onClick={() => onPageChange(pageIndex + 1)}
				/>
			</div>

			{!compact ? (
				<label className="pagination-page-size">
					<span className="pagination-page-size-label">Rows</span>
					<SelectInput
						options={PAGE_SIZE_OPTIONS}
						value={PAGE_SIZE_OPTIONS.find(
							(option) => Number(option.value) === pageSize,
						)}
						onChange={handlePageSizeChange}
						isSearchable={false}
						aria-label="Rows per page"
						className="pagination-page-size-select"
					/>
				</label>
			) : null}
		</nav>
	);
};

export default Pagination;
