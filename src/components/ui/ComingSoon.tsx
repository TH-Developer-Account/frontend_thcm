import React from "react";
// import gif2 from "../../assets/excavator.gif";
// import gif1 from "../../assets/backhoe-loader.gif";
// import gif3 from "../../assets/wheel-loader.gif";

export default function ComingSoon() {
	return (
		<React.Fragment>
			<div className="coming-soon-wrapper min-h-[89vh] overflow-hidden bg-transparent">
				{/* Brand */}
				<div className="coming-soon-brand">
					<span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
					Tata Hitachi · Under Development
				</div>

				{/* Heading */}
				<div className="text-center mb-3">
					<p className="text-[11px] tracking-[0.22em] uppercase text-stone-500 mb-2 font-bold">
						We're building something big
					</p>

					<h1 className="coming-soon-title">
						COMING <span className="text-yellow-400">SOON</span>
					</h1>
				</div>

				{/* Subtext */}
				<p className="coming-soon-text">
					Our new module is under active construction. Our team is hard at work
					and we'll be ready to roll soon.
				</p>
			</div>
		</React.Fragment>
	);
}
// const Coming = () => {
// 	return (
// 		<div className="coming-soon-wrapper">
// 			{/* Top hazard */}
// 			<div className="coming-soon-hazard-top" />

// 			{/* Brand */}
// 			<div className="coming-soon-brand">
// 				<span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
// 				Tata Hitachi · Under Development
// 			</div>

// 			{/* Heading */}
// 			<div className="text-center mb-3">
// 				<p className="text-[11px] tracking-[0.22em] uppercase text-stone-500 mb-2 font-bold">
// 					We're building something big
// 				</p>

// 				<h1 className="coming-soon-title">
// 					COMING <span className="text-yellow-400">SOON</span>
// 				</h1>
// 			</div>

// 			{/* Subtext */}
// 			<p className="coming-soon-text">
// 				Our new module is under active construction. Our team is hard at work
// 				and we'll be ready to roll soon.
// 			</p>

// 			{/* Countdown */}
// 			{/* <div className="flex items-end gap-3 mb-12 font-bebas">
// 				<Count num={time.days} label="Days" />
// 				<span className="text-4xl text-stone-300">:</span>
// 				<Count num={time.hours} label="Hours" />
// 				<span className="text-4xl text-stone-300">:</span>
// 				<Count num={time.mins} label="Mins" />
// 				<span className="text-4xl text-stone-300">:</span>
// 				<Count num={time.secs} label="Secs" />
// 			</div> */}

// 			{/* Success Message */}
// 			{/* <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-300 px-5 py-3 rounded-lg font-medium text-sm">
// 				✓ You're on the list — we'll ping you when it's live!
// 			</div> */}

// 			{/* Scene */}
// 			<div className="coming-soon-scene">
// 				{/* Excavator */}
// 				{/* <img src={gif2} className="coming-soon-backhoe" alt="BackHoe" /> */}
// 				<img src={gif2} className="coming-soon-excavator" alt="Excavator" />
// 				{/* <img src={gif2} className="coming-soon-wheel" alt="WheelLoader" /> */}

// 				{/* Ground */}
// 				<div className="coming-soon-ground" />

// 				{/* Road line */}
// 				<div className="coming-soon-road" />

// 				{/* Tape */}
// 				<div className="coming-soon-tape" />
// 			</div>
// 		</div>
// 	);
// };
