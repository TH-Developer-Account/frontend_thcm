import React, { useEffect, useRef } from "react";
import type { SingleValue } from "react-select";
import SelectInput, { type Option } from "../FormElements/SelectInput";

export interface PaginationProps {
	pageIndex: number;
	pageSize: number;
	totalPages: number;
	onPageChange: (pageIndex: number) => void;
	onPageSizeChange: (pageSize: number) => void;
	variant?: "default" | "compact";
	scrollTargetId?: string; // optional container id to scroll
}

const PAGE_SIZE_OPTIONS: Option[] = [
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
			className={`flex items-center justify-between gap-4 outline-none  ${
				compact ? "text-xs" : "text-sm"
			}`}
		>
			{!compact && (
				<div className="text-gray-600">
					Page <span className="font-semibold text-black">{currentPage}</span>{" "}
					of <span className="font-semibold text-black">{totalPages}</span>
				</div>
			)}

			<div className="flex items-center gap-1">
				<button
					disabled={pageIndex === 0}
					onClick={() => onPageChange(pageIndex - 1)}
					className={`rounded-lg border transition ${
						compact ? "px-2 py-1" : "px-3 py-1.5"
					} border-gray-200 bg-white hover:border-[#f35a00] hover:text-[#f35a00] disabled:opacity-40`}
				>
					{"<"}
				</button>

				{pages.map((page, index) =>
					page === "ellipsis" ? (
						<span key={index} className="px-2 text-gray-400">
							...
						</span>
					) : (
						<button
							key={index}
							onClick={() => onPageChange(page - 1)}
							className={`rounded-lg border transition ${
								compact ? "px-2 py-1" : "px-3 py-1.5"
							} ${
								currentPage === page
									? "bg-[#f35a00] text-white border-[#f35a00]"
									: "border-gray-200 bg-white hover:border-[#f35a00] hover:text-[#f35a00]"
							}`}
						>
							{page}
						</button>
					),
				)}

				<button
					disabled={pageIndex + 1 >= totalPages}
					onClick={() => onPageChange(pageIndex + 1)}
					className={`rounded-lg border transition ${
						compact ? "px-2 py-1" : "px-3 py-1.5"
					} border-gray-200 bg-white hover:border-[#f35a00] hover:text-[#f35a00] disabled:opacity-40`}
				>
					{">"}
				</button>
			</div>

			{!compact && (
				<div className="w-28">
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
