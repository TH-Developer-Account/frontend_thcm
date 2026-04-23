import React, { useEffect, useRef } from "react";
import type { SingleValue } from "react-select";
import SelectInput from "../FormElements/SelectInput";
import type { PaginationProps } from "./common.types";
import Button from "./Button";
import type { Option } from "../../modules/marketing/types";

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

	/* -------------------------------- */
	/* Auto Scroll To Top */
	/* -------------------------------- */
	useEffect(() => {
		if (!scrollTargetId) return;

		const el = document.getElementById(scrollTargetId);
		el?.scrollTo({ top: 0, behavior: "smooth" });
	}, [pageIndex, scrollTargetId]);

	/* -------------------------------- */
	/* Keyboard Navigation */
	/* -------------------------------- */
	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Home") {
			onPageChange(0);
		}
		if (e.key === "End") {
			onPageChange(totalPages - 1);
		}
	};

	const handlePageSizeChange = (option: SingleValue<Option>) => {
		if (!option) return;
		onPageSizeChange(Number(option.value));
	};

	const generatePages = (): (number | "ellipsis")[] => {
		const pages: (number | "ellipsis")[] = [];
		const windowSize = 1;

		const start = Math.max(2, currentPage - windowSize);
		const end = Math.min(totalPages - 1, currentPage + windowSize);

		pages.push(1);
		if (start > 2) pages.push("ellipsis");

		for (let i = start; i <= end; i++) {
			pages.push(i);
		}

		if (end < totalPages - 1) pages.push("ellipsis");
		if (totalPages > 1) pages.push(totalPages);

		return pages;
	};

	const pages = generatePages();

	const compact = variant === "compact";

	return (
		<div
			ref={containerRef}
			tabIndex={0}
			onKeyDown={handleKeyDown}
			className={`
				pagination
				${compact ? "pagination-compact" : "pagination-default"}
			`}
		>
			{!compact && (
				<div className="pagination-info">
					Page <span className="pagination-info-number">{currentPage}</span> of{" "}
					<span className="pagination-info-number">{totalPages}</span>
				</div>
			)}

			<div className="pagination-pages">
				<Button
					disabled={pageIndex === 0}
					onClick={() => onPageChange(pageIndex - 1)}
					text={"<"}
					status="brand"
				/>

				{pages.map((page, index) =>
					page === "ellipsis" ? (
						<span key={index} className="pagination-ellipsis">
							...
						</span>
					) : (
						<Button
							key={index}
							onClick={() => onPageChange(page - 1)}
							text={page}
							status="brand"
						/>
					),
				)}

				<Button
					disabled={pageIndex + 1 >= totalPages}
					onClick={() => onPageChange(pageIndex + 1)}
					text={">"}
					status="brand"
				/>
			</div>

			{!compact && (
				<div className="pagination-page-size">
					<SelectInput
						options={PAGE_SIZE_OPTIONS}
						value={PAGE_SIZE_OPTIONS.find(
							(option) => Number(option.value) === pageSize,
						)}
						onChange={handlePageSizeChange}
						isSearchable={false}
					/>
				</div>
			)}
		</div>
	);
};

export default Pagination;
