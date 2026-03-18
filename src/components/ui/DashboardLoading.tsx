import { useEffect, useState } from "react";

const STEPS = [
	"Initializing",
	"Fetching data",
	"Processing",
	"Rendering",
	"Finalizing",
];

const DashboardLoading = () => {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		let pct = 0;

		const interval = setInterval(() => {
			pct = Math.min(pct + Math.random() * 15 + 5, 90);
			setProgress(Math.floor(pct));
		}, 200);

		return () => clearInterval(interval);
	}, []);

	const getStatusLabel = (progress: number) => {
		if (progress < 20) return STEPS[0];
		if (progress < 40) return STEPS[1];
		if (progress < 60) return STEPS[2];
		if (progress < 80) return STEPS[3];
		if (progress < 100) return STEPS[4];
		return "Done";
	};

	const statusLabel = getStatusLabel(progress);
	return (
		<div className=" bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 absolute inset-0 animate-[shimmer_1.5s_infinite]">
			<div className="flex flex-col items-center gap-5 bg-[#f5f4f1] border border-black/10 rounded-xl px-8 py-6 shadow-sm">
				{/* Icon */}
				<div className="w-11 h-11 rounded-lg bg-white border border-black/10 grid place-items-center animate-pulse">
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.8"
					>
						<rect x="3" y="3" width="7" height="7" rx="1" />
						<rect x="14" y="3" width="7" height="7" rx="1" />
						<rect x="3" y="14" width="7" height="7" rx="1" />
						<rect x="14" y="14" width="7" height="7" rx="1" />
					</svg>
				</div>

				{/* Progress Bar */}
				<div className="w-52 h-[2px] bg-[#e0dedd] rounded-full overflow-hidden">
					<div
						className="h-full bg-black transition-all duration-300 ease-out"
						style={{ width: `${progress}%` }}
					/>
				</div>

				{/* Status */}
				<div className="flex flex-col items-center gap-1">
					<span className="text-[11px] text-gray-500 tracking-widest uppercase font-mono">
						{statusLabel}
					</span>
					<span className="text-[11px] text-gray-400 font-mono">
						{progress}%
					</span>
				</div>
			</div>
		</div>
	);
};

export default DashboardLoading;
