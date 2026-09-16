import { Check, ChevronRight } from "lucide-react";
import type { AuditChecklistItem } from "../dealer-audit.types";

type Props = {
	item: AuditChecklistItem;
	onOpen: (item: AuditChecklistItem) => void;
};

export default function ChecklistItemRow({ item, onOpen }: Props) {
	const completed = item.status === "COMPLETED";
	return (
		<button
			type="button"
			onClick={() => onOpen(item)}
			className="group flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left last:border-b-0 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
		>
			<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
				{item.sequence}
			</span>
			<span className="min-w-0 flex-1">
				<span className="block text-sm font-semibold leading-snug text-slate-900">
					{item.title}
				</span>
				<span className="mt-0.5 block text-xs leading-snug text-slate-500 line-clamp-2">
					{item.description}
				</span>
			</span>
			<span
				className={
					completed
						? "flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
						: "size-5 shrink-0 rounded-full border-2 border-slate-300"
				}
				aria-label={completed ? "Completed" : "Pending"}
			>
				{completed ? <Check size={14} aria-hidden="true" /> : null}
			</span>
			<ChevronRight
				size={17}
				className="shrink-0 text-slate-400"
				aria-hidden="true"
			/>
		</button>
	);
}
